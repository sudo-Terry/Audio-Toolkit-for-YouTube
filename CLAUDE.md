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
  settings.js          # 상태(DEFAULTS/settings) + chrome.storage + 공용 유틸(commit/clamp/balanceLabel)
  audio-engine.js      # Web Audio 그래프 구성/적용 (apply, attachToVideo)
  ui-panel.js          # 컨트롤바 버튼 + 인-플레이어 설정 패널 (injectButton, onExternalChange)
  main.js              # 진입점: init, SPA 네비게이션, storage 동기화
popup.html / popup.js  # 확장 아이콘 팝업 (동일 설정을 storage로 공유)
```

## 아키텍처 규칙

- **모듈 공유는 `window.YAT` 네임스페이스로 한다.** 콘텐츠 스크립트는 번들러 없이 같은
  격리 스코프에서 `manifest.json`의 `js` 배열 순서대로 실행된다. 각 파일은 IIFE로 감싸고
  `const NS = (window.YAT = window.YAT || {})` 패턴으로 네임스페이스에 붙인다.
  `const YAT`을 여러 파일에서 top-level 선언하면 재선언 에러가 나므로 금지.
- **로드 순서 의존성**: `settings → audio-engine → ui-panel → main`. 새 파일 추가 시
  이 순서를 지켜 `manifest.json`의 `js` 배열에 등록한다. `main.js`는 항상 마지막.
- **오디오 체인**: `video → source → gain → [compressor] → panner → [mono] → destination`.
  활성 노드만 순서대로 연결하며 토글 변경 시 `rebuildGraph()`로 재구성한다. 새 음향 기능은
  이 체인 중간에 노드를 끼우는 방식으로 확장한다(예: EQ = `BiquadFilterNode` peaking 체인).
- **설정 변경 흐름**: UI/popup 이 `NS.settings` 를 수정 → `NS.commit()`(저장+적용).
  popup은 별도 컨텍스트라 `chrome.storage.onChanged` → `NS.onExternalChange()` 로 반영된다.

## 주의사항 (Web Audio / 유튜브 SPA)

- `createMediaElementSource` 는 **video 요소당 1회만** 호출 가능 → `hookedVideos` WeakSet 으로 추적.
- 유튜브는 SPA라 페이지 전환 시 DOM이 바뀜 → `yt-navigate-finish` 이벤트 + `MutationObserver`
  로 video 재연결·버튼 재주입.
- autoplay 정책상 `AudioContext` 는 사용자 상호작용 후 `resume()` 필요.
- 콘텐츠 스크립트(격리 월드)에서 동작. 특정 환경에서 오디오 tap 이 안 붙으면
  `world: "MAIN"` 스크립트 분리 방식으로 전환한다.

## 로드 / 테스트

빌드 단계 없음. `chrome://extensions` → 개발자 모드 → **압축해제된 확장 프로그램 로드** →
이 폴더 선택. 코드 수정 후에는 확장 카드의 **새로고침** 버튼을 눌러 반영한다.

자동화 테스트는 없다. 검증은 유튜브 영상 재생 후 컨트롤바 막대 아이콘 패널에서 직접 확인한다.
JS 문법만 빠르게 볼 때는 `node -c src/<파일>.js`.

## 컨벤션

- 주석·식별자는 기존 코드 스타일(한글 주석 + 영문 식별자)에 맞춘다.
- 외부 의존성·npm 패키지 추가 금지(순수 JS 유지).
- 사용자 대면 문자열은 한국어.
