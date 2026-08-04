from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def create_sample_watermark():
    path = BASE_DIR / "assets" / "watermark.png"
    # Create a transparent background
    img = Image.new('RGBA', (200, 100), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Draw simple text-like shape or actual text if font is available, 
    # but to avoid missing font issues, let's draw some geometric shapes.
    draw.rectangle([10, 10, 190, 90], outline=(255, 255, 255, 255), width=5)
    draw.ellipse([80, 30, 120, 70], fill=(255, 255, 255, 255))
    img.save(path)
    print(f"Created sample watermark at {path}")

def create_sample_images():
    input_dir = BASE_DIR / "input"
    
    # 1. cat.jpg - 1000x1000 Red
    img1 = Image.new('RGB', (1000, 1000), color='red')
    img1.save(input_dir / "cat.jpg")
    
    # 2. dog.png - 1200x800 Blue
    img2 = Image.new('RGBA', (1200, 800), color='blue')
    img2.save(input_dir / "dog.png")
    
    # 3. flower.jpg - 500x500 Green
    img3 = Image.new('RGB', (500, 500), color='green')
    img3.save(input_dir / "flower.jpg")
    
    print("Created sample input images.")

if __name__ == "__main__":
    create_sample_watermark()
    create_sample_images()
