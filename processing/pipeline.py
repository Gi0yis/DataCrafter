import io
from pathlib import Path
from datetime import datetime, timezone

import json

from config import load_config
from utils.logging_config import configure_logging
from clients import init_clients
from processing.analyzer import analyze_document_stream
from processing.chunking import normalize_lists, chunk_by_headings
from processing.embeddings import get_embedding
from processing.metrics import compute_chunk_metrics

from azure.core.exceptions import ResourceNotFoundError
from azure.data.tables import UpdateMode
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex,
    SimpleField,
    SearchableField,
    SearchFieldDataType,
    VectorSearch,
    VectorSearchProfile,
    HnswAlgorithmConfiguration
)


def ensure_vector_index(index_client: SearchIndexClient, index_name: str):
    """
    Verifica la existencia del índice vectorial y lo crea o actualiza si no existe.
    """
    try:
        index_client.get_index(name=index_name)
    except ResourceNotFoundError:
        # Definición de campos del índice
        fields = [
            SimpleField(name="id", type=SearchFieldDataType.String, key=True),
            SearchableField(
                name="content",
                type=SearchFieldDataType.String,
                analyzer_name="en.lucene"
            ),
            SimpleField(name="file_name", type=SearchFieldDataType.String),
            # Campo vectorial con dimensiones y perfil de búsqueda
            SimpleField(
                name="contentVector",
                type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                searchable=True,
                vector_search_dimensions=1536,
                vector_search_profile_name="hnsw-config"
            ),
        ]

        # Configuración de búsqueda vectorial con perfil y algoritmo HNSW
        vector_search = VectorSearch(
            profiles=[
                VectorSearchProfile(
                    name="hnsw-config",
                    algorithm_configuration_name="hnsw-algo"
                )
            ],
            algorithms=[
                HnswAlgorithmConfiguration(
                    name="hnsw-algo",
                    parameters={
                        "m": 4,
                        "efConstruction": 400,
                        "efSearch": 500,
                        "metric": "cosine"
                    }
                )
            ]
        )

        # Crear o actualizar el índice vectorial
        index = SearchIndex(
            name=index_name,
            fields=fields,
            vector_search=vector_search
        )
        index_client.create_or_update_index(index)


def run_pipeline():
    """
    Ejecuta el procesamiento de blobs, asegurando siempre que el índice vectorial existe
    y merge_or_upload_documents para conservar datos previos.
    """
    configure_logging()
    cfg = load_config()
    clients = init_clients(cfg)

    blob_client = clients['blob']
    doc_client = clients['doc']
    ta_client = clients['ta']
    table_client = clients['table']
    search_client = clients['search']
    index_client = clients['index']
    oai_client = clients['oai']

    # Asegurar existencia del índice vectorial
    ensure_vector_index(index_client, cfg['INDEX_NAME'])

    # Procesar cada blob en el contenedor
    for blob in blob_client.list_blobs():
        name = blob.name
        if not name.lower().endswith(('.pdf', '.png', '.jpg', '.jpeg', '.tiff')):
            continue

        try:
            # Descargar y analizar documento
            data = blob_client.get_blob_client(name).download_blob().readall()
            stream = io.BytesIO(data)

            paras, img_sizes = analyze_document_stream(
                stream=stream,
                doc_client=doc_client,
                use_ocr=(cfg['ANALYZE_MODE'] == 'ocr'),
                model_layout=cfg['MODEL_ID_LAYOUT'],
                model_ocr=cfg['MODEL_ID_OCR']
            )
            blocks = normalize_lists(paras)
            chunks = chunk_by_headings(blocks, ta_client)

            metrics, unique_chunks = compute_chunk_metrics(
                paras, chunks, img_sizes,
                cfg['MIN_CHUNK_SIZE'], cfg['MAX_CHUNK_SIZE']
            )

            # Generar embeddings y preparar documentos
            docs = []
            stem = Path(name).stem
            for idx, c in enumerate(unique_chunks):
                text = ' '.join(c['paragraphs'])
                doc_id = f"{stem}-{idx}"
                vec = get_embedding(text, oai_client, cfg['OAI_DEPLOYMENT'])
                docs.append({
                    'id': doc_id,
                    'content': text,
                    'file_name': name,
                    'contentVector': vec
                })

            # Subir con merge_or_upload para conservar lo previo
            if docs:
                search_client.merge_or_upload_documents(documents=docs)

            # Guardar métricas en Azure Table Storage
            entity = {
                'PartitionKey': Path(name).suffix.lstrip('.'),
                'RowKey': name,
                'file_name': name,
                'file_type': Path(name).suffix.lstrip('.'),
                'original_size_bytes': len(data),
                **metrics,
                'slow': metrics['processing_time_s'] > cfg['SLOW_THRESHOLD'],
                'processing_date': datetime.now(timezone.utc).isoformat()
            }
            table_client.upsert_entity(entity=entity, mode=UpdateMode.MERGE)

        except Exception as e:
            print(f"Error procesando {name}: {e}")
