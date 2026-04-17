import uvicorn
import os
from contextlib import asynccontextmanager

from core.database import init_db
from app import app


@asynccontextmanager
async def lifespan(_app):
    # ── Startup ───────────────────────────────────────────────────────────────
    print("Starting up... initializing database")
    try:
        from core.database import engine
        with engine.connect() as connection:
            print("✅ Successfully connected to the PostgreSQL database!")
        init_db()
        print("✅ Database tables verified/initialized!")
    except Exception as e:
        print(f"❌ ERROR: Failed to connect to or initialize the database. Please check your POSTGRES_URL.")
        print(f"Details: {e}")
        
    preload_rag = os.getenv("PRELOAD_RAG_ON_STARTUP", "").lower() in {"1", "true", "yes"}
    if preload_rag:
        print("Starting up RAG embedding models...")
        try:
            from rag.embedder import _init_qdrant
            _init_qdrant()
            print("✅ MiniLM-L6-v2 Embedder & Qdrant initialized locally!")
        except ImportError as e:
            print(f"⚠️  RAG packages missing: {e}")
        except Exception as e:
            print(f"⚠️  Qdrant initialization error: {e}")
    else:
        print("Skipping eager RAG startup; Qdrant will initialize lazily on first RAG request.")
        
    yield
    try:
        from rag.embedder import close_qdrant
        close_qdrant()
    except Exception:
        pass
    print("Shutting down...")

app.router.lifespan_context = lifespan

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
