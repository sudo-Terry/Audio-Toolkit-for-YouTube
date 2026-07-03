/*
 * background.js — 서비스 워커
 *
 * 툴바 아이콘 클릭 시 popup.html 을 "독립 창(detached window)"으로 연다.
 * 앵커형 action popup 과 달리 포커스를 잃어도 닫히지 않으며, 창의 ✕ 또는
 * 팝업 안의 닫기 버튼(window.close)으로만 닫힌다.
 *
 * 이미 열려 있으면 새로 만들지 않고 기존 창을 앞으로 가져온다.
 */

let popupWindowId = null;

chrome.action.onClicked.addListener(async () => {
  // 이미 열린 창이 있으면 포커스만
  if (popupWindowId !== null) {
    try {
      await chrome.windows.get(popupWindowId);
      chrome.windows.update(popupWindowId, { focused: true });
      return;
    } catch (e) {
      popupWindowId = null; // 이미 닫힌 창
    }
  }

  const win = await chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"),
    type: "popup",
    width: 300,
    height: 480,
  });
  popupWindowId = win.id;
});

chrome.windows.onRemoved.addListener((id) => {
  if (id === popupWindowId) popupWindowId = null;
});
