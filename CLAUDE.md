# CLAUDE.md

이 저장소에서 작업할 때 Claude Code가 참고할 가이드.

## 프로젝트

**Audio Toolkit for YouTube** — 유튜브 오디오를 Web Audio API로 가로채 간단한 음향 조정을
제공하는 Manifest V3 크롬 확장 프로그램. 번들러·프레임워크 없이 **순수 JS(Vanilla)** 로 작성한다.

기능: 볼륨 부스트 · 컴프레서(야간 모드) · 모노 병합 · 좌우 밸런스 · 마스터 On/Off.

## 파일 구조

```
manifest.json          # MV3 설정. 콘텐츠 스크립트 js 배열의 "순서"가 로드 순서다.
content.css            # 컨트롤바 컴프레서 버튼 스타일
src/
  settings.js          # [격리] 상태(DEFAULTS/settings) + chrome.storage + broadcast/commit/유틸
  ui-panel.js          # [격리] 컨트롤바 컴프레서 토글 버튼 (injectButton, refreshButton)
  main.js              # [격리] 진입점: init, SPA 네비게이션, storage 동기화, MAIN 월드 통신
  audio-engine.js      # [MAIN] Web Audio 그래프 구성/적용 (postMessage 로 설정 수신)
popup.html / popup.js  # 툴바 아이콘 팝업 (볼륨·밸런스·모노·컴프레서 설정, storage 공유)
_locales/ko|en/messages.json  # i18n 문자열 (default_locale: ko)
```

- **문자열은 chrome.i18n 로 국제화한다.** manifest 의 name/description 은 `__MSG_appName__`
  /`__MSG_appDesc__`, 코드에서는 `chrome.i18n.getMessage(key)`. popup.html 은 정적이라
  `data-i18n`/`data-i18n-title`/`data-i18n-tip` 속성에 키를 달고 popup.js 의 `localize()`
  가 치환한다(HTML 의 한국어 텍스트는 폴백). 새 문자열은 ko·en `messages.json` 양쪽에 추가.

- **UI 는 두 갈래다.** 재생바에는 컴프레서(야간 모드) on/off **토글 버튼 하나만** 주입한다
  (`.ytp-left-controls` 의 볼륨 영역 오른쪽, 켜지면 `.yat-on` 으로 빨간색). 볼륨 부스트·좌우 밸런스·모노 등
  나머지 설정은 툴바 아이콘 **앵커형 팝업**(`action.default_popup`)에서 조절한다.
  두 UI 는 `chrome.storage` 로 설정을 공유한다.

## 아키텍처 규칙

- **두 개의 실행 월드로 나뉜다.**
  - **격리 월드**(기본 콘텐츠 스크립트): `settings.js → ui-panel.js → main.js`.
    `chrome.storage`·DOM UI 담당. `window.YAT` 네임스페이스 공유.
  - **MAIN 월드**(`"world": "MAIN"`): `audio-engine.js`. 페이지와 같은 월드라야
    `createMediaElementSource` 가 유튜브 오디오를 실제로 라우팅한다.
    (격리 월드의 AudioContext 로는 소리에 영향이 없다 — 이 프로젝트의 핵심 제약.)
    MAIN 월드는 `chrome.*` 를 못 쓰므로 설정을 직접 읽지 못한다.
- **두 월드 통신은 `window.postMessage` 로 한다.** 메시지는 `{ __yat: true, type, ... }` 형태.
  - 격리 → MAIN: `NS.broadcast()` 가 `type:"settings"` 전송(로드 시, 변경 시, 요청 응답 시).
  - MAIN → 격리: 로드 직후 `type:"request"` 로 현재 설정 요청 → `main.js` 가 응답.
- **모듈 공유는 `window.YAT`.** 격리 월드 각 파일은 IIFE + `const NS = (window.YAT = window.YAT || {})`.
  `const YAT` top-level 선언은 재선언 에러라 금지. 로드 순서 `settings → ui-panel → main`, main 마지막.
- **오디오 체인**: `video → source → [compressor] → gain → panner → [mono] → destination`.
  gain 은 컴프레서 "뒤"의 makeup gain(cheese-knife 참고 토폴로지) — 압축으로 큰 소리를 누른 뒤 음량 보정.
  컴프레서 프리셋: threshold -50 / knee 40 / ratio 12 / attack 0 / release 0.25. boost 는 100~200%.
  video 마다 개별 그래프를 만들어 `graphs` Map(video → 노드 묶음)으로 관리하고, 설정 변경 시
  `applyAll()`이 전 그래프를 재구성한다. 새 음향 기능은 체인 중간에 노드를 끼워 확장한다
  (예: EQ = `BiquadFilterNode` peaking 체인). **오디오 로직은 audio-engine.js(MAIN)에만** 둔다.
- **설정 변경 흐름**: UI/popup 이 `NS.settings` 수정 → `NS.commit()`(저장 + broadcast).
  `saveSettings()` 는 `NS._selfWrite=true` 를 세워, `main.js` 의 `storage.onChanged` 가
  자기 트리거를 무시하게 한다. 외부(popup) 변경만 `NS.refreshButton()` 으로 컨트롤바 버튼에 반영.

## 주의사항 (Web Audio / 유튜브 SPA)

- **오디오는 반드시 MAIN 월드에서.** 격리 월드에서 `createMediaElementSource` 를 호출하면
  소리에 영향이 없다. audio-engine.js 를 격리 월드로 되돌리지 말 것.
- **video 는 `play` 이벤트(document 캡처)로 잡는다.** 유튜브에는 video 가 여러 개
  (본 영상, 인라인 미리보기, Shorts)라 로드 시점 `querySelector("video")` 로는 엉뚱한
  요소에 붙어 "소리는 정상인데 효과 없음"이 된다. 실제로 재생되는 요소만 hook 할 것.
  (play 는 버블링하지 않지만 캡처 단계에서는 document 에 도달한다.)
- `createMediaElementSource` 는 **video 요소당 1회만** 호출 가능 → `graphs` Map 존재 여부로 중복 방지.
- 유튜브는 SPA라 페이지 전환 시 DOM이 바뀜 → 버튼 재주입은 `yt-navigate-finish` + `MutationObserver`(격리 월드).
- autoplay 정책상 `AudioContext` 는 사용자 상호작용 후 `resume()` 필요 → play/pointerdown/keydown 에서 resume.
- 컨트롤바 버튼 클릭 시 `stopPropagation` 으로 플레이어 재생 토글에 새지 않게 한다.

## 로드 / 테스트

빌드 단계 없음. `chrome://extensions` → 개발자 모드 → **압축해제된 확장 프로그램 로드** →
이 폴더 선택. 코드 수정 후에는 확장 카드의 **새로고침** 버튼을 눌러 반영한다.

자동화 테스트는 없다. 검증은 유튜브 영상 재생 후 컨트롤바 컴프레서 버튼과 툴바 팝업에서 직접 확인한다.
JS 문법만 빠르게 볼 때는 `node -c src/<파일>.js`.

## 컨벤션

- 주석·식별자는 기존 코드 스타일(한글 주석 + 영문 식별자)에 맞춘다.
- 외부 의존성·npm 패키지 추가 금지(순수 JS 유지).
- 사용자 대면 문자열은 한국어.
