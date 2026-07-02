/*
 * ui-panel.js — 플레이어 컨트롤바 버튼과 인-플레이어 설정 패널
 */
(() => {
  "use strict";
  const NS = (window.YAT = window.YAT || {});

  let panelEl = null;

  // 컨트롤바에 토글 버튼 주입
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
      panelEl.remove();
      panelEl = null;
      return;
    }
    buildPanel();
  }

  function buildPanel() {
    const s = NS.settings;
    const player = document.querySelector("#movie_player") || document.body;

    panelEl = document.createElement("div");
    panelEl.className = "yat-panel";
    panelEl.innerHTML = `
      <div class="yat-header">
        <span>🎧 Audio Toolkit</span>
        <label class="yat-switch">
          <input type="checkbox" id="yat-enabled" ${s.enabled ? "checked" : ""}>
          <span class="yat-slider-toggle"></span>
        </label>
      </div>

      <div class="yat-row">
        <label>볼륨 부스트 <b id="yat-boost-val">${s.boost}%</b></label>
        <input type="range" id="yat-boost" min="100" max="500" step="10" value="${s.boost}">
      </div>

      <div class="yat-row">
        <label>좌우 밸런스 <b id="yat-balance-val">${NS.balanceLabel(s.balance)}</b></label>
        <input type="range" id="yat-balance" min="-100" max="100" step="5" value="${s.balance}">
      </div>

      <div class="yat-row yat-check">
        <label><input type="checkbox" id="yat-compressor" ${s.compressor ? "checked" : ""}> 컴프레서 (야간 모드)</label>
      </div>

      <div class="yat-row yat-check">
        <label><input type="checkbox" id="yat-mono" ${s.mono ? "checked" : ""}> 모노 병합</label>
      </div>

      <div class="yat-footer">
        <button id="yat-reset">초기화</button>
      </div>
    `;
    player.appendChild(panelEl);
    panelEl.addEventListener("click", (e) => e.stopPropagation());

    const $ = (sel) => panelEl.querySelector(sel);

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
      rebuild();
    });
  }

  function rebuild() {
    if (!panelEl) return;
    panelEl.remove();
    panelEl = null;
    buildPanel();
  }

  // 외부(popup 등)에서 설정이 바뀌면 오디오 반영 + 열린 패널 갱신
  NS.onExternalChange = function () {
    if (NS.apply) NS.apply();
    if (panelEl) rebuild();
  };
})();
