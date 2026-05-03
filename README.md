# 🏎️ Veloce — F1 Telemetry Analyser

> A mini project built to explore real-time Formula 1 data analysis with AI-powered insights.

Veloce is an interactive F1 telemetry dashboard that lets you compare driver performances lap-by-lap, explore race strategies, and get intelligent analysis — powered by **Google Gemini AI**. Built as a mini project to combine data engineering, modern web development, and generative AI into one cohesive application.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Python-000000?logo=flask&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_AI-Google-4285F4?logo=google&logoColor=white)

## ✨ Features

- **Live Standings** — Current driver & constructor championship standings
- **Telemetry Comparison** — Overlay speed, throttle, brake, gear, and DRS traces for multiple drivers
- **Lap Analysis** — Sector times, gap analysis, and theoretical best laps
- **Race Dominance** — Visualize who led each sector throughout a race
- **AI-Powered Insights** — Deep race analysis using Google Gemini *(see below)*
- **PDF Export** — Download session reports as PDF
- **Shareable Links** — Permalink support via URL query parameters
- **Dark / Light Mode** — Toggle between themes
- **Multi-Season Support** — Data from 2018 to 2026

## 🤖 AI Integration — Google Gemini

The standout feature of Veloce is its **AI-powered analysis engine** built on the **Google Gemini 2.5 Flash** model. Instead of just showing raw charts and numbers, Veloce uses AI to explain *what the data actually means*.

### How it works

1. **Data Pre-Summarization** — Raw telemetry data (often thousands of data points) is first condensed into compact statistical summaries on the backend. This reduces token usage and ensures Gemini receives focused, relevant context.

2. **Rule-Based Seeding** — Before calling Gemini, the frontend runs automated rule-based analysis (e.g., "Driver X had 0.3s advantage in Sector 2") and passes these findings as context. Gemini is instructed to *build on* these insights rather than repeat them, producing deeper and more nuanced commentary.

3. **Context-Aware Prompting** — Each analysis type (tire degradation, weather impact, overtaking patterns, head-to-head telemetry) has a tailored prompt that guides Gemini to act as a specific expert — race engineer, data scientist, or strategy analyst.

4. **Structured Output Parsing** — Gemini's response is cleaned of markdown formatting, split into coherent paragraphs, and rendered as readable insight cards in the UI.

### AI Analysis Types

| Analysis | What Gemini Analyzes |
|---|---|
| **Tire Strategy** | Stint lengths, compound choices, degradation rates, optimal pit windows |
| **Weather Impact** | Temperature–lap time correlations, rain effects, humidity patterns |
| **Overtaking & Strategy** | Overtake hotspots, undercut/overcut battles, DRS effectiveness |
| **Telemetry H2H** | Speed differentials, braking points, driving style comparisons |

> The AI insights act as an intelligent layer on top of the raw data — turning numbers into narratives that even casual F1 fans can understand.

## 🛠️ Tech Stack

| Layer    | Technology                                    |
| -------- | --------------------------------------------- |
| Frontend | React 19, Vite, Tailwind CSS 4, Recharts, GSAP |
| Backend  | Python, Flask, FastF1, Pandas, NumPy          |
| AI       | Google Gemini 2.5 Flash API                   |
| Export   | jsPDF, html-to-image                          |
| Data     | FastF1 (official F1 telemetry), Jolpica Ergast API |

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- A [Google Gemini API key](https://aistudio.google.com/apikey) (for AI insights)

### 1. Clone the repo

```bash
git clone https://github.com/abing-IO/F1-telemetry.git
cd F1-telemetry
```

### 2. Set up the frontend

```bash
npm install
```

### 3. Set up the backend

```bash
cd backend
python -m venv ../.venv
source ../.venv/bin/activate   # Windows: ..\.venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Configure environment variables

```bash
cp .env.example .env
# Edit .env and add your Gemini API key
```

### 5. Run the app

```bash
# Terminal 1 — Backend
cd backend
source ../.venv/bin/activate
python server.py

# Terminal 2 — Frontend
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend API at `http://localhost:5000`.

## 📁 Project Structure

```
veloce/
├── backend/
│   ├── server.py          # Flask API — telemetry, standings, AI endpoints
│   ├── requirements.txt   # Python dependencies
│   └── cache/             # FastF1 data cache (gitignored)
├── src/
│   ├── App.jsx            # Main app with routing & state
│   ├── components/
│   │   ├── Standings.jsx  # Championship standings view
│   │   ├── RaceData.jsx   # Telemetry charts & race data
│   │   ├── Analysis.jsx   # Deep analysis view
│   │   ├── InsightPanel.jsx # AI-powered insights (Gemini)
│   │   ├── PDFExport.jsx  # PDF report generation
│   │   └── ...
│   ├── hooks/             # Custom React hooks (data fetching, theme)
│   └── config/            # Driver/season configuration
├── docs/                  # Architecture & UML diagrams
├── .env.example           # Environment variables template
├── package.json
└── vite.config.js
```

## 📄 License

This is a mini project for personal/educational use. See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ and a lot of FastF1 cache data
</p>
