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
    boost: 100, // 볼륨 % (100 = 기본, 최대 200)
    compressor: false, // 야간 모드
    mono: false, // 모노 병합
    balance: 0, // 좌우 밸런스 (-100 왼쪽 ~ +100 오른쪽)
  });

  NS.settings = { ...NS.DEFAULTS };

  // 각 기능 도움말(hover 가이드). 큰따옴표는 HTML 속성과 충돌하니 사용 금지.
  NS.TIPS = Object.freeze({
    boost:
      "영상 소리 자체가 너무 작을 때 사용하세요. 유튜브 기본 100%를 넘어 최대 200%까지 키웁니다.",
    balance:
      "소리가 한쪽으로 치우쳐 들릴 때 좌우 균형을 맞춥니다. 왼쪽/오른쪽 버튼으로 미세 조정할 수 있어요.",
    compressor:
      "큰 소리와 작은 소리의 차이가 클 때 켜세요. 광고·효과음의 볼륨 튐을 눌러 밤에도 편하게 들을 수 있습니다.",
    mono:
      "좌우 채널을 하나로 합칩니다. 한쪽 이어폰만 끼거나, 좌우 분리가 어색한 영상에서 유용합니다.",
  });

  // 범위를 벗어난 저장값 보정(예: 이전 버전에서 저장된 boost 500)
  NS.normalize = function (s) {
    s.boost = NS.clamp(Number(s.boost) || 100, 100, 200);
    s.balance = NS.clamp(Number(s.balance) || 0, -100, 100);
    return s;
  };

  NS.loadSettings = function () {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(NS.STORAGE_KEY, (res) => {
          if (res && res[NS.STORAGE_KEY]) {
            NS.settings = NS.normalize({ ...NS.DEFAULTS, ...res[NS.STORAGE_KEY] });
          }
          resolve();
        });
      } catch (e) {
        resolve();
      }
    });
  };

  // 이 컨텍스트가 방금 쓴 변경인지 표시(storage.onChanged 자기 트리거 무시용)
  NS._selfWrite = false;

  NS.saveSettings = function () {
    try {
      NS._selfWrite = true;
      chrome.storage.local.set({ [NS.STORAGE_KEY]: NS.settings });
    } catch (e) {
      /* 확장 컨텍스트 무효화 시 무시 */
    }
  };

  // MAIN 월드 오디오 엔진으로 현재 설정 전달
  NS.broadcast = function () {
    window.postMessage({ __yat: true, type: "settings", settings: NS.settings }, "*");
  };

  // 설정 변경 후 저장 + 오디오 반영을 한 번에
  NS.commit = function () {
    NS.saveSettings();
    NS.broadcast();
  };

  /* 공용 유틸 */
  NS.clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  NS.balanceLabel = (v) => {
    if (v === 0) return "중앙";
    return v < 0 ? `L ${-v}` : `R ${v}`;
  };
})();
