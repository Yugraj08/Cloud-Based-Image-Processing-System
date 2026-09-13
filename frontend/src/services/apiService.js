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
 * @param {Function} onProgress - Optional callback for pipeline visualization (step string)
 * @returns {Promise<Object>} The processed image blob and filename
 */
export const processImageAPI = async (file, options, onProgress = () => {}) => {
  
  // Step 1: Request Upload URL and Job ID
  onProgress('initializing');
  const jobOptions = {
    filename: file.name,
    resize: options.resize,
    grayscale: options.grayscale,
    watermark: options.watermark,
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

  // Step 2: Upload directly to S3
  onProgress('uploading');
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'application/octet-stream' }
  });

  if (!uploadRes.ok) throw new Error("Failed to upload image to S3");

  // Step 3: Poll for completion
  onProgress('processing');
  return new Promise((resolve, reject) => {
    let pollCount = 0;
    const maxPolls = 60; // 2 mins max
    
    const poll = setInterval(async () => {
      pollCount++;
      if (pollCount > maxPolls) {
        clearInterval(poll);
        reject(new Error("Processing timeout"));
        return;
      }
      
      try {
        const statusRes = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
        const statusData = await statusRes.json();

        if (statusData.data.status === 'completed') {
          clearInterval(poll);
          
          // Step 4: Download processed image
          onProgress('downloading');
          const downloadRes = await fetch(statusData.data.downloadUrl);
          const blob = await downloadRes.blob();
          
          onProgress('completed');
          resolve({
            blob,
            filename: statusData.data.filename,
            downloadUrl: statusData.data.downloadUrl
          });
        } else if (statusData.data.status === 'failed') {
          clearInterval(poll);
          reject(new Error("Image processing failed on AWS"));
        }
      } catch (err) {
        clearInterval(poll);
        reject(err);
      }
    }, 2000); // Poll every 2 seconds
  });
};
