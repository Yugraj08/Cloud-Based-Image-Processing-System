const sharp = require('sharp');

/**
 * Modular Image Processor using Sharp
 * Mirrors the logic defined in the Python prototype for Phase 1-3.
 */

const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;

/**
 * Resizes the image to fit within 800x800 bounds without distorting aspect ratio.
 * Background will be transparent for PNG, white for JPEG.
 * @param {sharp.Sharp} image 
 * @param {string} targetFormat 
 * @returns {sharp.Sharp}
 */
const applyResize = (image, targetFormat) => {
    // Sharp's `fit: contain` handles padding to the exact bounding box
    const bg = targetFormat === 'png' ? { r: 0, g: 0, b: 0, alpha: 0 } : { r: 255, g: 255, b: 255, alpha: 1 };
    
    return image.resize({
        width: MAX_WIDTH,
        height: MAX_HEIGHT,
        fit: sharp.fit.contain,
        background: bg
    });
};

/**
 * Applies grayscale filter.
 * @param {sharp.Sharp} image 
 * @returns {sharp.Sharp}
 */
const applyGrayscale = (image) => {
    return image.grayscale();
};

/**
 * Formats and applies compression quality.
 * @param {sharp.Sharp} image 
 * @param {string} format ('png', 'jpeg', etc)
 * @param {number} quality (10-100)
 * @returns {sharp.Sharp}
 */
const applyFormat = (image, format, quality) => {
    if (format === 'png') {
        // PNG is lossless but we can set compression level (0-9)
        return image.png({ compressionLevel: 9 });
    } else {
        return image.jpeg({ quality: quality });
    }
};

/**
 * Main process pipeline.
 * @param {Buffer} inputBuffer 
 * @param {Object} options 
 * @returns {Promise<Buffer>}
 */
const processImage = async (inputBuffer, options) => {
    let image = sharp(inputBuffer);
    const metadata = await image.metadata();
    
    const targetFormat = options.format === 'original' 
        ? (metadata.format === 'png' ? 'png' : 'jpeg') 
        : (options.format === 'png' ? 'png' : 'jpeg');

    if (options.grayscale) {
        image = applyGrayscale(image);
    }

    if (options.resize) {
        image = applyResize(image, targetFormat);
    }

    image = applyFormat(image, targetFormat, options.quality);
    
    return await image.toBuffer();
};

module.exports = {
    processImage
};
