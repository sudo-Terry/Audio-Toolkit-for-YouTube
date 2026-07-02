/*
 * main.js — 진입점: 초기화, 유튜브 SPA 네비게이션 대응, 외부 설정 동기화
 * (manifest 의 js 배열 마지막에 로드되어야 한다.)
 */
(() => {
  "use strict";
  const NS = (window.YAT = window.YAT || {});

  async function init() {
    await NS.loadSettings();
    NS.attachToVideo();
    NS.injectButton();
  }

  // 유튜브 SPA 페이지 전환 시 재연결/재주입
  document.addEventListener("yt-navigate-finish", () => {
    NS.attachToVideo();
    NS.injectButton();
  });

  // 컨트롤바/비디오가 늦게 렌더될 때 대비
  const observer = new MutationObserver(() => {
    NS.attachToVideo();
    NS.injectButton();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // popup 등 다른 컨텍스트에서 설정 변경 시 실시간 반영
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes[NS.STORAGE_KEY]) {
        NS.settings = { ...NS.DEFAULTS, ...changes[NS.STORAGE_KEY].newValue };
        NS.onExternalChange();
      }
    });
  } catch (e) {}

  init();
})();
