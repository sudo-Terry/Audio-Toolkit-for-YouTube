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

function balanceLabel(v) {
  if (v === 0) return "중앙";
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

chrome.storage.local.get(STORAGE_KEY, (res) => {
  if (res && res[STORAGE_KEY]) settings = { ...DEFAULTS, ...res[STORAGE_KEY] };
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
