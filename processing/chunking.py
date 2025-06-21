import re
from utils.helpers import compile_list_regex

def detect_title_with_text_analytics(text: str, ta_client) -> bool:
    if not text or len(text.split()) < 2:
        return False
    if re.match(r'^.{1,50}:$', text) or re.match(r'^Capítulo\s+\d+', text, re.IGNORECASE):
        return True
    try:
        resp = ta_client.extract_key_phrases([text], language='es')[0]
        return bool(resp.key_phrases) and len(resp.key_phrases) < 2
    except Exception:
        return False

def normalize_lists(blocks):
    list_re = compile_list_regex()
    root, stack, last_list = [], [(0, [])], False
    for b in blocks:
        text = b.get('content', '')
        m = list_re.match(text)
        if m:
            indent = len(m.group('indent'))
            item = {'type': 'list_item', 'text': text[m.end():].strip(), 'children': []}
            while len(stack) > 1 and indent <= stack[-1][0]:
                stack.pop()
            stack[-1][1].append(item)
            stack.append((indent, item['children']))
            last_list = True
            continue
        if last_list and text.lstrip().startswith('o '):
            stack[-1][1].append({'type':'list_text', 'text':text.lstrip()[2:].strip()})
            continue
        last_list = False
        root.append(b)
    return root

def chunk_by_headings(blocks, ta_client):
    up_re    = re.compile(r'^[A-ZÁÉÍÓÚÑ\s]{5,}$')
    sec_re   = re.compile(r'^(\d+(?:\.\d+)*)\s+')
    colon_re = re.compile(r'^.{1,50}:$')
    chunks, cur = [], {'heading': None, 'paragraphs': []}

    def start_chunk(h):
        nonlocal cur
        if cur['paragraphs']:
            chunks.append(cur)
        cur = {'heading': h, 'paragraphs': []}

    for b in blocks:
        text = b.get('content', '')
        if (
            b.get('role') in ('title','sectionHeading')
            or up_re.match(text)
            or sec_re.match(text)
            or colon_re.match(text)
            or detect_title_with_text_analytics(text, ta_client)
        ):
            start_chunk(text)
        elif b.get('type') in ('paragraph','list_item','list_text'):
            cur['paragraphs'].append(text)
    if cur['paragraphs']:
        chunks.append(cur)
    return chunks
