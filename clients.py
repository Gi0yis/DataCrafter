from azure.core.credentials import AzureKeyCredential
from azure.storage.blob import BlobServiceClient
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.ai.textanalytics import TextAnalyticsClient
from azure.data.tables import TableClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents import SearchClient
from openai import AzureOpenAI

def init_clients(cfg):
    # Blob & Container
    blob_service = BlobServiceClient.from_connection_string(cfg['STORAGE_CONN_STR'])
    container_client = blob_service.get_container_client(cfg['BLOB_CONTAINER'])
    # AI Document Intelligence
    doc_client = DocumentIntelligenceClient(cfg['ENDPOINT_DI'], AzureKeyCredential(cfg['KEY_DI']))
    ta_client = TextAnalyticsClient(cfg['ENDPOINT_DI'], AzureKeyCredential(cfg['KEY_DI']))
    # Table Storage
    table_client = TableClient.from_connection_string(cfg['STORAGE_CONN_STR'], cfg['TABLE_NAME'])
    try:
        table_client.create_table()
    except Exception:
        pass
    # Cognitive Search
    index_client = SearchIndexClient(cfg['SEARCH_ENDPOINT'], AzureKeyCredential(cfg['SEARCH_KEY']))
    search_client = SearchClient(cfg['SEARCH_ENDPOINT'], cfg['INDEX_NAME'], AzureKeyCredential(cfg['SEARCH_KEY']))
    # Azure OpenAI client
    oai_client = AzureOpenAI(
        api_key=cfg['OAI_KEY'],
        api_version=cfg['OAI_API_VERSION'],
        azure_endpoint=cfg['OAI_ENDPOINT']
    )
    return {
        'blob': container_client,
        'doc': doc_client,
        'ta': ta_client,
        'table': table_client,
        'index': index_client,
        'search': search_client,
        'oai': oai_client
    }
