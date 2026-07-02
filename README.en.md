<div align="center">

# 🎧 YouTube Audio Toolkit

**A Chrome extension that fine-tunes YouTube audio in real time**

Volume boost · compressor · mono merge · stereo balance — right inside the player.

![Manifest](https://img.shields.io/badge/Manifest-V3-4285F4)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E)
![License](https://img.shields.io/badge/License-MIT-green)

[한국어](README.md) · English

</div>

---

## Features

| Feature | Description |
| --- | --- |
| 🔊 **Volume Boost** | Amplify beyond YouTube's 100% cap, up to 500% |
| 🌙 **Compressor (Night Mode)** | Tame loud peaks for comfortable late-night listening |
| 🎚️ **Stereo Balance** | Adjust the L/R balance |
| 🔉 **Mono Merge** | Collapse both channels to mono (for single-earbud use) |
| ⏻ **Master On/Off** | Instantly revert to the original audio |

## Installation

1. Clone or download this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select this folder

## Usage

While a YouTube video is playing, click the **bars icon** in the player control bar to open
the settings panel. You can also use the extension's toolbar popup — both UIs share settings
in real time.

## Tech

- **Manifest V3** · Vanilla JavaScript (no dependencies)
- Taps `<video>` audio via the **Web Audio API**
  `video → gain → [compressor] → panner → [mono] → destination`

## License

[MIT](LICENSE)
