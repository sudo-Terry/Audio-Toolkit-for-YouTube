/*
 * audio-engine.js — Web Audio 그래프 (MAIN 월드에서 실행)
 *
 * 유튜브 페이지에는 video 요소가 여러 개 있을 수 있다(본 영상, 인라인 미리보기,
 * Shorts 등). 로드 시점에 querySelector 로 아무 video 나 잡으면 본 영상이 아닌
 * 요소에 붙어 "소리는 정상인데 효과가 없는" 상태가 된다. 그래서 document 캡처
 * 단계의 `play` 이벤트로 "실제로 재생되는" video 를 잡아 각각 hook 한다.
 *
 * 체인(video 마다 개별 그래프, 활성 노드만 순서대로 연결):
 *   video → source → [compressor] → gain → panner → [mono] → destination
 *
 * gain 은 컴프레서 "뒤"의 makeup gain(jebibot/cheese-knife 참고 토폴로지).
 * 설정은 격리 월드 UI 로부터 window.postMessage 로 받는다.
 */
(() => {
  "use strict";

  const DEFAULTS = {
    enabled: true,
    boost: 100, // % (100~200)
    compressor: false,
    mono: false,
    balance: 0,
  };
  let settings = { ...DEFAULTS };

  let audioCtx = null;
  const graphs = new Map(); // video → { source, comp, gain, panner, mono }

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function resumeCtx() {
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
  }

  /* ---------- video 별 그래프 생성/적용 ---------- */

  function hook(video) {
    if (graphs.has(video)) return graphs.get(video);

    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();

      const source = audioCtx.createMediaElementSource(video);

      // 야간 모드 프리셋 — cheese-knife 의 검증된 값(음량 평탄화에 공격적)
      const comp = audioCtx.createDynamicsCompressor();
      comp.threshold.value = -50;
      comp.knee.value = 40;
      comp.ratio.value = 12;
      comp.attack.value = 0;
      comp.release.value = 0.25;

      const gain = audioCtx.createGain();
      const panner = audioCtx.createStereoPanner();

      // 모노 다운믹스: channelCount=1 + explicit → L/R 평균 후 스테레오로 업믹스
      const mono = audioCtx.createGain();
      mono.channelCount = 1;
      mono.channelCountMode = "explicit";
      mono.channelInterpretation = "speakers";

      const g = { source, comp, gain, panner, mono };
      graphs.set(video, g);
      applyGraph(g);
      return g;
    } catch (e) {
      console.warn("[YAT] video 연결 실패:", e);
      return null;
    }
  }

  function applyGraph(g) {
    const { source, comp, gain, panner, mono } = g;

    [source, comp, gain, panner, mono].forEach((n) => {
      try {
        n.disconnect();
      } catch (e) {}
    });

    if (!settings.enabled) {
      source.connect(audioCtx.destination); // 마스터 Off: 원음 그대로
      return;
    }

    const chain = [];
    if (settings.compressor) chain.push(comp); // 먼저 다이나믹 레인지 압축
    chain.push(gain); // makeup gain — 압축 뒤 음량 보정(값 1이면 무변화)
    chain.push(panner); // 밸런스 0이면 무변화
    if (settings.mono) chain.push(mono);

    let node = source;
    chain.forEach((next) => {
      node.connect(next);
      node = next;
    });
    node.connect(audioCtx.destination);

    gain.gain.value = clamp(settings.boost, 100, 200) / 100;
    panner.pan.value = clamp(settings.balance / 100, -1, 1);
  }

  function applyAll() {
    resumeCtx();
    graphs.forEach((g) => applyGraph(g));
  }

  /* ---------- 재생되는 video 를 잡아 hook ---------- */

  // play 는 버블링하지 않지만 캡처 단계에서는 document 까지 도달한다.
  document.addEventListener(
    "play",
    (e) => {
      const t = e.target;
      if (t && t.tagName === "VIDEO") {
        hook(t);
        resumeCtx();
      }
    },
    true
  );

  // 스크립트 로드 시 이미 재생 중인 video 처리 (새로고침 직후 등)
  function hookPlaying() {
    document.querySelectorAll("video").forEach((v) => {
      if (!v.paused && !v.ended) hook(v);
    });
  }
  hookPlaying();

  // autoplay 정책으로 컨텍스트가 suspended 면 첫 사용자 입력에서 resume
  ["pointerdown", "keydown"].forEach((type) =>
    document.addEventListener(type, resumeCtx, { capture: true, passive: true })
  );

  /* ---------- 격리 월드 UI 와의 통신 ---------- */

  window.addEventListener("message", (e) => {
    if (e.source !== window) return;
    const d = e.data;
    if (!d || d.__yat !== true) return;
    if (d.type === "settings") {
      settings = { ...DEFAULTS, ...d.settings };
      applyAll();
    }
  });

  // 로드 직후 현재 설정을 요청(격리 월드가 응답)
  window.postMessage({ __yat: true, type: "request" }, "*");
})();
