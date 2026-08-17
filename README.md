<div align="center">

# 🚀 Ayush Aryan — Portfolio

**High-impact backend engineer portfolio** with an AI-powered chatbot.

[![Vercel](https://img.shields.io/badge/Live-12d640?style=for-the-badge&logo=vercel&logoColor=white)](https://ayush-aryan1309-portfolio.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Cloudflare Workers](https://img.shields.io/badge/Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)

</div>

---

## ✨ Features

- **Hero Section** — Animated typing effect, smooth scroll navigation, responsive design
- **About** — Bio, impact stats (100K+ concurrent users, 4 apps shipped), "Why Hire Me" cards
- **Experience** — Timeline with roles at Visionify, EventStrat, Sneaco, and Zolatte
- **Projects** — 9 project cards with tech stack, GitHub links, and external details
- **Skills** — Visual grid with tech badges (Java, Spring Boot, Kafka, Redis, AI/ML, etc.)
- **Contact** — Location, email, phone, social links
- **AI Chatbot** — Floating RAG chatbot that answers questions about Ayush using LLM + embeddings
- **Resume Admin** — Easter egg (click avatar "A" 5 times) to upload/manage resume PDFs
- **Resume Selector** — Modal to view/download resumes (Google Drive links for production, local uploads for dev)
- **SEO** — Full JSON-LD schemas (Person, WebSite, ProfilePage, FAQ), semantic HTML, breadcrumbs
- **Responsive** — Mobile-first design with dark theme

## 🏗 Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Browser    │────▶│   Vercel     │────▶│ Cloudflare Worker │
│  (React SPA) │     │  (Static)    │     │  (Chat API + RAG)│
└──────────────┘     └──────────────┘     └──────────────────┘
                                                    │
                          ┌──────────────────┐      │
                          │ Python Backend   │◀─────┘
                          │ (Local - Resume  │
                          │  Upload + Admin) │
                          └──────────────────┘
```

### Components

| Component | Tech | Hosting | Purpose |
|---|---|---|---|
| **Frontend** | React 19 + Vite + Tailwind CSS 4 | [Vercel](https://vercel.com) (free) | Portfolio website |
| **Chat API** | TypeScript + Cloudflare Workers | [Cloudflare Workers](https://workers.cloudflare.com) (free) | LLM chat + RAG |
| **Embeddings** | Cloudflare Workers AI (bge-small) | Workers (free) | Semantic search |
| **LLM** | Groq (llama-3.1) | [Groq](https://groq.com) (free tier) | Chat responses |
| **Admin Backend** | Python + FastAPI | Local only | Resume PDF upload/management |

## 🛠 Tech Stack

**Frontend:** React 19, Vite 8, Tailwind CSS 4, JavaScript (JSX)

**Backend (Worker):** TypeScript, Cloudflare Workers, Groq SDK, Workers AI

**Backend (Local):** Python, FastAPI, PyMuPDF, sentence-transformers, boto3 (R2)

**Infrastructure:** Vercel, Cloudflare Workers, Cloudflare R2 (optional PDF storage)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+ (for local resume admin)

### 1. Frontend

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:5173
```

### 2. Chat API (Cloudflare Worker)

```bash
cd chatbot/backend

# Install & login
npm install
npx wrangler login

# Set your API key
npx wrangler secret put GROQ_API_KEY

# Deploy
npx wrangler deploy
```

Set `VITE_API_URL` to your worker URL for the frontend to use it.

### 3. Resume Admin (Local Python Backend)

```bash
cd chatbot/backend-python

# Install dependencies
pip install -r requirements.txt

# Start server
python -m src.main
# → http://localhost:8001
```

Open the chatbot avatar menu (click "A" 5 times) to upload and manage resumes.

## 📁 Project Structure

```
portfolio/
├── src/                    # React frontend
│   ├── components/         # All React components
│   │   ├── Hero.jsx        # Landing section with animation
│   │   ├── Navbar.jsx      # Fixed navigation bar
│   │   ├── Chatbot.jsx     # Floating AI chatbot + resume admin
│   │   ├── ResumeSelector.jsx  # Resume download modal
│   │   ├── About.jsx, Experience.jsx, Projects.jsx ...etc
│   ├── data/
│   │   └── portfolio.js    # All portfolio content & SEO data
│   ├── index.css           # Global styles + Tailwind
│   ├── App.jsx             # Root component
│   └── main.jsx            # Entry point
├── chatbot/
│   ├── backend/            # Cloudflare Worker (TypeScript)
│   │   ├── src/
│   │   │   ├── index.ts    # Worker entry + all API routes
│   │   │   ├── config.ts   # Environment config
│   │   │   ├── llm/        # LLM providers (Groq, OpenAI, Gemini, Custom)
│   │   │   └── rag/        # RAG pipeline, embeddings, knowledge base
│   │   └── wrangler.toml
│   └── backend-python/     # Local Python backend
│       └── src/
│           ├── main.py     # FastAPI server
│           ├── resume_manager.py  # PDF upload, chunking, embeddings
│           └── rag/        # Knowledge base, embedder, pipeline
├── assets/                 # Static assets (CSS, JS, images)
├── public/                 # Public files (sitemap, robots)
├── projects/               # Static project detail pages (HTML)
├── DEPLOYMENT.md           # Full deployment guide
└── README.md               # This file
```

## 🔧 Environment Variables

| Variable | Required For | Description |
|---|---|---|
| `VITE_API_URL` | Frontend | Cloudflare Worker URL (e.g., `https://portfolio-chatbot.xxx.workers.dev`) |
| `GROQ_API_KEY` | Worker | Groq API key for LLM chat |
| `UPLOAD_STORAGE_S3_*` | Python backend | Cloudflare R2 credentials for resume PDF storage |

## 📄 License

MIT
