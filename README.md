# 🏎️ F1 TelemetryHub

A real-time Formula 1 telemetry visualization and analysis dashboard. Compare driver performances, explore race data, and get AI-powered insights — all in a sleek, responsive web app.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Python-000000?logo=flask&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

## ✨ Features

- **Live Standings** — Current driver & constructor championship standings
- **Telemetry Comparison** — Overlay speed, throttle, brake, gear, and DRS traces for multiple drivers
- **Lap Analysis** — Sector times, gap analysis, and theoretical best laps
- **Race Dominance** — Visualize who led each sector throughout a race
- **AI Insights** — Gemini-powered analysis of race strategies, pace, and performance
- **PDF Export** — Download session reports as PDF
- **Shareable Links** — Permalink support via URL query parameters
- **Dark / Light Mode** — Toggle between themes
- **Multi-Season Support** — Data from 2023 and 2024 seasons

## 🛠️ Tech Stack

| Layer    | Technology                                    |
| -------- | --------------------------------------------- |
| Frontend | React 19, Vite, Tailwind CSS 4, Recharts, GSAP |
| Backend  | Python, Flask, FastF1, Pandas, NumPy          |
| AI       | Google Gemini API                             |
| Export   | jsPDF, html-to-image                          |

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- A [Google Gemini API key](https://aistudio.google.com/apikey) (for AI insights)

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/f1-telemetry.git
cd f1-telemetry
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
f1-telemetry/
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
│   │   ├── InsightPanel.jsx # AI-powered insights
│   │   ├── PDFExport.jsx  # PDF report generation
│   │   └── ...
│   ├── hooks/             # Custom React hooks (data fetching, theme)
│   └── config/            # Driver/season configuration
├── docs/                  # Architecture & UML diagrams
├── .env.example           # Frontend env template
├── package.json
└── vite.config.js
```

## 📄 License

This project is for personal/educational use. See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ and a lot of FastF1 cache data
</p>
