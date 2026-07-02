/*
 * settings.js — 설정 상태와 chrome.storage 영속화
 *
 * 콘텐츠 스크립트는 번들러 없이 같은 격리 스코프에서 순서대로 실행된다.
 * 파일 간 공유는 window.YAT 네임스페이스로 한다.
 */
(() => {
  "use strict";
  const NS = (window.YAT = window.YAT || {});

  NS.STORAGE_KEY = "yat-settings";

  NS.DEFAULTS = Object.freeze({
    enabled: true, // 마스터 On/Off (Off = 원음 그대로 통과)
    boost: 100, // 볼륨 % (100 = 기본, 최대 500)
    compressor: false, // 야간 모드
    mono: false, // 모노 병합
    balance: 0, // 좌우 밸런스 (-100 왼쪽 ~ +100 오른쪽)
  });

  NS.settings = { ...NS.DEFAULTS };

  NS.loadSettings = function () {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(NS.STORAGE_KEY, (res) => {
          if (res && res[NS.STORAGE_KEY]) {
            NS.settings = { ...NS.DEFAULTS, ...res[NS.STORAGE_KEY] };
          }
          resolve();
        });
      } catch (e) {
        resolve();
      }
    });
  };

  NS.saveSettings = function () {
    try {
      chrome.storage.local.set({ [NS.STORAGE_KEY]: NS.settings });
    } catch (e) {
      /* 확장 컨텍스트 무효화 시 무시 */
    }
  };

  // 설정 변경 후 저장 + 오디오 반영을 한 번에
  NS.commit = function () {
    NS.saveSettings();
    if (NS.apply) NS.apply();
  };

  /* 공용 유틸 */
  NS.clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  NS.balanceLabel = (v) => {
    if (v === 0) return "중앙";
    return v < 0 ? `L ${-v}` : `R ${v}`;
  };
})();
