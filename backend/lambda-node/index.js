const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { processImage } = require('./imageProcessor');

const s3 = new S3Client({});

const S3_PREFIX_ORIGINAL = "original/";
const S3_PREFIX_PROCESSED = "processed/";

/**
 * Helper to get the stream into a buffer
 */
const streamToBuffer = async (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.once('end', () => resolve(Buffer.concat(chunks)));
        stream.once('error', reject);
    });
};

exports.handler = async (event, context) => {
    console.log("Lambda execution started");
    
    try {
        for (const record of event.Records) {
            const bucket = record.s3.bucket.name;
            const originalKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
            
            // Only process objects in original/
            if (!originalKey.startsWith(S3_PREFIX_ORIGINAL)) {
                console.log(`Skipping ${originalKey} - not in original folder`);
                continue;
            }

            console.log(`Processing object: s3://${bucket}/${originalKey}`);
            
            // 1. Get original image from S3
            const getObjCommand = new GetObjectCommand({
                Bucket: bucket,
                Key: originalKey
            });
            const getObjResponse = await s3.send(getObjCommand);
            const originalBuffer = await streamToBuffer(getObjResponse.Body);
            
            // In a real flow, metadata is passed from API Gateway -> S3 Object Metadata.
            // Using default options if not present for prototyping.
            const meta = getObjResponse.Metadata || {};
            const options = {
                resize: meta.resize ? meta.resize.toLowerCase() === 'true' : true,
                grayscale: meta.grayscale ? meta.grayscale.toLowerCase() === 'true' : false,
                quality: meta.quality ? parseInt(meta.quality) : 95,
                format: meta.format || 'original'
            };
            
            // 2. Process image using Sharp
            const processedBuffer = await processImage(originalBuffer, options);
            
            // 3. Determine output key and content type
            const filenameRaw = originalKey.replace(S3_PREFIX_ORIGINAL, '');
            let extension = filenameRaw.split('.').pop().toLowerCase();
            const basename = filenameRaw.substring(0, filenameRaw.lastIndexOf('.'));
            
            let targetFormat = options.format.toLowerCase();
            if (targetFormat === 'original') targetFormat = (extension === 'png') ? 'png' : 'jpeg';
            
            const finalFilename = targetFormat === 'png' ? `${basename}.png` : `${basename}.jpg`;
            const contentType = targetFormat === 'png' ? 'image/png' : 'image/jpeg';
            const processedKey = `${S3_PREFIX_PROCESSED}${finalFilename}`;
            
            // 4. Upload to S3 processed/ folder
            const putObjCommand = new PutObjectCommand({
                Bucket: bucket,
                Key: processedKey,
                Body: processedBuffer,
                ContentType: contentType
            });
            await s3.send(putObjCommand);
            
            // 5. Log Metadata
            console.log(JSON.stringify({
                message: "Image processed successfully",
                originalKey: originalKey,
                processedKey: processedKey,
                originalSize: originalBuffer.length,
                processedSize: processedBuffer.length,
                operations: options
            }, null, 2));
        }
        
        return { statusCode: 200, body: 'Success' };
        
    } catch (error) {
        console.error("Error processing record:", error);
        throw error; // Will trigger Lambda retry mechanism
    }
};
