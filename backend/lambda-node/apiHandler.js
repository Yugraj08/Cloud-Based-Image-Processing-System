const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

const s3 = new S3Client({});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "cloud-image-processor-bucket";
const S3_PREFIX_ORIGINAL = "original/";
const S3_PREFIX_PROCESSED = "processed/";

const buildResponse = (statusCode, body) => {
    return {
        statusCode,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    };
};

exports.handler = async (event) => {
    const { httpMethod, path, body, pathParameters } = event;

    try {
        if (httpMethod === 'POST' && path === '/jobs') {
            return await createJob(JSON.parse(body || "{}"));
        }
        
        if (httpMethod === 'GET' && path.startsWith('/jobs/') && pathParameters && pathParameters.id) {
            return await getJobStatus(pathParameters.id);
        }

        return buildResponse(404, { success: false, message: "Route not found" });
        
    } catch (error) {
        console.error("API Error:", error);
        return buildResponse(500, { success: false, message: "Internal server error" });
    }
};

const createJob = async (options) => {
    const jobId = crypto.randomUUID();
    const extension = (options.filename || 'image.jpg').split('.').pop();
    const targetKey = `${jobId}.${extension}`;
    const s3Key = `${S3_PREFIX_ORIGINAL}${targetKey}`;

    // We pass options as S3 metadata so the S3 trigger Lambda can read them
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Metadata: {
            resize: String(options.resize || true),
            grayscale: String(options.grayscale || false),
            quality: String(options.quality || 95),
            format: String(options.format || 'original')
        }
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    return buildResponse(200, {
        success: true,
        data: {
            jobId: targetKey,
            uploadUrl: uploadUrl
        }
    });
};

const getJobStatus = async (jobId) => {
    // The processed lambda saves as original basename with potentially new extension (png/jpg)
    // We check for both possible extensions to see if the job is done.
    const basename = jobId.substring(0, jobId.lastIndexOf('.'));
    
    const possibleKeys = [
        `${S3_PREFIX_PROCESSED}${basename}.png`,
        `${S3_PREFIX_PROCESSED}${basename}.jpg`,
        `${S3_PREFIX_PROCESSED}${jobId}`
    ];

    let foundKey = null;

    for (const key of possibleKeys) {
        try {
            const headCmd = new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key });
            await s3.send(headCmd);
            foundKey = key;
            break;
        } catch (err) {
            if (err.name !== 'NotFound') {
                console.error("HeadObject error:", err);
            }
        }
    }

    if (!foundKey) {
        // Job still processing (or doesn't exist)
        return buildResponse(200, {
            success: true,
            data: {
                status: "processing"
            }
        });
    }

    // Generate download URL
    const getCmd = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: foundKey });
    const downloadUrl = await getSignedUrl(s3, getCmd, { expiresIn: 900 });

    return buildResponse(200, {
        success: true,
        data: {
            status: "completed",
            downloadUrl: downloadUrl,
            filename: foundKey.split('/').pop()
        }
    });
};
