import os
from pathlib import Path
from PIL import Image
from typing import Optional, Tuple

from config import MAX_WIDTH, MAX_HEIGHT, WATERMARK_PATH, WATERMARK_PADDING, WATERMARK_OPACITY
from logger import logger

class ImageProcessor:
    def __init__(self):
        """
        Initializes the ImageProcessor and pre-loads the watermark image to optimize batch processing.
        """
        self.watermark_image = self._load_watermark()

    def _load_watermark(self) -> Optional[Image.Image]:
        """
        Loads and prepares the watermark image with the configured opacity.
        """
        try:
            watermark_path = Path(WATERMARK_PATH)
            if not watermark_path.exists():
                logger.info(f"Watermark not found at {watermark_path}. Processing will continue without a watermark.")
                return None
                
            watermark = Image.open(watermark_path).convert("RGBA")
            
            # Apply opacity to the alpha channel
            alpha = watermark.split()[3]
            alpha = alpha.point(lambda p: p * (WATERMARK_OPACITY / 255.0))
            watermark.putalpha(alpha)
            
            return watermark
        except Exception as e:
            logger.error(f"Failed to load watermark: {str(e)}")
            return None

    def process_image(self, input_path: Path, output_path: Path) -> Tuple[bool, Optional[Tuple[int, int]], Optional[Tuple[int, int]]]:
        """
        Processes a single image: resizes it and adds a watermark.
        
        Args:
            input_path (Path): Path to the source image.
            output_path (Path): Path where the processed image will be saved.
            
        Returns:
            Tuple[bool, Optional[Tuple[int, int]], Optional[Tuple[int, int]]]: 
                (success, original_size, new_size)
        """
        try:
            with Image.open(input_path) as img:
                original_size = img.size
                
                # Convert to RGB if saving as JPG to prevent errors with Alpha channels
                if img.mode in ('RGBA', 'LA', 'P') and output_path.suffix.lower() in ('.jpg', '.jpeg'):
                    # Create a white background to replace transparency if any
                    background = Image.new("RGB", img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert("RGBA")
                    if 'A' in img.mode:
                        background.paste(img, mask=img.split()[3])
                    else:
                        background.paste(img)
                    img = background
                elif img.mode != 'RGBA' and output_path.suffix.lower() == '.png':
                    img = img.convert('RGBA')

                # Resize
                resized_img = self._resize_image(img)
                new_size = resized_img.size
                logger.info("Image resized")

                # Add Watermark
                if self.watermark_image:
                    final_img = self._add_watermark(resized_img)
                    logger.info("Watermark added")
                else:
                    final_img = resized_img

                # Save
                final_img.save(output_path, quality=95)
                logger.info("Image saved")
                
                return True, original_size, new_size
                
        except Exception as e:
            logger.error(f"Failed to process {input_path.name}")
            logger.error(str(e))
            return False, None, None

    def _resize_image(self, img: Image.Image) -> Image.Image:
        """
        Resizes the image preserving aspect ratio and places it in the center of an 800x800 canvas.
        """
        # Create an 800x800 canvas with a white or transparent background depending on mode
        bg_color = (0, 0, 0, 0) if img.mode == 'RGBA' else (255, 255, 255)
        canvas = Image.new(img.mode, (MAX_WIDTH, MAX_HEIGHT), bg_color)
        
        # Resize using thumbnail to maintain aspect ratio without stretching
        img_copy = img.copy()
        
        # In case we want to upscale smaller images to fit the bounding box, 
        # we can manually compute ratio instead of thumbnail. But since the prompt
        # explicitly requested Image.thumbnail((800,800)), we use it here.
        img_copy.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.Resampling.LANCZOS)
        
        # Calculate center position
        x = (MAX_WIDTH - img_copy.width) // 2
        y = (MAX_HEIGHT - img_copy.height) // 2
        
        # Paste the resized image onto the canvas
        if img_copy.mode == 'RGBA':
            canvas.paste(img_copy, (x, y), img_copy)
        else:
            canvas.paste(img_copy, (x, y))
            
        return canvas

    def _add_watermark(self, img: Image.Image) -> Image.Image:
        """
        Adds the pre-loaded watermark to the bottom-right corner with padding.
        """
        original_mode = img.mode
        
        # Convert base image to RGBA to properly compose with transparent watermark
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
            
        watermark_layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
        
        wm = self.watermark_image
        
        # Scale watermark down if it's too large for the current image
        if wm.width > img.width or wm.height > img.height:
            wm_copy = wm.copy()
            max_wm_width = max(1, img.width - (WATERMARK_PADDING * 2))
            max_wm_height = max(1, img.height - (WATERMARK_PADDING * 2))
            wm_copy.thumbnail((max_wm_width, max_wm_height), Image.Resampling.LANCZOS)
            wm_to_paste = wm_copy
        else:
            wm_to_paste = wm
            
        # Calculate position for bottom-right corner
        x = img.width - wm_to_paste.width - WATERMARK_PADDING
        y = img.height - wm_to_paste.height - WATERMARK_PADDING
        
        # Prevent negative coordinates on very small images
        x = max(0, x)
        y = max(0, y)

        watermark_layer.paste(wm_to_paste, (x, y))
        combined = Image.alpha_composite(img, watermark_layer)
        
        # Convert back to the original mode
        if original_mode != 'RGBA':
            combined = combined.convert(original_mode)
            
        return combined
