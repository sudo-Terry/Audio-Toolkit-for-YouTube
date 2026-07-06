/* YouTube Audio Toolkit — popup */
const STORAGE_KEY = "yat-settings";
const DEFAULTS = {
  enabled: true,
  boost: 100,
  compressor: false,
  mono: false,
  balance: 0,
};

let settings = { ...DEFAULTS };

const $ = (id) => document.getElementById(id);

const t = (key) => chrome.i18n.getMessage(key) || key;

// data-i18n / data-i18n-title / data-i18n-tip 속성을 현재 로케일 문자열로 치환
function localize() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const m = t(el.dataset.i18n);
    if (m) el.textContent = m;
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const m = t(el.dataset.i18nTitle);
    if (m) el.title = m;
  });
  document.querySelectorAll("[data-i18n-tip]").forEach((el) => {
    const m = t(el.dataset.i18nTip);
    if (m) el.dataset.tip = m;
  });
}

function balanceLabel(v) {
  if (v === 0) return t("balanceCenter");
  return v < 0 ? `L ${-v}` : `R ${v}`;
}

function render() {
  $("enabled").checked = settings.enabled;
  $("boost").value = settings.boost;
  $("boost-val").textContent = settings.boost + "%";
  $("balance").value = settings.balance;
  $("balance-val").textContent = balanceLabel(settings.balance);
  $("compressor").checked = settings.compressor;
  $("mono").checked = settings.mono;
}

function save() {
  chrome.storage.local.set({ [STORAGE_KEY]: settings });
}

localize();

chrome.storage.local.get(STORAGE_KEY, (res) => {
  if (res && res[STORAGE_KEY]) settings = { ...DEFAULTS, ...res[STORAGE_KEY] };
  // 이전 버전에서 저장된 범위 밖 값 보정 (예: boost 500)
  settings.boost = Math.max(100, Math.min(200, Number(settings.boost) || 100));
  render();
});

$("enabled").addEventListener("change", (e) => {
  settings.enabled = e.target.checked;
  save();
});
$("boost").addEventListener("input", (e) => {
  settings.boost = Number(e.target.value);
  $("boost-val").textContent = settings.boost + "%";
  save();
});
$("balance").addEventListener("input", (e) => {
  settings.balance = Number(e.target.value);
  $("balance-val").textContent = balanceLabel(settings.balance);
  save();
});
const nudgeBalance = (delta) => {
  settings.balance = Math.max(-100, Math.min(100, settings.balance + delta));
  $("balance").value = settings.balance;
  $("balance-val").textContent = balanceLabel(settings.balance);
  save();
};
$("bal-minus").addEventListener("click", () => nudgeBalance(-5));
$("bal-plus").addEventListener("click", () => nudgeBalance(5));
$("compressor").addEventListener("change", (e) => {
  settings.compressor = e.target.checked;
  save();
});
$("mono").addEventListener("change", (e) => {
  settings.mono = e.target.checked;
  save();
});
$("reset").addEventListener("click", () => {
  settings = { ...DEFAULTS };
  render();
  save();
});
$("close").addEventListener("click", () => window.close());
