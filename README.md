# Tetris App (Desktop)

A modern Tetris game built with React, TypeScript, and Vite, packaged as a desktop application using Tauri.
This is also a Progressive Web App (PWA).  
You can play it online here: [Tetris by Shadeed](https://tetris-by-shadeed.netlify.app/)

## 🎮 Features

- Classic Tetris gameplay
- Score tracking
- Next piece preview
- Level progression
- Sound effects
- Cross-platform support

## 🛠️ Tech Stack

- React 18
- TypeScript
- Vite
- Tauri
- Capacitor

## 🚀 Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## 📦 Building for Desktop

1. Install Tauri CLI:
   ```bash
   npm install -D @tauri-apps/cli
   ```

2. Build the desktop app:
   ```bash
   npm run tauri build
   ```

## 🛠 Development Notes

- `generate-icons.js` → Script to generate favicons or app icons.
- `sw.js` → Caches assets for offline play.
- `manifest.json` → PWA configuration (name, icons, theme, start URL, etc.)

## 📱 Mobile Support

Built with Capacitor for potential mobile deployment.

## 📝 License

MIT © 2024 Shadeed

Enjoy playing Tetris - Shadeed! 🎮
