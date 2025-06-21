import os
from pathlib import Path
from dotenv import load_dotenv

def load_config():
    load_dotenv()
    cfg = {
        # Document Intelligence
        'ENDPOINT_DI': os.getenv('AZ_ENDPOINT'),
        'KEY_DI': os.getenv('AZ_KEY'),
        'MODEL_ID_LAYOUT': os.getenv('AZ_MODEL_ID'),
        'MODEL_ID_OCR': os.getenv('AZ_OCR_MODEL_ID'),
        'ANALYZE_MODE': os.getenv('AZ_ANALYZE_MODE'),

        # Blob Storage
        'STORAGE_CONN_STR': os.getenv('AZ_STORAGE_CONN_STRING'),
        'BLOB_CONTAINER': os.getenv('AZ_BLOB_CONTAINER'),

        # Table Storage
        'TABLE_NAME': os.getenv('AZ_TABLE_NAME'),
        'OUTPUT_CSV': Path(os.getenv('OUTPUT_CSV')),
        'SLOW_THRESHOLD': float(os.getenv('SLOW_THRESHOLD_S')),

        # Cognitive Search
        'SEARCH_ENDPOINT': os.getenv('AZ_SEARCH_ENDPOINT'),
        'SEARCH_KEY': os.getenv('AZ_SEARCH_KEY'),
        'INDEX_NAME': os.getenv('AZ_SEARCH_INDEX'),

        # Azure OpenAI Embeddings
        'OAI_ENDPOINT': os.getenv('AZ_OPENAI_ENDPOINT'),
        'OAI_KEY': os.getenv('AZ_OPENAI_KEY'),
        'OAI_DEPLOYMENT': os.getenv('AZ_EMBED_DEPLOY'),
        'OAI_API_VERSION': os.getenv('AZ_OPENAI_API_VERSION'),

        # GPT (Azure)
        'AZ_GPT_DEPLOYMENT': os.getenv('AZ_GPT_DEPLOYMENT'),
        'AZ_GPT_ENPOINT': os.getenv('AZ_GPT_OPENAI_ENDPOINT'),
        'AZ_GPT_KEY': os.getenv('AZ_GPT_OPENAI_4_KEY'),
        'GPT_OAI_KEY': os.getenv('AZ_GPT_OPENAI_KEY'),

        # Chunk sizes
        'MIN_CHUNK_SIZE': int(os.getenv('MIN_CHUNK_SIZE_CHARS')),
        'MAX_CHUNK_SIZE': int(os.getenv('MAX_CHUNK_SIZE_CHARS')),
        'COVERAGE_THRESHOLD': float(os.getenv('COVERAGE_THRESHOLD_PCT')),
    }

    missing = [k for k, v in cfg.items() if v is None]
    if missing:
        raise EnvironmentError(f"Faltan variables de entorno: {', '.join(missing)}")
    
    return cfg
