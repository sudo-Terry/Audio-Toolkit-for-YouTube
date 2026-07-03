/*
 * audio-engine.js — Web Audio 그래프 (MAIN 월드에서 실행)
 *
 * 격리 월드(콘텐츠 스크립트)의 AudioContext 로는 유튜브 오디오가
 * 실제로 라우팅되지 않는 경우가 있어, 오디오 처리는 페이지와 같은
 * MAIN 월드에서 수행한다. 설정은 격리 월드 UI 로부터 window.postMessage 로 받는다.
 *
 * 체인(활성 노드만 순서대로 연결):
 *   video → source → [compressor] → gain → panner → [mono] → destination
 *
 * gain 은 컴프레서 "뒤"에 둔다(makeup gain 토폴로지). 큰 소리를 먼저 누른 뒤
 * 전체 음량을 보정하는 컴프레서의 정석 구조로, jebibot/cheese-knife 를 참고했다.
 */
(() => {
  "use strict";

  const DEFAULTS = {
    enabled: true,
    boost: 100,
    compressor: false,
    mono: false,
    balance: 0,
  };
  let settings = { ...DEFAULTS };

  let audioCtx = null;
  let sourceNode = null;
  let gainNode = null;
  let compressorNode = null;
  let pannerNode = null;
  let monoNode = null;

  const hookedVideos = new WeakSet();
  let currentVideo = null;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function resumeCtx() {
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
  }

  function ensureContext(video) {
    if (sourceNode && currentVideo === video) return true;
    if (hookedVideos.has(video) && currentVideo !== video) return !!sourceNode;

    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      sourceNode = audioCtx.createMediaElementSource(video);

      gainNode = audioCtx.createGain();

      // 야간 모드 프리셋 — cheese-knife 의 검증된 값 참고(음량 평탄화에 공격적)
      compressorNode = audioCtx.createDynamicsCompressor();
      compressorNode.threshold.value = -50;
      compressorNode.knee.value = 40;
      compressorNode.ratio.value = 12;
      compressorNode.attack.value = 0;
      compressorNode.release.value = 0.25;

      pannerNode = audioCtx.createStereoPanner();

      // 모노 다운믹스: channelCount=1 + explicit → L/R 평균 후 스테레오로 업믹스
      monoNode = audioCtx.createGain();
      monoNode.channelCount = 1;
      monoNode.channelCountMode = "explicit";
      monoNode.channelInterpretation = "speakers";

      hookedVideos.add(video);
      currentVideo = video;
      video.addEventListener("playing", resumeCtx);
      return true;
    } catch (e) {
      console.warn("[YAT] 오디오 연결 실패:", e);
      return false;
    }
  }

  function rebuildGraph() {
    if (!sourceNode) return;

    [sourceNode, gainNode, compressorNode, pannerNode, monoNode].forEach((n) => {
      try {
        n.disconnect();
      } catch (e) {}
    });

    if (!settings.enabled) {
      sourceNode.connect(audioCtx.destination); // 마스터 Off: 원음 그대로
      return;
    }

    const chain = [];
    if (settings.compressor) chain.push(compressorNode); // 먼저 다이나믹 레인지 압축
    chain.push(gainNode); // makeup gain — 압축 뒤 음량 보정(값 1이면 무변화)
    chain.push(pannerNode); // 밸런스 0이면 무변화
    if (settings.mono) chain.push(monoNode);

    let node = sourceNode;
    chain.forEach((next) => {
      node.connect(next);
      node = next;
    });
    node.connect(audioCtx.destination);
  }

  function applyValues() {
    if (!gainNode) return;
    gainNode.gain.value = settings.enabled ? settings.boost / 100 : 1;
    pannerNode.pan.value = settings.enabled ? clamp(settings.balance / 100, -1, 1) : 0;
  }

  function apply() {
    if (!sourceNode) return;
    resumeCtx();
    rebuildGraph();
    applyValues();
  }

  // 현재 <video>를 찾아 그래프에 연결. 이미 연결돼 있으면 재적용하지 않음.
  function attach() {
    const video = document.querySelector("video");
    if (!video) return;
    const before = sourceNode;
    if (!ensureContext(video)) return;
    if (sourceNode !== before) apply(); // 새로 연결된 경우에만
  }

  /* ---------- 격리 월드 UI 와의 통신 ---------- */

  window.addEventListener("message", (e) => {
    if (e.source !== window) return;
    const d = e.data;
    if (!d || d.__yat !== true) return;
    if (d.type === "settings") {
      settings = { ...DEFAULTS, ...d.settings };
      apply();
    }
  });

  // 로드 직후 현재 설정을 요청(격리 월드가 응답)
  window.postMessage({ __yat: true, type: "request" }, "*");

  /* ---------- 유튜브 SPA 대응 ---------- */

  document.addEventListener("yt-navigate-finish", attach);
  const observer = new MutationObserver(() => attach());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  attach();
})();
