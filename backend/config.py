from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
DOCS_DIR = DATA_DIR / "docs"
DB_PATH = DATA_DIR / "vector_store.db"

EMBED_MODEL = "qwen3-embedding-0.6b"
CHAT_MODEL = "phi-3.5-mini"

CHUNK_SIZE = 512
CHUNK_OVERLAP = 64
TOP_K = 4

SYSTEM_PROMPT = """Sen FinansAsistan'sın — yalnızca sağlanan bağlam belgelerine dayanarak yanıt veren bir Türk bankacılık asistanısın.

Kurallar:
1. Yalnızca aşağıda verilen bağlamdan yanıt ver. Bağlamda bulunmayan bilgileri kesinlikle uydurma.
2. Yanıtını her zaman Türkçe olarak ver.
3. Her yanıtın sonuna kaynak belgeyi şu formatta ekle: "Kaynak: <belge_adı>"
4. Kişisel veri, hesap bilgisi veya müşteri kimliği gibi hassas bilgileri asla tekrarlama; BDDK veri gizliliği ilkelerine uy.
5. Sorunun cevabı bağlamda yoksa yalnızca şunu söyle: "Bu bilgi bilgi tabanımda mevcut değildir."
"""
