from typing import List

def get_embedding(text: str, client, deployment: str) -> List[float]:
    """Genera un embedding usando AzureOpenAI.client.embeddings.create."""
    response = client.embeddings.create(
        model=deployment,
        input=text
    )
    return response.data[0].embedding
