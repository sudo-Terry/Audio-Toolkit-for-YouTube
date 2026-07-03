# CLAUDE.md

이 저장소에서 작업할 때 Claude Code가 참고할 가이드.

## 프로젝트

**YouTube Audio Toolkit** — 유튜브 오디오를 Web Audio API로 가로채 간단한 음향 조정을
제공하는 Manifest V3 크롬 확장 프로그램. 번들러·프레임워크 없이 **순수 JS(Vanilla)** 로 작성한다.

기능: 볼륨 부스트 · 컴프레서(야간 모드) · 모노 병합 · 좌우 밸런스 · 마스터 On/Off.

## 파일 구조

```
manifest.json          # MV3 설정. 콘텐츠 스크립트 js 배열의 "순서"가 로드 순서다.
content.css            # 인-플레이어 버튼/패널 스타일
src/
  settings.js          # [격리] 상태(DEFAULTS/settings) + chrome.storage + broadcast/commit/유틸
  ui-panel.js          # [격리] 컨트롤바 버튼 + 설정 패널 (injectButton, syncPanel)
  main.js              # [격리] 진입점: init, SPA 네비게이션, storage 동기화, MAIN 월드 통신
  audio-engine.js      # [MAIN] Web Audio 그래프 구성/적용 (postMessage 로 설정 수신)
popup.html / popup.js  # 확장 아이콘 팝업 (동일 설정을 storage로 공유)
```

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
  컴프레서 프리셋: threshold -50 / knee 40 / ratio 12 / attack 0 / release 0.25.
  활성 노드만 순서대로 연결하며 변경 시 `rebuildGraph()`로 재구성. 새 음향 기능은 이 체인 중간에
  노드를 끼워 확장한다(예: EQ = `BiquadFilterNode` peaking 체인). **오디오 로직은 audio-engine.js(MAIN)에만** 둔다.
- **설정 변경 흐름**: UI/popup 이 `NS.settings` 수정 → `NS.commit()`(저장 + broadcast).
  `saveSettings()` 는 `NS._selfWrite=true` 를 세워, `main.js` 의 `storage.onChanged` 가
  자기 트리거를 무시하게 한다(패널 포커스 유지). 외부(popup) 변경만 `NS.syncPanel()` 로 반영.

## 주의사항 (Web Audio / 유튜브 SPA)

- **오디오는 반드시 MAIN 월드에서.** 격리 월드에서 `createMediaElementSource` 를 호출하면
  소리에 영향이 없다. audio-engine.js 를 격리 월드로 되돌리지 말 것.
- `createMediaElementSource` 는 **video 요소당 1회만** 호출 가능 → `hookedVideos` WeakSet 으로 추적.
- 유튜브는 SPA라 페이지 전환 시 DOM이 바뀜 → `yt-navigate-finish` + `MutationObserver`
  로 video 재연결·버튼 재주입. MutationObserver 는 이미 연결된 경우 `apply()` 를 재실행하지 않는다.
- autoplay 정책상 `AudioContext` 는 사용자 상호작용 후 `resume()` 필요.
- 패널은 `body` 에 `position: fixed` 로 붙인다(플레이어 DOM 변화·컨트롤 자동숨김의 영향 회피).
  패널 내부 이벤트는 `stopPropagation` 으로 플레이어 단축키/재생 토글에 새지 않게 한다.

## 로드 / 테스트

빌드 단계 없음. `chrome://extensions` → 개발자 모드 → **압축해제된 확장 프로그램 로드** →
이 폴더 선택. 코드 수정 후에는 확장 카드의 **새로고침** 버튼을 눌러 반영한다.

자동화 테스트는 없다. 검증은 유튜브 영상 재생 후 컨트롤바 막대 아이콘 패널에서 직접 확인한다.
JS 문법만 빠르게 볼 때는 `node -c src/<파일>.js`.

## 컨벤션

- 주석·식별자는 기존 코드 스타일(한글 주석 + 영문 식별자)에 맞춘다.
- 외부 의존성·npm 패키지 추가 금지(순수 JS 유지).
- 사용자 대면 문자열은 한국어.
