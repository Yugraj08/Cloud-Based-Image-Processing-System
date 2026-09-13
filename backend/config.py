import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent

ASSETS_FOLDER = BASE_DIR / "assets"


# AWS
AWS_S3_BUCKET = os.getenv(
    "AWS_S3_BUCKET",
    "cloud-image-processor-bucket"
)

S3_PREFIX_ORIGINAL = "original/"
S3_PREFIX_PROCESSED = "processed/"


# Image processing
MAX_WIDTH = 800
MAX_HEIGHT = 800

SUPPORTED_FORMATS = {
    ".jpg",
    ".jpeg",
    ".png"
}


# Watermark
WATERMARK_PATH = ASSETS_FOLDER / "Watermark.jpg"

WATERMARK_POSITION = "bottom-right"

WATERMARK_OPACITY = 128

WATERMARK_PADDING = 20