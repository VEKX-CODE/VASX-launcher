# ⚡ VASX — Universal Game Launcher & Account Switcher
[English](#english) | [Русский](#russian)
---
<a name="english"></a>
## 🇬🇧 English
> A high-performance, glassmorphic desktop game launcher powered by a **100,000-particle WebGL 3D field**, dynamic shockwave physics, and seamless automated Steam account switching.
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-0078D6?logo=windows&logoColor=white)](#-download-english)
[![Size: 1.5MB](https://img.shields.io/badge/Size-1.5%20MB-brightgreen)](#-download-english)
### 📥 Download (Windows Standalone)
No Node.js or browser installations required. Download the lightweight standalone package directly:
👉 **[Download VASX Launcher (.zip)](https://github.com/VEKX/vasx/releases/latest)**
1. Download `VASX_Launcher_Windows.zip` (~1.5 MB).
2. Extract the archive.
3. Launch `VASX.exe`.
### ✨ Key Features
- **🎮 Direct Steam Library Reading:** Parses `appmanifest_*.acf` files directly from disk without third-party API dependencies.
- **⚡ Smart One-Click Account Switching:**
  - Automatically identifies which account owns the selected game (`LastOwner`).
  - Seamlessly re-authenticates Steam via Windows registry without password prompts and launches the target game instantly.
- **🌌 100,000-Particle WebGL 3D Background:**
  - Real-time Simplex Noise fluid simulation powered by custom GLSL shaders.
  - Interactive mouse physics and hyper-sonic shockwaves with **time-dilation (slow-mo physics)** on launch.
  - Native display-refresh rate decoupling (FPS-independent physics).
- **🪟 Cyber Glassmorphism UI:**
  - 95% floating crystal glass aesthetic (`backdrop-filter: blur`).
  - Real-time search filter and platform switcher.
- **🪶 Ultra-Lightweight (1.5 MB):** Packaged via native Windows WebView2 runtime instead of bloated 800MB Chromium bundles.
### 🛠️ Tech Stack
