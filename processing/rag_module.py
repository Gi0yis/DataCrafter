from config import load_config
from clients import init_clients
from processing.embeddings import get_embedding
from openai import AzureOpenAI
from azure.search.documents.models import VectorizedQuery

# Carga de configuración y clientes de Azure
cfg = load_config()
clients = init_clients(cfg)
search_client = clients['search']      # Azure Cognitive Search
embedding_client = clients['oai']      # AzureOpenAI para embeddings

# Credenciales fijas para el chat GPT (solo aquí; el resto usa tu config)
GPT_ENDPOINT   = cfg['AZ_GPT_ENPOINT']
GPT_API_KEY    = cfg['AZ_GPT_KEY']
GPT_DEPLOYMENT = cfg['AZ_GPT_DEPLOYMENT']

# Cliente de AzureOpenAI para generación de chat
chat_client = AzureOpenAI(
    api_key=GPT_API_KEY,
    azure_endpoint=GPT_ENDPOINT,
    api_version="2025-01-01-preview"
)

def run_rag_question(question: str, k: int = 5, temperature: float = 0.7) -> str:
    """
    Ejecuta una consulta RAG sobre tu repositorio de documentos:
      1) Genera embedding de la pregunta.
      2) Recupera k chunks desde Cognitive Search usando VectorizedQuery.
      3) Llama a GPT para generar la respuesta.

    :param question: Texto de la pregunta a responder.
    :param k: Número de fragmentos a recuperar (por defecto 5).
    :param temperature: Controla cuánto “se suelta” el modelo (por defecto 0.7).
    :return: Respuesta generada por el modelo de chat.
    """
    # 1) Embedding de la pregunta
    query_vec = get_embedding(question, embedding_client, cfg['OAI_DEPLOYMENT'])

    # 2) Vector search: construye el VectorizedQuery
    vec_q = VectorizedQuery(
        vector=query_vec,
        fields="contentVector",
        k_nearest_neighbors=k
    )

    results = search_client.search(
        search_text="*",
        vector_queries=[vec_q],
        top=k
    )

    # Extrae únicamente el campo `content` de cada documento
    chunks = [doc.get("content", "") for doc in results]
    contexto = "\n\n---\n\n".join(chunks)

    # 3) Construye el prompt para GPT
    messages = [
        {
            "role": "system",
            "content": (
                "Eres un asistente virtual con buena base de conocimientos. Tu misión es:\n"
                "  1. Priorizar el contexto proporcionado, pero si hay lagunas o para enriquecer la explicación, puedes apoyarte en tu conocimiento general.\n"
                "  2. Responder de forma clara, precisa y completa, ofreciendo ejemplos o explicaciones adicionales cuando ayuden.\n"
                "  3. Si la pregunta no puede contestarse con certeza, indica claramente que la información no es suficiente y sugiere dónde buscar más.\n"
                "  4. Organiza la respuesta en párrafos claros; si hay varios puntos, sepáralos o numéralos."
            )
        },
        {
            "role": "system",
            "content": f"Contexto relevante (hasta {k} fragmentos):\n\n{contexto}"
        },
        {
            "role": "user",
            "content": (
                "Usando el contexto anterior como base, responde a la siguiente pregunta de manera completa y didáctica. "
                "Puedes añadir tu propio razonamiento o ejemplos útiles y, si citas contenido del contexto, menciona el fragmento correspondiente (ej.: “Según el fragmento 3…”):\n\n"
                f"Pregunta: {question}"
            )
        }
    ]

    # Llama al modelo de chat
    response = chat_client.chat.completions.create(
        model=GPT_DEPLOYMENT,
        messages=messages,
        max_tokens=1024,
        temperature=temperature,
        presence_penalty=0.3,
        frequency_penalty=0.0
    )

    return response.choices[0].message.content
