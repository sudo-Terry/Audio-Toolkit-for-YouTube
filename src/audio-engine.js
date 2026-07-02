/*
 * audio-engine.js — Web Audio 그래프 구성 및 적용
 *
 * 체인(활성 노드만 순서대로 연결):
 *   video → source → gain → [compressor] → panner → [mono] → destination
 *
 * createMediaElementSource 는 video 요소당 1회만 호출 가능 → WeakSet 으로 추적.
 */
(() => {
  "use strict";
  const NS = (window.YAT = window.YAT || {});

  let audioCtx = null;
  let sourceNode = null;
  let gainNode = null;
  let compressorNode = null;
  let pannerNode = null;
  let monoNode = null;

  const hookedVideos = new WeakSet();
  let currentVideo = null;

  function ensureContext(video) {
    if (sourceNode && currentVideo === video) return true;
    // 이미 hook 흔적이 있는 새 요소는 재사용 불가(중복 생성 방지)
    if (hookedVideos.has(video) && currentVideo !== video) return !!sourceNode;

    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      sourceNode = audioCtx.createMediaElementSource(video);

      gainNode = audioCtx.createGain();

      compressorNode = audioCtx.createDynamicsCompressor();
      compressorNode.threshold.value = -30;
      compressorNode.knee.value = 24;
      compressorNode.ratio.value = 6;
      compressorNode.attack.value = 0.003;
      compressorNode.release.value = 0.25;

      pannerNode = audioCtx.createStereoPanner();

      // 모노 다운믹스: channelCount=1 + explicit → L/R 평균 후 스테레오로 업믹스
      monoNode = audioCtx.createGain();
      monoNode.channelCount = 1;
      monoNode.channelCountMode = "explicit";
      monoNode.channelInterpretation = "speakers";

      hookedVideos.add(video);
      currentVideo = video;
      return true;
    } catch (e) {
      console.warn("[YAT] AudioContext 생성 실패:", e);
      return false;
    }
  }

  function rebuildGraph() {
    if (!sourceNode) return;
    const s = NS.settings;

    [sourceNode, gainNode, compressorNode, pannerNode, monoNode].forEach((n) => {
      try {
        n.disconnect();
      } catch (e) {}
    });

    if (!s.enabled) {
      sourceNode.connect(audioCtx.destination); // 마스터 Off: 원음 그대로
      return;
    }

    const chain = [gainNode]; // 부스트는 항상 통과(값 1이면 무변화)
    if (s.compressor) chain.push(compressorNode);
    chain.push(pannerNode); // 밸런스 0이면 무변화
    if (s.mono) chain.push(monoNode);

    let node = sourceNode;
    chain.forEach((next) => {
      node.connect(next);
      node = next;
    });
    node.connect(audioCtx.destination);
  }

  function applyValues() {
    if (!gainNode) return;
    const s = NS.settings;
    gainNode.gain.value = s.enabled ? s.boost / 100 : 1;
    pannerNode.pan.value = s.enabled ? NS.clamp(s.balance / 100, -1, 1) : 0;
  }

  // 설정을 실제 오디오 그래프에 반영
  NS.apply = function () {
    if (!sourceNode) return;
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    rebuildGraph();
    applyValues();
  };

  // 현재 페이지의 <video>를 찾아 오디오 그래프에 연결
  NS.attachToVideo = function () {
    const video = document.querySelector("video");
    if (!video) return;
    if (!ensureContext(video)) return;

    NS.apply();
    video.addEventListener("playing", () => {
      if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
    });
  };
})();
