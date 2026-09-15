# ☁️ Cloud Image Processor

> **Powerful image processing, powered by AWS serverless infrastructure.**

![Build Status](https://img.shields.io/badge/build-passing-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![AWS](https://img.shields.io/badge/AWS-Serverless-FF9900) ![React](https://img.shields.io/badge/React-Frontend-61DAFB)

<br/>
<div align="center">
  <img src="./frontend/Screenshot/Screenshot%202026-09-13%20213219.png" alt="Cloud Image Processor Screenshot 1" width="800"/>
  <br/>
  <br/>
  
</div>
<br/>

## 📖 Overview

The **Cloud Image Processor** is a premium, production-ready web application that allows users to effortlessly upload, resize, watermark, and format images entirely in the cloud. 

By leveraging an event-driven AWS serverless pipeline, this application eliminates the need for managing traditional backend servers while providing infinite scalability, secure storage, and lightning-fast image manipulation. It serves as a polished demonstration of modern cloud architecture paired with a sophisticated, glassmorphic UI.

---

## ✨ Key Features

- **Intuitive Drag-and-Drop Interface**: Seamlessly upload images through a highly polished, responsive drag-and-drop workspace.
- **Serverless Image Manipulation**: Process images with Python's Pillow library running inside scalable AWS Lambda functions.
- **Dynamic Resizing & Watermarking**: Effortlessly resize images (maintaining aspect ratios) and apply custom watermarks directly from the UI.
- **Real-Time Visual Pipeline**: Watch exactly what the cloud backend is doing in real-time through an interactive status pipeline.
- **Secure File Handling**: Employs AWS S3 presigned URLs for secure, direct-to-cloud uploads, bypassing API bottlenecks.
- **Zero Server Management**: The entire backend is built on AWS Lambda, API Gateway, and S3, ensuring you only pay for compute time actually used.

---

## 🏗️ System Architecture

 <img src="./frontend/Screenshot/Screenshot%202026-09-15%20165450.png" alt="Cloud Image Processor Screenshot 2" width="800"/>

The application relies on a decoupled, asynchronous job polling architecture:

1. **Initialization**: The React frontend sends a `POST` request to an AWS API Gateway endpoint.
2. **Presigned URL Generation**: A Lambda function generates a secure Amazon S3 presigned URL and returns a unique `Job ID` to the frontend.
3. **Secure Upload**: The frontend uploads the original image directly to the S3 input bucket using the presigned URL.
4. **Event-Driven Processing**: The S3 upload triggers an asynchronous AWS Lambda function which grabs the image, applies the requested manipulations (resize, watermark, format), and saves the result to an S3 output bucket.
5. **Job Polling**: Meanwhile, the frontend repeatedly polls a status endpoint using the `Job ID` until the status changes from `processing` to `completed`.
6. **Result Delivery**: Once completed, the API returns a secure download URL to the frontend, which renders the processed image for comparison and download.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 / Vite
- **Styling**: Vanilla CSS with a custom Glassmorphic dark theme (Slate Gray, Gold, Beige)
- **Iconography**: Lucide React
- **Hosting**: Local Dev Server (Production deployment via AWS CloudFront / S3 optional)

### Backend / Infrastructure
- **Cloud Provider**: Amazon Web Services (AWS)
- **Compute**: AWS Lambda (3 distinct functions)
- **Storage**: Amazon S3 (Input and Output buckets)
- **API Management**: Amazon API Gateway
- **Language**: Python 3.12
- **Image Processing**: Pillow (PIL)

---

## 🚀 Getting Started

Follow these steps to run the frontend interface locally.

### 1. Clone the repository
```bash
git clone https://github.com/Yugraj08/Cloud-Based-Image-Processing-System.git
cd Cloud-Based-Image-Processing-System/frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root of the `frontend` directory and add your AWS API Gateway endpoint:
```env
VITE_API_BASE_URL=https://<your-api-id>.execute-api.<region>.amazonaws.com
```

### 4. Run the Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

> **Note**: This assumes your AWS backend infrastructure (Lambda, S3, API Gateway) is already deployed and active.

---

## 💻 Usage

1. **Open the Dashboard**: Visit the application in your browser.
2. **Upload**: Drag and drop a supported image (JPG, JPEG, PNG) into the upload zone.
3. **Configure Options**: Use the inline control panel to select your target dimensions, toggle the watermark, and choose the output format.
4. **Process**: Click **Process Image**. The UI will display a real-time visual pipeline as your image travels through the AWS ecosystem.
5. **Review & Download**: Compare the original and processed images side-by-side, then click the download button to save the optimized result.

---

## 🔮 Future Enhancements

- **Batch Processing**: Allow users to drag-and-drop multiple files simultaneously for bulk cloud processing.
- **Custom Watermarks**: Allow users to upload their own transparent PNG logos to be used as the watermark.
- **User Authentication**: Integrate Amazon Cognito to support private user profiles and history.
