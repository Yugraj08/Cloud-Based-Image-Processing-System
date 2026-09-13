const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Uploads an image and its processing options to the backend API via the Job Polling Architecture.
 * 
 * Flow:
 * 1. POST /jobs to get S3 Presigned Upload URL and Job ID.
 * 2. PUT image directly to S3 URL.
 * 3. Poll GET /jobs/{jobId} until status is 'completed'.
 * 4. Fetch the processed image blob from the returned downloadUrl.
 * 
 * @param {File} file - The original image file
 * @param {Object} options - Processing options (resize, grayscale, quality, format)
 * @returns {Promise<Object>} The processed image blob and filename
 */
export const processImageAPI = async (file, options) => {
  
  // Step 1: Request Upload URL and Job ID
  const jobOptions = {
    filename: file.name,
    resize: options.resize,
    grayscale: options.grayscale,
    quality: options.quality,
    format: options.format
  };

  const jobRes = await fetch(`${API_BASE_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jobOptions)
  });

  if (!jobRes.ok) throw new Error("Failed to initialize job");
  const jobData = await jobRes.json();
  const { jobId, uploadUrl } = jobData.data;

  // Step 2: Upload directly to S3 (or mock S3)
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: file
  });

  if (!uploadRes.ok) throw new Error("Failed to upload image to S3");

  // Step 3: Poll for completion
  return new Promise((resolve, reject) => {
    const poll = setInterval(async () => {
      try {
        const statusRes = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
        const statusData = await statusRes.json();

        if (statusData.data.status === 'completed') {
          clearInterval(poll);
          
          // Step 4: Download processed image
          const downloadRes = await fetch(statusData.data.downloadUrl);
          const blob = await downloadRes.blob();
          
          resolve({
            blob,
            filename: statusData.data.filename
          });
        } else if (statusData.data.status === 'failed') {
          clearInterval(poll);
          reject(new Error("Image processing failed"));
        }
      } catch (err) {
        clearInterval(poll);
        reject(err);
      }
    }, 2000); // Poll every 2 seconds
  });
};
