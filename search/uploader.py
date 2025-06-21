def upload_documents(search_client, docs: list):
    results = search_client.upload_documents(documents=docs)
    for r in results:
        if not r.succeeded:
            print(f"Error indexando {r.key}: {r.error_message}")
