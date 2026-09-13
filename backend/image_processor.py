from pathlib import Path
from PIL import Image
from typing import Optional, Tuple

from config import (
    MAX_WIDTH,
    MAX_HEIGHT,
    WATERMARK_PATH,
    WATERMARK_PADDING,
    WATERMARK_OPACITY
)
from logger import logger


class ImageProcessor:

    def __init__(self):
        self.watermark_image = self._load_watermark()

    def _load_watermark(self) -> Optional[Image.Image]:
        try:
            watermark_path = Path(WATERMARK_PATH)

            if not watermark_path.exists():
                logger.info(
                    f"Watermark not found at {watermark_path}. "
                    "Processing will continue without a watermark."
                )
                return None

            watermark = Image.open(watermark_path).convert("RGBA")

            alpha = watermark.split()[3]

            alpha = alpha.point(
                lambda p: p * (WATERMARK_OPACITY / 255.0)
            )

            watermark.putalpha(alpha)

            return watermark

        except Exception as e:
            logger.error(f"Failed to load watermark: {str(e)}")
            return None

    def process_image(
        self,
        input_stream,
        output_stream,
        filename: str,
        options: dict = None
    ) -> Tuple[
        bool,
        Optional[Tuple[int, int]],
        Optional[Tuple[int, int]]
    ]:

        if options is None:
            options = {}

        try:
            suffix = Path(filename).suffix.lower()

            with Image.open(input_stream) as img:

                original_size = img.size

                # Handle transparency when saving JPEG
                if img.mode in ("RGBA", "LA", "P") and suffix in (
                    ".jpg",
                    ".jpeg"
                ):
                    background = Image.new(
                        "RGB",
                        img.size,
                        (255, 255, 255)
                    )

                    if img.mode == "P":
                        img = img.convert("RGBA")

                    if "A" in img.mode:
                        background.paste(
                            img,
                            mask=img.split()[3]
                        )
                    else:
                        background.paste(img)

                    img = background

                elif img.mode != "RGBA" and suffix == ".png":
                    img = img.convert("RGBA")

                # Grayscale
                if options.get("apply_grayscale", False):

                    img = img.convert("L")

                    if suffix == ".png":
                        img = img.convert("RGBA")
                    else:
                        img = img.convert("RGB")

                    logger.info("Grayscale applied")

                # Resize
                if options.get("resize", True):

                    resized_img = self._resize_image(img)

                    new_size = resized_img.size

                    logger.info("Image resized")

                else:

                    resized_img = img
                    new_size = img.size

                # Watermark
                if self.watermark_image:

                    final_img = self._add_watermark(
                        resized_img
                    )

                    logger.info("Watermark added")

                else:

                    final_img = resized_img

                # Output format
                target_format = options.get(
                    "format",
                    "original"
                ).lower()

                if target_format == "png":

                    save_format = "PNG"

                elif target_format in ("jpg", "jpeg"):

                    save_format = "JPEG"

                    if final_img.mode == "RGBA":

                        bg = Image.new(
                            "RGB",
                            final_img.size,
                            (255, 255, 255)
                        )

                        bg.paste(
                            final_img,
                            mask=final_img.split()[3]
                        )

                        final_img = bg

                else:

                    save_format = (
                        "JPEG"
                        if suffix in (".jpg", ".jpeg")
                        else "PNG"
                    )

                quality = options.get("quality", 95)

                # Save
                if save_format == "PNG":
                    final_img.save(
                        output_stream,
                        format=save_format
                    )
                else:
                    final_img.save(
                        output_stream,
                        format=save_format,
                        quality=quality
                    )

                logger.info("Image saved to stream")

                return (
                    True,
                    original_size,
                    new_size
                )

        except Exception as e:

            logger.error(
                f"Failed to process {filename}"
            )

            logger.error(str(e))

            return (
                False,
                None,
                None
            )

    def _resize_image(
        self,
        img: Image.Image
    ) -> Image.Image:

        bg_color = (
            (0, 0, 0, 0)
            if img.mode == "RGBA"
            else (255, 255, 255)
        )

        canvas = Image.new(
            img.mode,
            (MAX_WIDTH, MAX_HEIGHT),
            bg_color
        )

        img_copy = img.copy()

        img_copy.thumbnail(
            (MAX_WIDTH, MAX_HEIGHT),
            Image.Resampling.LANCZOS
        )

        x = (
            MAX_WIDTH - img_copy.width
        ) // 2

        y = (
            MAX_HEIGHT - img_copy.height
        ) // 2

        if img_copy.mode == "RGBA":

            canvas.paste(
                img_copy,
                (x, y),
                img_copy
            )

        else:

            canvas.paste(
                img_copy,
                (x, y)
            )

        return canvas

    def _add_watermark(
        self,
        img: Image.Image
    ) -> Image.Image:

        original_mode = img.mode

        if img.mode != "RGBA":
            img = img.convert("RGBA")

        watermark_layer = Image.new(
            "RGBA",
            img.size,
            (0, 0, 0, 0)
        )

        wm = self.watermark_image

        if (
            wm.width > img.width
            or wm.height > img.height
        ):

            wm_copy = wm.copy()

            max_wm_width = max(
                1,
                img.width - (
                    WATERMARK_PADDING * 2
                )
            )

            max_wm_height = max(
                1,
                img.height - (
                    WATERMARK_PADDING * 2
                )
            )

            wm_copy.thumbnail(
                (
                    max_wm_width,
                    max_wm_height
                ),
                Image.Resampling.LANCZOS
            )

            wm_to_paste = wm_copy

        else:

            wm_to_paste = wm

        x = (
            img.width
            - wm_to_paste.width
            - WATERMARK_PADDING
        )

        y = (
            img.height
            - wm_to_paste.height
            - WATERMARK_PADDING
        )

        x = max(0, x)
        y = max(0, y)

        watermark_layer.paste(
            wm_to_paste,
            (x, y)
        )

        combined = Image.alpha_composite(
            img,
            watermark_layer
        )

        if original_mode != "RGBA":
            combined = combined.convert(
                original_mode
            )

        return combined