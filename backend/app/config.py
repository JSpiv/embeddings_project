import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

TMP_DIR = Path(__file__).parent.parent / "tmp"
TMP_DIR.mkdir(exist_ok=True)

SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY", "")

# Maximum input file size for user uploads (50 MB)
MAX_UPLOAD_BYTES: int = 50 * 1024 * 1024

# Maximum cells for user uploads (processed live — kept small for responsiveness)
MAX_CELLS: int = 10_000
