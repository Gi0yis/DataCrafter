import os
import threading
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from azure.storage.blob import BlobServiceClient

from config import load_config
from clients import init_clients

from processing.pipeline import run_pipeline
from processing.rag_module import run_rag_question

app = Flask(__name__)
# Habilitar CORS para todas las rutas y orígenes
CORS(app, resources={r"/*": {"origins": "*"}})

# Configuración de Azure Storage
cfg = load_config()
clients = init_clients(cfg)
CONN_STR  = os.getenv("AZ_STORAGE_CONN_STRING")
CONTAINER = os.getenv("AZ_BLOB_CONTAINER")
blob_svc  = BlobServiceClient.from_connection_string(CONN_STR)

# Endpoint para subir archivos y disparar pipeline
@app.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No se envió ningún archivo bajo la clave 'file'"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "El archivo no tiene nombre"}), 400

    filename = secure_filename(file.filename)
    ext = os.path.splitext(filename)[1].lower()
    if ext not in {".pdf", ".png", ".jpg", ".jpeg"}:
        return jsonify({"error": "Tipo de archivo no permitido"}), 400

    # Genera nombre único y sube
    blob_name = f"{uuid.uuid4().hex}{ext}"
    try:
        container_client = blob_svc.get_container_client(CONTAINER)
        blob_client = container_client.get_blob_client(blob_name)
        blob_client.upload_blob(file.stream, overwrite=True)
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500

    # Corre pipeline en background
    threading.Thread(target=run_pipeline, daemon=True).start()

    return jsonify({"status": "ok", "blob_name": blob_name}), 201

# Endpoint para consultas RAG desde Postman
@app.route("/query", methods=["POST"])
def query():
    data = request.get_json(force=True)
    question = data.get("question")
    k = data.get("k", 5)
    if not question:
        return jsonify({"error": "Se requiere el campo 'question' en JSON"}), 400

    try:
        answer = run_rag_question(question, k)
        return jsonify({"answer": answer}), 200
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)