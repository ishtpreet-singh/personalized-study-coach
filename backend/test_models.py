import asyncio
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from app.core.config import settings

def main():
    try:
        models = ChatNVIDIA(api_key=settings.NVIDIA_API_KEY).get_available_models()
        print("Available models:")
        for m in models:
            if 'llama' in m.id.lower() or 'meta' in m.id.lower():
                print(m.id)
    except Exception as e:
        print("Exception:", e)

main()
