import time

def compute_chunk_metrics(paras, chunks, img_sizes, min_size: int, max_size: int):
    start = time.perf_counter()
    total_len = sum(len(p['content']) for p in paras)
    unique, seen, dup_cnt = [], set(), 0
    for c in chunks:
        if not c['paragraphs']:
            continue
        key = ' '.join(c['paragraphs'])[:100]
        h = hash(key)
        if h in seen:
            dup_cnt += 1
            continue
        seen.add(h)
        unique.append(c)
    sizes = [len(' '.join(c['paragraphs'])) for c in unique]
    too_small = sum(1 for s in sizes if s < min_size)
    too_large = sum(1 for s in sizes if s > max_size)
    metrics = {
        'num_chunks': len(sizes),
        'chunk_size_avg': sum(sizes)/len(sizes) if sizes else 0,
        'chunk_size_min': min(sizes) if sizes else 0,
        'chunk_size_max': max(sizes) if sizes else 0,
        'coverage_pct': (sum(sizes)/total_len*100) if total_len else 0,
        'num_duplicates_removed': dup_cnt,
        'num_chunks_too_small': too_small,
        'num_chunks_too_large': too_large,
        'num_images_generated': len(img_sizes),
        'avg_image_size_bytes': sum(img_sizes)/len(img_sizes) if img_sizes else 0,
        'processing_time_s': time.perf_counter() - start
    }
    return metrics, unique
