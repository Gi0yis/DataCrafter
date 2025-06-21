import io
import fitz

def analyze_bytes(stream: io.BytesIO, model: str, doc_client):
    """Analiza bytes como documento con el modelo especificado."""
    return doc_client.begin_analyze_document(model, stream).result(timeout=120)

def extract_paragraphs_objects(paragraph_objs):
    """Convierte objetos de párrafo de Document Intelligence en dicts filtrados."""
    paras = []
    for p in paragraph_objs:
        if (p.role or 'paragraph') in ('pageFooter','pageNumber'):
            continue
        paras.append({
            'type': 'paragraph',
            'role': p.role or 'paragraph',
            'content': p.content.strip(),
            'page': p.bounding_regions[0].page_number
        })
    return paras

def analyze_document_stream(stream: io.BytesIO, doc_client, use_ocr: bool, model_layout: str, model_ocr: str):
    """Analiza el documento completo, con OCR si se solicita."""
    stream.seek(0)
    if use_ocr:
        doc = fitz.open(stream=stream.getbuffer(), filetype='pdf')
        paras_all, img_sizes = [], []
        for page in doc:
            pix = page.get_pixmap()
            img_data = pix.tobytes('png')
            img_sizes.append(len(img_data))
            paras = analyze_bytes(io.BytesIO(img_data), model_ocr, doc_client)
            paras_all.extend(getattr(paras, 'paragraphs', []))
        return extract_paragraphs_objects(paras_all), img_sizes
    else:
        result = doc_client.begin_analyze_document(model_layout, stream).result(timeout=120)
        return extract_paragraphs_objects(getattr(result, 'paragraphs', [])), []
