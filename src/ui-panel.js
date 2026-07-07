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
    btn.title = chrome.i18n.getMessage(on ? "compOn" : "compOff");
  }

  // 네이티브 재생 버튼의 실제 크기(버튼 크기 + 아이콘 크기/패딩)를 그대로 복사한다.
  // 유튜브는 전체화면 등에서 컨트롤 버튼 크기를 px 로 바꾸므로, 값을 복사하고
  // resize/fullscreenchange 에 재동기화하면 어떤 플레이어 크기에서도 어긋나지 않는다.
  function syncNativeStyle(btn) {
    const ref =
      document.querySelector(".ytp-play-button") ||
      document.querySelector(".ytp-mute-button");
    if (!ref) return;
    const rcs = getComputedStyle(ref);
    btn.style.width = rcs.width;
    btn.style.height = rcs.height;
    // 세로 정렬용 상/하 margin 은 재생 버튼에서, 좌우 간격은 볼륨 영역의
    // margin-left(아이콘 버튼 표준 간격, 플레이어 크기에 따라 스케일)에서 복사한다.
    // 그러지 않으면 flex 레이아웃에서 양옆 요소에 딱 붙는다.
    btn.style.marginTop = rcs.marginTop;
    btn.style.marginBottom = rcs.marginBottom;
    const vol = document.querySelector(".ytp-volume-area");
    btn.style.marginLeft = vol ? getComputedStyle(vol).marginLeft : "12px";
    btn.style.marginRight = "0px";
    const svg = btn.querySelector("svg");
    const rSvg = ref.querySelector("svg");
    if (svg && rSvg) {
      const scs = getComputedStyle(rSvg);
      svg.style.width = scs.width;
      svg.style.height = scs.height;
      svg.style.padding = scs.padding;
    }
  }

  NS.injectButton = function () {
    if (document.querySelector(".yat-comp-button")) return;
    const left = document.querySelector(".ytp-left-controls");
    if (!left) return;

    const btn = document.createElement("button");
    btn.className = "ytp-button yat-comp-button";
    // .yat-hl: hover/active 하이라이트 레이어. 유튜브가 ::before/::after 를
    // 자체 용도로 쓰므로 pseudo 대신 실제 자식 요소를 쓴다.
    btn.innerHTML = '<span class="yat-hl"></span>' + COMP_SVG;
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

    syncNativeStyle(btn);
    observeNative();
  };

  // 외부(popup)에서 설정이 바뀌면 버튼 상태 갱신
  NS.refreshButton = function () {
    updateButton();
  };

  // 네이티브 버튼 크기가 바뀔 때마다(전체화면/시어터/창 크기/비율 등 모든 경우)
  // 우리 버튼을 재동기화. 이벤트가 아닌 ResizeObserver 라 트리거를 놓치지 않는다.
  let ro = null;
  function observeNative() {
    const ref =
      document.querySelector(".ytp-play-button") ||
      document.querySelector(".ytp-mute-button");
    if (!ref) return;
    if (ro) ro.disconnect();
    ro = new ResizeObserver(() => {
      const b = document.querySelector(".yat-comp-button");
      if (b) syncNativeStyle(b);
    });
    ro.observe(ref);
  }
})();
