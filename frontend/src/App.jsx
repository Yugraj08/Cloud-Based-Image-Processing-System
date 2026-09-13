import React, { useState, useRef } from 'react';
import { processImageAPI } from './services/apiService';
import './index.css';

function App() {
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [processedName, setProcessedName] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // Processing Options
  const [resize, setResize] = useState(true);
  const [grayscale, setGrayscale] = useState(false);
  const [quality, setQuality] = useState(95);
  const [format, setFormat] = useState('original');

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setProcessedUrl(null);
      setError(null);
      
      // Load image to get dimensions
      const img = new Image();
      img.onload = () => {
        setMetadata({
          name: selectedFile.name,
          size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
          dimensions: `${img.width} x ${img.height}`
        });
      };
      img.src = url;
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    
    try {
      const options = { resize, grayscale, quality, format };
      const { blob, filename } = await processImageAPI(file, options);
      
      const url = URL.createObjectURL(blob);
      setProcessedUrl(url);
      setProcessedName(filename);
      setIsProcessing(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to process image');
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setMetadata(null);
    setPreviewUrl(null);
    setProcessedUrl(null);
    setError(null);
    setResize(true);
    setGrayscale(false);
    setQuality(95);
    setFormat('original');
  };

  return (
    <div className="glass-panel">
      <h1>Cloud Image Processor</h1>
      <p className="subtitle">Local Prototype Environment (AWS Setup Pending)</p>
      
      {!file ? (
        <div className="upload-zone" onClick={handleUploadClick}>
          <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <h3>Drag and drop or click to upload</h3>
          <p>Supports .JPG, .JPEG, .PNG</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".jpg,.jpeg,.png" 
            style={{ display: 'none' }} 
          />
        </div>
      ) : (
        <>
          <div className="preview-grid">
            <div className="preview-card">
              <h3>Original Image</h3>
              <div className="image-container">
                <img src={previewUrl} alt="Original preview" />
              </div>
              {metadata && (
                <div className="metadata">
                  {metadata.name} <br/>
                  {metadata.dimensions} • {metadata.size}
                </div>
              )}
            </div>
            
            <div className="preview-card">
              <h3>Processed Image</h3>
              <div className="image-container">
                {isProcessing ? (
                  <div className="loader"></div>
                ) : processedUrl ? (
                  <img src={processedUrl} alt="Processed output" />
                ) : error ? (
                  <p style={{ color: 'var(--error)' }}>{error}</p>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>Ready for processing</p>
                )}
              </div>
            </div>
          </div>
          
          {!processedUrl && !isProcessing && (
            <div className="controls-panel">
              <div className="control-group">
                <label>Maintain 800x800 Aspect Ratio Constraint</label>
                <label className="switch">
                  <input type="checkbox" checked={resize} onChange={(e) => setResize(e.target.checked)} />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="control-group">
                <label>Apply Grayscale Filter</label>
                <label className="switch">
                  <input type="checkbox" checked={grayscale} onChange={(e) => setGrayscale(e.target.checked)} />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="control-group">
                <label>Compression Quality ({quality}%)</label>
                <input 
                  type="range" 
                  min="10" max="100" 
                  value={quality} 
                  onChange={(e) => setQuality(e.target.value)} 
                />
              </div>
              <div className="control-group">
                <label>Output Format</label>
                <select value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option value="original">Keep Original</option>
                  <option value="png">PNG</option>
                  <option value="jpg">JPG (JPEG)</option>
                </select>
              </div>
            </div>
          )}

          <div className="actions">
            <button className="button" onClick={resetAll} style={{ background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)' }}>
              Start Over
            </button>
            
            {!processedUrl && (
              <button className="button" onClick={handleProcess} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Process Image Local'}
              </button>
            )}
            
            {processedUrl && (
              <a href={processedUrl} download={processedName || 'processed_image'} className="button" style={{ background: 'var(--success)', textDecoration: 'none' }}>
                Download Result
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
