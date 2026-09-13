import io
import os
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from image_processor import ImageProcessor
from logger import logger

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

processor = ImageProcessor()

import uuid
import time
import threading

# Simple in-memory store for local testing of jobs
local_jobs = {}

@app.route('/jobs', methods=['POST'])
def create_job():
    """ Mock endpoint for API Gateway POST /jobs """
    data = request.json or {}
    job_id = f"{uuid.uuid4()}.jpg"
    
    # Store options to be used when uploaded
    local_jobs[job_id] = {
        'status': 'pending',
        'options': data
    }
    
    return jsonify({
        'success': True,
        'data': {
            'jobId': job_id,
            'uploadUrl': f"http://localhost:5000/mock-s3-upload/{job_id}"
        }
    })

@app.route('/mock-s3-upload/<job_id>', methods=['PUT'])
def mock_s3_upload(job_id):
    """ Mock S3 upload endpoint. Processes image asynchronously locally """
    if job_id not in local_jobs:
        return jsonify({'error': 'Job not found'}), 404
        
    file_bytes = request.data
    options = local_jobs[job_id]['options']
    local_jobs[job_id]['status'] = 'processing'
    
    # Run processing asynchronously to mimic S3 trigger
    def process_task():
        try:
            # Simulate latency
            time.sleep(2)
            input_stream = io.BytesIO(file_bytes)
            output_stream = io.BytesIO()
            
            success, _, _ = processor.process_image(
                input_stream, 
                output_stream, 
                filename=job_id,
                options=options
            )
            if success:
                output_stream.seek(0)
                local_jobs[job_id]['status'] = 'completed'
                local_jobs[job_id]['result'] = output_stream.read()
                
                target_format = options.get('format', 'original').lower()
                if target_format == 'png':
                    local_jobs[job_id]['filename'] = f"processed_{job_id.replace('.jpg', '.png')}"
                    local_jobs[job_id]['mimetype'] = 'image/png'
                else:
                    local_jobs[job_id]['filename'] = f"processed_{job_id}"
                    local_jobs[job_id]['mimetype'] = 'image/jpeg'
            else:
                local_jobs[job_id]['status'] = 'failed'
        except Exception as e:
            logger.error(f"Local async processing error: {str(e)}")
            local_jobs[job_id]['status'] = 'failed'
            
    threading.Thread(target=process_task).start()
    return jsonify({'message': 'Successfully uploaded to mock S3'})

@app.route('/jobs/<job_id>', methods=['GET'])
def get_job_status(job_id):
    """ Mock endpoint for API Gateway GET /jobs/{id} """
    if job_id not in local_jobs:
        return jsonify({'success': False, 'message': 'Job not found'}), 404
        
    job = local_jobs[job_id]
    if job['status'] == 'completed':
        return jsonify({
            'success': True,
            'data': {
                'status': 'completed',
                'downloadUrl': f"http://localhost:5000/mock-download/{job_id}",
                'filename': job['filename']
            }
        })
    else:
        return jsonify({
            'success': True,
            'data': {
                'status': job['status']
            }
        })

@app.route('/mock-download/<job_id>', methods=['GET'])
def mock_download(job_id):
    if job_id not in local_jobs or 'result' not in local_jobs[job_id]:
        return "Not found", 404
        
    job = local_jobs[job_id]
    return send_file(
        io.BytesIO(job['result']),
        mimetype=job['mimetype'],
        as_attachment=True,
        download_name=job['filename']
    )

if __name__ == '__main__':
    print("Starting Local Mock API Server on port 5000...")
    app.run(debug=True, port=5000)
