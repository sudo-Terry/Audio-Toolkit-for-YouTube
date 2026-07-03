/*
 * ui-panel.js — 컨트롤바 버튼 + 설정 패널 (격리 월드)
 *
 * 패널은 body 에 fixed 로 붙어 플레이어 DOM 변화의 영향을 받지 않는다.
 * 설정 변경 시 패널을 재생성하지 않고 값만 동기화하여 포커스를 유지한다.
 * 닫기는 토글 버튼 또는 × 버튼으로만 한다(임의로 닫히지 않음).
 */
(() => {
  "use strict";
  const NS = (window.YAT = window.YAT || {});

  let panelEl = null;

  NS.injectButton = function () {
    const controls = document.querySelector(".ytp-right-controls");
    if (!controls || document.querySelector(".yat-button")) return;

    const btn = document.createElement("button");
    btn.className = "ytp-button yat-button";
    btn.title = "오디오 툴킷";
    btn.innerHTML = `
      <svg height="100%" viewBox="0 0 36 36" width="100%" fill="#fff">
        <rect x="7"  y="15" width="3" height="6"  rx="1.5"></rect>
        <rect x="13" y="11" width="3" height="14" rx="1.5"></rect>
        <rect x="19" y="8"  width="3" height="20" rx="1.5"></rect>
        <rect x="25" y="13" width="3" height="10" rx="1.5"></rect>
      </svg>`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePanel();
    });

    const settingsBtn = controls.querySelector(".ytp-settings-button");
    controls.insertBefore(btn, settingsBtn || controls.firstChild);
  };

  function togglePanel() {
    if (panelEl && panelEl.isConnected) {
      closePanel();
    } else {
      buildPanel();
    }
  }

  function closePanel() {
    if (panelEl) panelEl.remove();
    panelEl = null;
  }

  function buildPanel() {
    const s = NS.settings;
    const TIPS = NS.TIPS;

    panelEl = document.createElement("div");
    panelEl.className = "yat-panel";
    panelEl.innerHTML = `
      <div class="yat-header">
        <span>🎧 Audio Toolkit</span>
        <div class="yat-header-right">
          <label class="yat-switch">
            <input type="checkbox" id="yat-enabled" ${s.enabled ? "checked" : ""}>
            <span class="yat-slider-toggle"></span>
          </label>
          <button class="yat-close" id="yat-close" title="닫기">✕</button>
        </div>
      </div>

      <div class="yat-row">
        <label>볼륨 부스트 <span class="yat-help" data-tip="${TIPS.boost}">?</span> <b id="yat-boost-val">${s.boost}%</b></label>
        <input type="range" id="yat-boost" min="100" max="200" step="5" value="${s.boost}">
      </div>

      <div class="yat-row">
        <label>좌우 밸런스 <span class="yat-help" data-tip="${TIPS.balance}">?</span> <b id="yat-balance-val">${NS.balanceLabel(s.balance)}</b></label>
        <div class="yat-balance-ctrl">
          <button class="yat-nudge" id="yat-bal-minus" title="왼쪽으로 5">−</button>
          <input type="range" id="yat-balance" min="-100" max="100" step="5" value="${s.balance}">
          <button class="yat-nudge" id="yat-bal-plus" title="오른쪽으로 5">+</button>
        </div>
      </div>

      <div class="yat-row yat-check">
        <label><input type="checkbox" id="yat-compressor" ${s.compressor ? "checked" : ""}> 컴프레서 (야간 모드) <span class="yat-help" data-tip="${TIPS.compressor}">?</span></label>
      </div>

      <div class="yat-row yat-check">
        <label><input type="checkbox" id="yat-mono" ${s.mono ? "checked" : ""}> 모노 병합 <span class="yat-help" data-tip="${TIPS.mono}">?</span></label>
      </div>

      <div class="yat-footer">
        <button id="yat-reset">초기화</button>
      </div>
    `;
    document.body.appendChild(panelEl);

    // 패널 내부 상호작용이 플레이어(재생/단축키)로 새지 않도록 차단
    ["click", "dblclick", "mousedown", "pointerdown", "keydown", "keyup"].forEach((type) =>
      panelEl.addEventListener(type, (e) => e.stopPropagation())
    );

    const $ = (sel) => panelEl.querySelector(sel);

    $("#yat-close").addEventListener("click", closePanel);

    $("#yat-enabled").addEventListener("change", (e) => {
      s.enabled = e.target.checked;
      NS.commit();
    });
    $("#yat-boost").addEventListener("input", (e) => {
      s.boost = Number(e.target.value);
      $("#yat-boost-val").textContent = s.boost + "%";
      NS.commit();
    });
    $("#yat-balance").addEventListener("input", (e) => {
      s.balance = Number(e.target.value);
      $("#yat-balance-val").textContent = NS.balanceLabel(s.balance);
      NS.commit();
    });
    const nudgeBalance = (delta) => {
      s.balance = NS.clamp(s.balance + delta, -100, 100);
      $("#yat-balance").value = s.balance;
      $("#yat-balance-val").textContent = NS.balanceLabel(s.balance);
      NS.commit();
    };
    $("#yat-bal-minus").addEventListener("click", () => nudgeBalance(-5));
    $("#yat-bal-plus").addEventListener("click", () => nudgeBalance(5));
    $("#yat-compressor").addEventListener("change", (e) => {
      s.compressor = e.target.checked;
      NS.commit();
    });
    $("#yat-mono").addEventListener("change", (e) => {
      s.mono = e.target.checked;
      NS.commit();
    });
    $("#yat-reset").addEventListener("click", () => {
      NS.settings = { ...NS.DEFAULTS };
      NS.commit();
      NS.syncPanel();
    });
  }

  // DOM 재생성 없이 열린 패널의 값만 갱신(포커스 중인 요소는 건드리지 않음)
  NS.syncPanel = function () {
    if (!panelEl) return;
    const s = NS.settings;
    const active = document.activeElement;
    const setVal = (sel, val) => {
      const el = panelEl.querySelector(sel);
      if (el && el !== active) el.value = val;
    };
    const setChk = (sel, on) => {
      const el = panelEl.querySelector(sel);
      if (el && el !== active) el.checked = on;
    };

    setVal("#yat-boost", s.boost);
    setVal("#yat-balance", s.balance);
    setChk("#yat-enabled", s.enabled);
    setChk("#yat-compressor", s.compressor);
    setChk("#yat-mono", s.mono);

    const boostVal = panelEl.querySelector("#yat-boost-val");
    if (boostVal) boostVal.textContent = s.boost + "%";
    const balVal = panelEl.querySelector("#yat-balance-val");
    if (balVal) balVal.textContent = NS.balanceLabel(s.balance);
  };
})();
