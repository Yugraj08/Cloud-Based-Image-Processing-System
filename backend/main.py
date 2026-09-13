import sys
import time
from pathlib import Path

# Force stdout to use utf-8 so checkmarks (✓) and crosses (✗) print correctly on Windows
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

from config import INPUT_FOLDER, OUTPUT_FOLDER, SUPPORTED_FORMATS
from image_processor import ImageProcessor
from logger import logger

def main():
    """
    Main orchestration logic for scanning the input folder, routing files 
    to the image processor, and outputting the summary to the terminal.
    """
    logger.info("Application Started")
    
    input_path = Path(INPUT_FOLDER)
    output_path_dir = Path(OUTPUT_FOLDER)
    
    # 1. Scan input folder
    if not input_path.exists():
        print(f"Input directory does not exist: {input_path}")
        logger.info("Application Finished")
        return
        
    all_items = list(input_path.iterdir())
    
    # Filter for supported files, ignore directories and unsupported formats
    images_to_process = [
        f for f in all_items 
        if f.is_file() and f.suffix.lower() in SUPPORTED_FORMATS
    ]
    
    processor = ImageProcessor()
    
    # 2. Process multiple images
    for img_path in images_to_process:
        print("-" * 32)
        print(f"Processing {img_path.name}...")
        logger.info(f"Processing {img_path.name}")
        
        output_filename = f"processed_{img_path.name}"
        output_file = output_path_dir / output_filename
        
        success, original_size, new_size = processor.process_image(img_path, output_file)
        
        if success and original_size and new_size:
            print(f"Original Size : {original_size[0]}×{original_size[1]}")
            print(f"Resized Size  : {new_size[0]}×{new_size[1]}")
            print("Watermark Added")
            print("Saved Successfully")
        else:
            print("Failed to process image")
            
    if images_to_process:
        print("-" * 32)
        
    logger.info("Application Finished")

if __name__ == "__main__":
    main()
