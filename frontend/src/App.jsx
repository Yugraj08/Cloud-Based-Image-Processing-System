import React, { useState, useRef, useEffect } from 'react';
import { Cloud, UploadCloud, FileImage, ShieldCheck, Zap, Download, RefreshCw, Layers, CheckCircle2, Server, Database, Settings, Droplet, Maximize } from 'lucide-react';
import { processImageAPI } from './services/apiService';
import './index.css';

function App() {
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [processedName, setProcessedName] = useState(null);
  
  // Pipeline state
  const [processState, setProcessState] = useState('idle');
  const [error, setError] = useState(null);
  
  // Processing Options
  const [resize, setResize] = useState('800x800');
  const [watermark, setWatermark] = useState(false);
  const [format, setFormat] = useState('original');

  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (processedUrl && processedUrl.startsWith('blob:')) URL.revokeObjectURL(processedUrl);
    };
  }, [previewUrl, processedUrl]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setProcessedUrl(null);
      setError(null);
      setProcessState('idle');
      
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

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-active');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-active');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-active');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange({ target: { files: [e.dataTransfer.files[0]] } });
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setError(null);
    setProcessState('initializing');
    
    try {
      // the backend currently expects resize as a boolean, but let's pass it anyway or adapt.
      // If the backend expects resize=true, we might need to map it, but we'll pass exactly what's chosen.
      const options = { 
        resize: resize !== 'original', 
        watermark, 
        format,
        quality: 95,
        grayscale: false 
      };
      
      const { blob, filename, downloadUrl } = await processImageAPI(file, options, (step) => {
        setProcessState(step);
      });
      
      const url = blob ? URL.createObjectURL(blob) : downloadUrl;
      
      setProcessedUrl(url);
      setProcessedName(filename);
      setProcessState('completed');
    } catch (err) {
      console.error("Processing Error:", err);
      setError(err.message || 'Failed to process image');
      setProcessState('failed');
    }
  };

  const resetAll = () => {
    setFile(null);
    setMetadata(null);
    setPreviewUrl(null);
    setProcessedUrl(null);
    setError(null);
    setProcessState('idle');
  };

  const isProcessing = ['initializing', 'uploading', 'processing', 'downloading'].includes(processState);

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <nav className="navbar">
        <div className="nav-brand">
          <Cloud className="icon" />
          Cloud Image Processor
        </div>
        <div className="nav-links">
          <a href="#" className="nav-link active">Dashboard</a>
          <a href="#architecture" className="nav-link">Architecture</a>
        </div>
        <div className="nav-status">
          <div className="status-dot"></div>
          AWS Connected
        </div>
      </nav>

      <main className="main-content">
        {/* Hero Section */}
        <section className="hero">
          <h1>Transform Images in the Cloud.</h1>
          <p>Upload an image, process it through a serverless AWS pipeline, and receive your optimized result in seconds.</p>
          <div className="hero-badges">
            <div className="badge"><Zap /> Serverless Processing</div>
            <div className="badge"><ShieldCheck /> Secure S3 Upload</div>
            <div className="badge"><Layers /> 3 Lambda Functions</div>
          </div>
        </section>

        {/* Workspace */}
        <section className="workspace">
          <div className="glass-card">
            {!file ? (
              <>
                <div 
                  className="upload-zone" 
                  onClick={handleUploadClick}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <UploadCloud className="upload-icon" />
                  <h3>Drop your image here</h3>
                  <p>or click to browse</p>
                  <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', letterSpacing: '0.05em' }}>SUPPORTS JPG / JPEG / PNG</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".jpg,.jpeg,.png" 
                    style={{ display: 'none' }} 
                  />
                </div>
                
                {/* Inline Options Panel below drop zone */}
                <div className="inline-options">
                  <div className="control-group">
                    <Maximize size={16} className="icon" style={{ color: 'var(--accent-secondary)' }}/>
                    <span className="control-label">Resize Dimensions</span>
                    <select 
                      className="select-input" 
                      value={resize} 
                      onChange={(e) => setResize(e.target.value)}
                    >
                      <option value="original">Keep Original</option>
                      <option value="800x800">Max 800x800</option>
                      <option value="1024x1024">Max 1024x1024</option>
                    </select>
                  </div>

                  <div className="control-group">
                    <Droplet size={16} className="icon" style={{ color: 'var(--accent-secondary)' }}/>
                    <span className="control-label">Add Watermark</span>
                    <label className="switch">
                      <input type="checkbox" checked={watermark} onChange={(e) => setWatermark(e.target.checked)} />
                      <span className="slider"></span>
                    </label>
                  </div>
                  
                  <div className="control-group">
                    <Settings size={16} className="icon" style={{ color: 'var(--accent-secondary)' }}/>
                    <span className="control-label">Format</span>
                    <select 
                      className="select-input" 
                      value={format} 
                      onChange={(e) => setFormat(e.target.value)}
                    >
                      <option value="original">Auto</option>
                      <option value="png">PNG</option>
                      <option value="jpg">JPG</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <div className="workspace-grid">
                <div className="file-info">
                  <div className="file-details">
                    <FileImage className="icon" size={24} style={{ color: 'var(--accent-primary)' }} />
                    <div>
                      <div className="file-name">{metadata?.name.length > 30 ? metadata?.name.substring(0,30)+'...' : metadata?.name}</div>
                      <div className="file-meta">{metadata?.dimensions} • {metadata?.size}</div>
                    </div>
                  </div>
                  <button className="remove-btn" onClick={resetAll} disabled={isProcessing} title="Remove image">
                    <RefreshCw size={20} />
                  </button>
                </div>

                <div className="workspace-main">
                  {processState === 'completed' && processedUrl ? (
                    <>
                      <div className="result-grid">
                        <div className="result-card">
                          <div className="result-header">
                            <span className="result-title">Original</span>
                          </div>
                          <img src={previewUrl} alt="Original" className="result-image" />
                        </div>
                        
                        <div className="result-card" style={{ borderColor: 'rgba(212, 175, 55, 0.4)' }}>
                          <div className="result-header">
                            <span className="result-title" style={{ color: 'var(--accent-primary)' }}>Processed</span>
                            <span className="result-badge">Lambda Output</span>
                          </div>
                          <img src={processedUrl} alt="Processed" className="result-image" />
                        </div>
                      </div>
                      
                      <div className="action-row">
                        <a href={processedUrl} download={processedName || 'processed_image'} className="btn btn-primary">
                          <Download size={18} /> Download Result
                        </a>
                      </div>
                    </>
                  ) : isProcessing || processState === 'failed' ? (
                    <div className="pipeline-container glass-card">
                      <h3>Cloud Processing Pipeline</h3>
                      
                      <div className={`pipeline-step ${processState !== 'idle' ? 'active' : ''}`}>
                        <div className={`step-icon ${['uploading', 'processing', 'downloading', 'completed'].includes(processState) ? 'completed' : processState === 'initializing' ? 'active' : ''}`}>
                          {['uploading', 'processing', 'downloading', 'completed'].includes(processState) ? <CheckCircle2 size={16} /> : processState === 'initializing' ? <div className="spinner"></div> : <Cloud size={16} />}
                        </div>
                        <div className="step-content">
                          <div className={`step-title ${processState === 'initializing' ? 'active' : ['uploading', 'processing', 'downloading', 'completed'].includes(processState) ? 'completed' : ''}`}>Initialize Job</div>
                          <div className="step-desc">Request secure S3 presigned URL from API Gateway</div>
                        </div>
                      </div>

                      <div className={`pipeline-step ${['uploading', 'processing', 'downloading', 'completed'].includes(processState) ? 'active' : ''}`}>
                        <div className={`step-icon ${['processing', 'downloading', 'completed'].includes(processState) ? 'completed' : processState === 'uploading' ? 'active' : ''}`}>
                          {['processing', 'downloading', 'completed'].includes(processState) ? <CheckCircle2 size={16} /> : processState === 'uploading' ? <div className="spinner"></div> : <UploadCloud size={16} />}
                        </div>
                        <div className="step-content">
                          <div className={`step-title ${processState === 'uploading' ? 'active' : ['processing', 'downloading', 'completed'].includes(processState) ? 'completed' : ''}`}>Secure Upload</div>
                          <div className="step-desc">Transferring image directly to Amazon S3</div>
                        </div>
                      </div>

                      <div className={`pipeline-step ${['processing', 'downloading', 'completed'].includes(processState) ? 'active' : ''}`}>
                        <div className={`step-icon ${['downloading', 'completed'].includes(processState) ? 'completed' : processState === 'processing' ? 'active' : ''}`}>
                          {['downloading', 'completed'].includes(processState) ? <CheckCircle2 size={16} /> : processState === 'processing' ? <div className="spinner"></div> : <Zap size={16} />}
                        </div>
                        <div className="step-content">
                          <div className={`step-title ${processState === 'processing' ? 'active' : ['downloading', 'completed'].includes(processState) ? 'completed' : ''}`}>Lambda Execution</div>
                          <div className="step-desc">Serverless image manipulation via Python Pillow</div>
                        </div>
                      </div>

                      <div className={`pipeline-step ${['downloading', 'completed'].includes(processState) ? 'active' : ''}`}>
                        <div className={`step-icon ${processState === 'completed' ? 'completed' : processState === 'downloading' ? 'active' : ''}`}>
                          {processState === 'completed' ? <CheckCircle2 size={16} /> : processState === 'downloading' ? <div className="spinner"></div> : <Download size={16} />}
                        </div>
                        <div className="step-content">
                          <div className={`step-title ${processState === 'downloading' ? 'active' : processState === 'completed' ? 'completed' : ''}`}>Retrieve Result</div>
                          <div className="step-desc">Downloading optimized asset from output bucket</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="preview-container">
                        <img src={previewUrl} alt="Preview" />
                      </div>
                      
                      <div className="action-row">
                        <button className="btn btn-primary" onClick={handleProcess}>
                          Process Image →
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Error Toast */}
        {error && (
          <div className="toast">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>
              <div style={{ fontWeight: 600 }}>Processing Failed</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{error}</div>
            </div>
          </div>
        )}

        {/* Architecture Section */}
        <section id="architecture" className="architecture-section">
          <div className="section-header">
            <h2 className="serif-font">Cloud Architecture</h2>
            <p>How your image is processed securely at scale</p>
          </div>
          
          <div className="arch-flow">
            <div className="arch-node">
              <div className="arch-icon-wrapper">
                <Server size={32} />
              </div>
              <h4 className="serif-font">API Gateway</h4>
              <p>Routes frontend REST requests securely to serverless Lambda functions.</p>
            </div>
            
            <div className="arch-node">
              <div className="arch-icon-wrapper">
                <Database size={32} />
              </div>
              <h4 className="serif-font">Amazon S3</h4>
              <p>Provides highly durable object storage for original uploads and final processed images.</p>
            </div>
            
            <div className="arch-node">
              <div className="arch-icon-wrapper">
                <Zap size={32} />
              </div>
              <h4 className="serif-font">AWS Lambda</h4>
              <p>Event-driven compute performs heavy image manipulation without provisioning servers.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
