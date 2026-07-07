<div align="center">

# 🎧 Audio Toolkit for YouTube

**유튜브 소리를, 보던 화면에서 바로 내 귀에 맞게**

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/jblkbgeldjiabofmekfpdcndpbpmjogd?label=Chrome%20Web%20Store&logo=googlechrome&logoColor=white&color=4285F4)](https://chromewebstore.google.com/detail/audio-toolkit-for-youtube/jblkbgeldjiabofmekfpdcndpbpmjogd)
[![Users](https://img.shields.io/chrome-web-store/users/jblkbgeldjiabofmekfpdcndpbpmjogd?label=%EC%82%AC%EC%9A%A9%EC%9E%90&color=34A853)](https://chromewebstore.google.com/detail/audio-toolkit-for-youtube/jblkbgeldjiabofmekfpdcndpbpmjogd)
![Manifest](https://img.shields.io/badge/Manifest-V3-4285F4)
![License](https://img.shields.io/badge/License-MIT-green)

한국어 · [English](README.en.md)

### [🎧 Chrome 웹스토어에서 설치하기](https://chromewebstore.google.com/detail/audio-toolkit-for-youtube/jblkbgeldjiabofmekfpdcndpbpmjogd)

</div>

---

## 미리보기

<div align="center">
  <img src="store/store-screenshot-1-1280x800.png" alt="재생바의 컴프레서(야간 모드) 토글 버튼" width="760">
  <br><br>
  <img src="store/store-screenshot-2-640x400.png" alt="볼륨·밸런스·모노를 조절하는 설정 팝업" width="440">
</div>

## 소개

유튜브를 보다 보면 영상마다 소리 크기가 제각각이고, 밤에는 갑자기 튀는 광고나 효과음 때문에 볼륨을 계속 만지게 됩니다. Audio Toolkit for YouTube는 바로 그런 순간을 위한 가벼운 음향 도구예요. 영상을 보던 그 화면에서 버튼 하나로 소리를 다듬을 수 있고, 설치하면 별다른 설정 없이 바로 동작합니다.

## 기능

| 기능 | 이런 순간에 |
| --- | --- |
| 🔊 **볼륨 부스트** | 볼륨을 끝까지 올려도 소리가 작을 때, 100%를 넘어 최대 200%까지 키워 줍니다. |
| 🌙 **컴프레서 (야간 모드)** | 큰 소리를 지그시 눌러 볼륨 편차를 줄여 주기 때문에, 밤에도 광고 소리에 놀라지 않고 볼 수 있어요. |
| 🎚️ **좌우 밸런스** | 소리가 한쪽으로 치우쳐 들릴 때 좌우 균형을 다시 맞춥니다. |
| 🔉 **모노 병합** | 좌우를 하나로 합쳐, 한쪽 이어폰만 껴도 온전한 소리를 들려줍니다. |
| ⏻ **마스터 On/Off** | 언제든 손댄 걸 끄고 원음 그대로 되돌릴 수 있어요. |

## 설치

[**Chrome 웹스토어**](https://chromewebstore.google.com/detail/audio-toolkit-for-youtube/jblkbgeldjiabofmekfpdcndpbpmjogd)에서 "Chrome에 추가"를 누르면 바로 사용할 수 있습니다.

소스에서 직접 불러오고 싶다면 개발자 모드를 쓰면 됩니다.

1. 이 저장소를 클론하거나 ZIP으로 내려받습니다.
2. 크롬 주소창에 `chrome://extensions` 를 입력해 확장 관리 페이지를 엽니다.
3. 오른쪽 위의 **개발자 모드**를 켭니다.
4. **압축해제된 확장 프로그램을 로드**를 눌러 이 폴더를 선택하면 끝입니다.

## 사용법

컴프레서(야간 모드)는 자주 켜고 끄게 되는 기능이라 재생바에 버튼으로 꺼내 뒀습니다. 플레이어 컨트롤바의 볼륨 옆 이퀄라이저 아이콘을 누르면 바로 켜지고, 켜져 있는 동안에는 빨간색으로 표시돼요.

볼륨 부스트나 좌우 밸런스, 모노 병합처럼 한 번 맞춰 두는 설정은 브라우저 툴바의 확장 아이콘을 눌러 뜨는 팝업에서 조절합니다. 두 화면은 설정을 실시간으로 공유하고, 각 항목 옆의 `?`에 마우스를 올리면 언제 쓰면 좋은지 짧은 설명이 나옵니다.

## 동작 방식

외부 라이브러리 없이 순수 자바스크립트로 만든 Manifest V3 확장입니다. 소리는 Web Audio API로 `<video>` 요소를 가로채 처리하며, 신호는 아래 순서를 따라 흐릅니다.

```
video → [compressor] → gain → panner → [mono] → destination
```

## 개인정보

사용자의 데이터를 수집하거나 밖으로 내보내지 않습니다. 설정값은 오직 사용자 브라우저 안에만 저장돼요. 더 자세한 내용은 [개인정보 처리방침](PRIVACY.md)에 정리해 두었습니다.

## 라이선스

[MIT](LICENSE)

---

<div align="center"><sub>YouTube 및 Google과 무관한 비공식 확장 프로그램입니다.</sub></div>
