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

| Component | Technology |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), Google Font 'Play' |
| **3D Graphics** | [Three.js](https://threejs.org/) + Custom GLSL Vertex/Fragment Shaders |
| **Desktop Runtime** | [Neutralinojs](https://neutralino.js.org/) (Native WebView2 integration) |
| **OS Bridge** | Windows Registry (`HKCU\Software\Valve\Steam`), Steam Protocol URIs |

---

<a name="russian"></a>
## 🇷🇺 Русский

> Высокопроизводительный игровой лаунчер в стиле кибер-стекла с живым **3D-фоном на 100 000 частиц WebGL**, физикой ударных волн и умным автоматическим переключением аккаунтов Steam в 1 клик.

### 📥 Скачать (Портативная версия для Windows)

Установка Node.js или сторонних программ не требуется. Скачайте легковесный готовый архив:

👉 **[Скачать VASX Launcher (.zip)](https://github.com/VEKX/vasx/releases/latest)**

1. Скачайте архив `VASX_Launcher_Windows.zip` (~1.5 МБ).
2. Распакуйте архив в удобное место.
3. Запустите `VASX.exe`.

### ✨ Основные возможности

- **🎮 Чтение библиотеки Steam напрямую с диска:** Мгновенный парсинг локальных манифестов `appmanifest_*.acf` без задержек и сторонних API.
- **⚡ Умное автопереключение аккаунтов:**
  - Лаунчер сам определяет владельца выбранной игры (`LastOwner`).
  - Если игра куплена на другом аккаунте — VASX автоматически меняет профиль Steam через реестр Windows без ввода паролей и 2FA и сразу запускает игру.
- **🌌 Живой 3D-фон на 100 000 частиц (Three.js + GLSL Шейдеры):**
  - Плавная органическая волновая симуляция на основе 3D-шума Симплекс (Perlin/Simplex Noise).
  - Интерактивное силовое поле за курсором мыши.
  - Сверхзвуковая ударная волна при запуске игры с эффектом **замедления времени (Slow-Mo)**.
  - Полная отвязка от герцовки монитора (одинаковая плавная скорость на 60Hz, 144Hz и 240Hz).
- **🪟 Кристальный дизайн (Glassmorphism):**
  - Парящие матовые стеклянные панели с 95% прозрачностью.
  - Мгновенный живой поиск по названию игры и фильтры по платформам.
- **🪶 Ультра-легкий вес (1.5 МБ):** Работает на нативном движке Windows WebView2 вместо тяжелых 800-мегабайтных сборок Chromium.

### 🛠️ Стек технологий

| Модуль | Технологии |
| :--- | :--- |
| **Интерфейс** | HTML5, CSS3, JavaScript (ES6+), шрифт 'Play' |
| **3D Графика** | [Three.js](https://threejs.org/) + кастомные шейдеры GLSL (Vertex & Fragment) |
| **Десктопный движок** | [Neutralinojs](https://neutralino.js.org/) (Интеграция с нативным WebView2) |
| **Системная интеграция** | Реестр Windows (`HKCU\Software\Valve\Steam`), URI-протокол Steam |

---

## 📄 License / Лицензия

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
