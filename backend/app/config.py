import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

TMP_DIR = Path(__file__).parent.parent / "tmp"
TMP_DIR.mkdir(exist_ok=True)

SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY", "")

# Maximum input file size (500 MB — hard storage limit)
MAX_UPLOAD_BYTES: int = 500 * 1024 * 1024

# Maximum cells allowed for processing (UMAP/t-SNE become impractical above this)
MAX_CELLS: int = 50_000
