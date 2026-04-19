from langchain_openai import ChatOpenAI
from core.config import settings

def get_llm(model: str = None, temperature: float = 0.7):
    """
    Factory function to initialize and return the language model.
    Prioritizes Groq if GROQ_API_KEY is present, otherwise falls back to OpenAI.
    """
    if settings.GROQ_API_KEY:
        try:
            from langchain_groq import ChatGroq
            return ChatGroq(
                model=model or "llama-3.3-70b-versatile",
                groq_api_key=settings.GROQ_API_KEY,
                temperature=temperature,
            )
        except ImportError:
            print("⚠️ langchain-groq not installed. Falling back to OpenAI.")
    
    return ChatOpenAI(
        model=model or "gpt-4o-mini",
        openai_api_key=settings.OPENAI_API_KEY,
        temperature=temperature,
    )
