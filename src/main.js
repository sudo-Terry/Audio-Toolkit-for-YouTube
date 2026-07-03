/*
 * main.js — 진입점 (격리 월드)
 *   - 설정 로드 후 MAIN 월드 오디오 엔진에 전달(broadcast)
 *   - 유튜브 SPA 네비게이션 대응(버튼 재주입 + 재전달)
 *   - MAIN 월드의 설정 요청에 응답
 *   - popup 등 다른 컨텍스트의 변경을 반영(자기 트리거는 무시)
 */
(() => {
  "use strict";
  const NS = (window.YAT = window.YAT || {});

  async function init() {
    await NS.loadSettings();
    NS.broadcast();
    NS.injectButton();
  }

  document.addEventListener("yt-navigate-finish", () => {
    NS.injectButton();
    NS.broadcast();
  });

  const observer = new MutationObserver(() => NS.injectButton());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // MAIN 월드 오디오 엔진이 로드 시 설정을 요청하면 응답
  window.addEventListener("message", (e) => {
    if (e.source !== window) return;
    const d = e.data;
    if (!d || d.__yat !== true) return;
    if (d.type === "request") NS.broadcast();
  });

  // popup 등 다른 컨텍스트의 변경 반영 (이 컨텍스트가 쓴 변경은 무시)
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes[NS.STORAGE_KEY]) return;
      if (NS._selfWrite) {
        NS._selfWrite = false;
        return;
      }
      NS.settings = { ...NS.DEFAULTS, ...changes[NS.STORAGE_KEY].newValue };
      NS.broadcast();
      NS.syncPanel();
    });
  } catch (e) {}

  init();
})();
