# 🚀 Feasibility Analysis Tool

A professional, AI-powered business feasibility analysis tool built with **FastAPI**, **Langgraph**, and **Groq (Llama 3)**.

![Feasibility Analysis](https://img.shields.io/badge/AI-Langgraph-blueviolet)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)
![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB)

## ✨ Features
- **Intelligent Research**: Simulates market research using agentic workflows.
- **Deep Analysis**: Uses Llama 3 (via Groq) to generate a structured 6-part feasibility report.
- **Premium UI**: Glassmorphism design with responsive cards and real-time status updates.
- **Unified Architecture**: Single-server setup serving both the React frontend and the FastAPI backend.

## 🛠️ Tech Stack
- **AI Agent**: Langgraph
- **LLM**: Groq (Llama-3.3-70b-versatile)
- **Backend API**: FastAPI
- **Database**: SQLite (SQLAlchemy)
- **Frontend**: React (Vite)
- **Styling**: Vanilla CSS (Custom Design System)

## 🚦 Getting Started

### 1. Configure Environment
Create a `.env` file in the `backend/` directory:
```env
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=sqlite:///./feasibility.db
```

### 2. Install Dependencies
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
npm run build
```

### 3. Run the Application
Start the unified server:
```bash
cd backend
python main.py
```
Visit [**http://localhost:8888**](http://localhost:8888) to start analyzing ideas.

## 📂 Project Structure
- `backend/`: FastAPI server and Langgraph logic.
- `frontend/`: React source code and styling.
- `frontend/dist/`: Production build of the UI.
- `start.bat`: One-click startup script.

## 📝 License
MIT