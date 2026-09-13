# Automated Cloud Image Processing Pipeline (Local Prototype)

## Project Overview
This project is a production-quality backend prototype designed to automatically process images from an input folder. It demonstrates complete business logic by automatically resizing images (maintaining their aspect ratio), applying a semi-transparent watermark to the bottom right corner, and storing the processed images in an output folder. It handles exceptions gracefully, logs execution details comprehensively, and provides a polished terminal output. 

This prototype is built with a clean, decoupled architecture in Python so that it can easily be migrated to the cloud (AWS).

## Features
- **Automatic Scanning**: Seamlessly scans the `input/` folder for supported images.
- **Batch Processing**: Processes multiple images and skips unsupported files gracefully.
- **Smart Resizing**: Enforces maximum dimensions (800x800) while strictly maintaining the aspect ratio (no stretching).
- **Watermarking**: Applies a semi-transparent watermark to the bottom-right corner, dynamically adapting scale and padding.
- **Graceful Failure**: If one image fails processing, the application continues with the rest of the batch.
- **Terminal Summary**: Outputs a beautifully formatted summary table in the terminal displaying success/failure stats and execution time.
- **Centralized Logging**: Stores application logs centrally at `logs/application.log`.
- **Cloud-Ready**: Configuration is centralized and logic is decoupled to make shifting to an event-driven cloud architecture trivial.

## Folder Structure
```text
Automated-Cloud-Image-Processing/
│
├── input/                  # Place original images here
│
├── output/                 # Processed images are saved here
│
├── assets/                 # Contains watermark.png
│
├── logs/                   # Contains application.log
│
├── config.py               # Centralized configuration variables
│
├── image_processor.py      # Core business logic (ImageProcessor class)
│
├── logger.py               # Logging configuration
│
├── main.py                 # Application runner and terminal output logic
│
├── requirements.txt        # Python dependencies
│
├── README.md               # Project documentation
│
└── .gitignore              # Git ignore file
```

## Installation
1. Ensure you have Python 3.12+ installed.
2. Clone this repository and navigate to the project directory.
3. Install the required dependencies using pip:
   ```bash
   pip install -r requirements.txt
   ```

## How to Run
1. Place your `.jpg`, `.jpeg`, or `.png` images into the `input/` folder.
2. Ensure you have a `watermark.png` inside the `assets/` folder.
3. Run the main script from your terminal:
   ```bash
   python main.py
   ```
4. Find your processed images in the `output/` folder and review the logs in `logs/application.log`.

## Sample Output
```text
-------------------------------------
Found 3 Images

Processing cat.jpg
✓ Success

Processing dog.png
✓ Success

Processing flower.jpg
✓ Success
-------------------------------------
Summary
Images Processed : 3
Skipped          : 0
Failed           : 0
Time Taken       : 0.43 sec
-------------------------------------
```

## Future Scope (AWS Migration)
This project is designed to become a fully **Automated Cloud Image Processing Pipeline**.

Replacing the local filesystem with an AWS architecture requires minimal modifications due to the decoupled `ImageProcessor` class:
- **Amazon S3**: The `input/` and `output/` folders will be replaced by S3 buckets. Instead of reading/writing from local paths, the `ImageProcessor` will accept file streams (via `boto3`) directly from S3.
- **AWS Lambda**: The `main.py` loop will be replaced by an AWS Lambda Handler. S3 will trigger the Lambda function asynchronously whenever a new image is uploaded. The `ImageProcessor` logic will execute exactly as it does locally.
- **IAM**: Proper IAM Roles will be attached to the Lambda function to ensure it has the exact necessary permissions (e.g., `s3:GetObject` on the input bucket and `s3:PutObject` on the output bucket).
- **CloudWatch**: The existing standard python logging built in `logger.py` will automatically pipe into AWS CloudWatch Logs when executed inside Lambda, allowing for seamless cloud observability without altering the logging business logic.
