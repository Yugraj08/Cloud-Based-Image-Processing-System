import os
from pathlib import Path

# Base Directory Paths
BASE_DIR = Path(__file__).resolve().parent
INPUT_FOLDER = BASE_DIR / "input"
OUTPUT_FOLDER = BASE_DIR / "output"
ASSETS_FOLDER = BASE_DIR / "assets"
LOGS_FOLDER = BASE_DIR / "logs"

# Ensure directories exist (Useful for local prototype)
INPUT_FOLDER.mkdir(exist_ok=True)
OUTPUT_FOLDER.mkdir(exist_ok=True)
ASSETS_FOLDER.mkdir(exist_ok=True)
LOGS_FOLDER.mkdir(exist_ok=True)

# Image Processing Configuration
MAX_WIDTH = 800
MAX_HEIGHT = 800
SUPPORTED_FORMATS = {".jpg", ".jpeg", ".png"}

# Watermark Configuration
WATERMARK_PATH = ASSETS_FOLDER / "Watermark.jpg"
WATERMARK_POSITION = "bottom-right"  # Currently only bottom-right is supported
WATERMARK_OPACITY = 128  # 0 to 255 (128 is 50% opacity)
WATERMARK_PADDING = 20  # Pixels from the edge

# Logging Configuration
LOG_FILE = LOGS_FOLDER / "application.log"

# AWS Future Scope configurations could be placed here:
# AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET", "my-bucket")
