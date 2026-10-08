# ⚡ JARVIS — Stark Industries OS // Neural Interface

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-38B2AC?style=for-the-badge&logo=tailwind-css)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.5_Flash-4285F4?style=for-the-badge&logo=google)
![ElevenLabs](https://img.shields.io/badge/ElevenLabs-Voice_Synthesis-black?style=for-the-badge)

<p align="center">
  <b>A sophisticated, hands-free personal AI assistant inspired by Iron Man's J.A.R.V.I.S.</b><br>
  Equipped with real-time news retrieval, cinematic neural voice synthesis, and a reactive cybernetic HUD.
</p>

[Key Features](#-key-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Environment Variables](#-environment-variables) • [Architecture](#-architecture)

</div>

---

## 🌟 Key Features

### 🧠 Google Gemini Neural Core
* Powered by Google's latest **Gemini** multimodal models via Vercel AI SDK.
* Built-in **intelligent zero-delay model failover** (`gemini-3.5-flash-lite` → `gemini-3.7-flash` → `gemini-3.1-flash-lite` → `gemini-3.5-flash`) providing high uptime and immunity to single-model rate limits.
* Converses with sophisticated, concise, and direct persona.

### 🎙️ ElevenLabs Cinematic Voice Synthesis
* Integrated with **ElevenLabs Turbo v2.5** for high-definition, human-like voice response (configured with a British butler persona).
* Seamless instant fallback to native browser Web Speech API (`SpeechSynthesis`) in offline or low-bandwidth environments.
* Instant audio cancellation on command or via the HUD's **STOP** controller.

### 🌐 Real-Time News & Web Intelligence (SearchApi.io)
* **Intelligent Query Routing**: Distinguishes between casual conversation and real-time knowledge requests.
* **Google News Live Feeds**: Queries regarding breaking events, headlines, or today's news automatically trigger `google_news` search, injecting fresh articles, timestamps, and sources directly into the neural context.
* **Zero Wasted Quota**: Conversational prompts skip web search entirely to maximize response speed and conserve API credits.

### 🎤 Hands-Free Voice Control & Wake Word
* Continuous Speech Recognition powered by the Web Speech API.
* **Wake Word Detection**: Say *"Hey Jarvis"* to command the assistant without touching the keyboard.
* Voice visualization reacting to listening, processing, and speaking states.

### 🖥️ Stark Industries Cybernetic HUD
* Interactive holographic core with rotating orbital rings and scanlines.
* Real-time system telemetry gauges (Core Temp, Memory Load, Neural Latency, Uptime).
* Live protocol status indicators (`VOICE RECOGNITION`, `CONTEXT ENGINE`, `WEB INTELLIGENCE`, `SECURE CHANNEL`).
* Real-time events console and transcript log.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (Turbopack, App Router) |
| **Frontend Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) & Lucide Icons |
| **AI Neural Engine** | [Google Gemini](https://ai.google.dev/) via `@ai-sdk/google` |
| **Voice Synthesis** | [ElevenLabs API](https://elevenlabs.io/) (Turbo v2.5) |
| **Search Engine** | [SearchApi.io](https://www.searchapi.io/) (Google News & Google Search) |
| **Package Manager** | [pnpm](https://pnpm.io/) |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
* **Node.js**: v18.18+ or v20+ (Node.js 24 supported)
* **pnpm**: v9+ (or use Corepack: `corepack enable pnpm`)
* Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/souvikx18/JARVIS.git
   cd JARVIS
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   # or with corepack:
   corepack pnpm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and fill in your API keys:
   ```bash
   cp .env.example .env.local
   ```

4. **Launch the development server:**
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to initialize the system.

---

## 🔐 Environment Variables

Create a `.env.local` file in the project root with the following configuration:

```ini
# Google Gemini API Key (Required for Neural Core)
# Obtain from Google AI Studio: https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here

# SearchApi.io Key (Required for Live News & Real-time Web Intelligence)
# Obtain from: https://www.searchapi.io/
SEARCHAPI_API_KEY=your_searchapi_key_here

# ElevenLabs API Key (Optional but recommended for cinematic voice)
# Obtain from: https://elevenlabs.io/
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# ElevenLabs Voice ID (Default: George / British Storyteller)
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb
```

> **Note**: `.env.local` is listed in `.gitignore` to prevent confidential credentials from being committed to source control.

---

## 📐 Architecture & Project Structure

```
JARVIS/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts       # Neural chat pipeline, SearchApi injection & Gemini failover
│   │   └── speech/
│   │       └── route.ts       # ElevenLabs text-to-speech audio streaming endpoint
│   ├── globals.css            # Stark Industries HUD styling, animations, telemetry
│   ├── layout.tsx             # Root HTML layout & fonts
│   └── page.tsx               # Main HUD interface, holo-face canvas, speech recognition
├── components/
│   └── ui/                    # Reusable UI primitives (Button, etc.)
├── lib/
│   ├── search.ts              # SearchApi.io intent classification & news fetcher
│   └── utils.ts               # Class name merging & utility functions
├── public/                    # Audio assets, icons, and UI logos
├── .env.example               # Example template for environment secrets
├── package.json               # Project manifest & script definitions
└── tsconfig.json              # TypeScript compiler configuration
```

---

## 🕹️ Controls & Voice Shortcuts

* **POWER**: Activates the assistant into standby/online mode.
* **WAKE WORD**: Toggles continuous background listening for *"Hey Jarvis"*.
* **VOICE**: Toggles manual one-shot microphone recognition.
* **STOP**: Instantly stops active voice synthesis and speech recognition.
* **LIVE CONSOLE**: Allows typing direct text commands when silent input is preferred.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Engineered with Next.js, Google Gemini & ElevenLabs. Designed for the future.</sub>
</div>
