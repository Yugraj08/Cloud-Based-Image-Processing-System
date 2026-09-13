import urllib.request
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
INPUT_DIR = BASE_DIR / "input"
ASSETS_DIR = BASE_DIR / "assets"

images = {
    "cat.jpg": "https://upload.wikimedia.org/wikipedia/commons/4/4d/Cat_November_2010-1a.jpg",
    "dog.png": "https://upload.wikimedia.org/wikipedia/commons/d/d0/German_Shepherd_-_DSC_0346_%2810096362833%29.jpg",
    "flower.jpg": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Flower_poster_2.jpg"
}

watermark_url = "https://upload.wikimedia.org/wikipedia/commons/a/ab/Logo_TV_2015.png"

def download_file(url, path):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response, open(path, 'wb') as out_file:
        out_file.write(response.read())

def download_images():
    print("Downloading actual images...")
    for filename, url in images.items():
        path = INPUT_DIR / filename
        print(f"Downloading {filename}...")
        try:
            download_file(url, path)
            print(f"Saved {filename}")
        except Exception as e:
            print(f"Failed to download {filename}: {e}")
            
    print("Downloading watermark...")
    watermark_path = ASSETS_DIR / "watermark.png"
    try:
        download_file(watermark_url, watermark_path)
        print("Saved watermark.png")
    except Exception as e:
        print(f"Failed to download watermark: {e}")

if __name__ == "__main__":
    download_images()
