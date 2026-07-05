/*
 * ui-panel.js — 유튜브 컨트롤바에 컴프레서(야간 모드) on/off 토글 버튼 주입 (격리 월드)
 *
 * 재생바에서 한 번의 클릭으로 컴프레서를 켜고 끈다. 켜지면 아이콘이 빨간색으로 바뀐다.
 * 볼륨 부스트·좌우 밸런스·모노 등 나머지 설정은 툴바 아이콘 팝업에서 조절한다.
 */
(() => {
  "use strict";
  const NS = (window.YAT = window.YAT || {});

  // 확장 아이콘과 동일한 이퀄라이저 막대 모양. fill=currentColor 라서 CSS 로 색을 제어한다.
  // (꺼짐: 흰색 / 켜짐: 빨간색 — .yat-on)
  const COMP_SVG = `
    <svg height="100%" viewBox="0 0 36 36" width="100%" fill="currentColor">
      <rect x="4"  y="14.5" width="4" height="7"  rx="2"></rect>
      <rect x="10" y="11"   width="4" height="14" rx="2"></rect>
      <rect x="16" y="7.5"  width="4" height="21" rx="2"></rect>
      <rect x="22" y="12"   width="4" height="12" rx="2"></rect>
      <rect x="28" y="15"   width="4" height="6"  rx="2"></rect>
    </svg>`;

  function updateButton(btn) {
    btn = btn || document.querySelector(".yat-comp-button");
    if (!btn) return;
    const on = !!NS.settings.compressor;
    btn.classList.toggle("yat-on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.title = on
      ? "컴프레서(야간 모드) 켜짐 — 클릭하여 끄기"
      : "컴프레서(야간 모드) 꺼짐 — 클릭하여 켜기";
  }

  NS.injectButton = function () {
    if (document.querySelector(".yat-comp-button")) return;
    const left = document.querySelector(".ytp-left-controls");
    if (!left) return;

    const btn = document.createElement("button");
    btn.className = "ytp-button yat-comp-button";
    btn.innerHTML = COMP_SVG;
    updateButton(btn);

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      NS.settings.compressor = !NS.settings.compressor;
      NS.commit();
      updateButton(btn);
    });

    // 볼륨 조절기 바로 오른쪽(볼륨 옆)에 배치. insertAdjacentElement 는 부모-자식
    // 제약이 없어 어떤 DOM 구조에서도 안전하다. 볼륨 영역이 없으면 왼쪽 컨트롤 끝에 추가.
    const volume = left.querySelector(".ytp-volume-area");
    if (volume) {
      volume.insertAdjacentElement("afterend", btn);
    } else {
      left.appendChild(btn);
    }
  };

  // 외부(popup)에서 설정이 바뀌면 버튼 상태 갱신
  NS.refreshButton = function () {
    updateButton();
  };
})();
