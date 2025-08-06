# 🚀 Image Recognition Service API Documentation

**Version:** 1.0.0  
**Base URL:** `https://func-imagerecognition-centralcanada-prod-hjedbmc9e5gcf6df.canadacentral-01.azurewebsites.net`  
**Last Updated:** August 6, 2025

## 📋 Overview

Cloud-based AI-powered image recognition service built on Azure Functions with Computer Vision API integration. Provides comprehensive image analysis including object detection, face recognition, OCR text extraction, and content categorization.

## 🔑 Authentication

Currently configured for anonymous access. All endpoints are publicly accessible.

## 📝 API Endpoints

### 1. Health Check
**GET** `/api/health`

Monitor service status and availability.

**Response:**
```json
{
  "status": "healthy",
  "service": "Image Recognition Service",
  "timestamp": "2025-08-06T22:20:52Z",
  "version": "1.0.0"
}
```

### 2. Upload Image
**POST** `/api/images/upload`

Upload and validate image files for analysis.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Image file (JPEG, PNG)
- Max Size: 4MB
- Max Dimensions: 4000x4000px

**Response:**
```json
{
  "success": true,
  "imageId": "5fcfc5e4-8d61-4de0-a6c6-ffd77ef6453c",
  "blobName": "20250806_014729_5fcfc5e4-8d61-4de0-a6c6-ffd77ef6453c.jpg",
  "uploadUrl": "https://stimagerecprod001.blob.core.windows.net/...",
  "message": "Image uploaded successfully",
  "metadata": {
    "originalName": "example.jpg",
    "fileSize": 168083,
    "dimensions": "3400x1912",
    "format": "jpeg",
    "uploadTime": "2025-08-06T01:47:29Z"
  }
}
```

### 3. Analyze Image
**POST** `/api/images/{imageId}/analyze`

Perform comprehensive AI analysis on uploaded image.

**Parameters:**
- `imageId` (path): UUID of uploaded image

**Response:**
```json
{
  "success": true,
  "message": "Image analysis completed successfully",
  "saved_to_storage": true,
  "imageId": "5fcfc5e4-8d61-4de0-a6c6-ffd77ef6453c",
  "blobName": "20250806_014729_5fcfc5e4-8d61-4de0-a6c6-ffd77ef6453c.jpg",
  "analysis": {
    "objects": [
      {
        "name": "person",
        "confidence": 0.95,
        "rectangle": { "x": 100, "y": 50, "w": 200, "h": 300 }
      }
    ],
    "faces": [
      {
        "age": 30,
        "gender": "Male",
        "rectangle": { "left": 120, "top": 80, "width": 100, "height": 120 }
      }
    ],
    "descriptions": [
      {
        "text": "A person standing in front of a building",
        "confidence": 0.85
      }
    ],
    "tags": [
      { "name": "person", "confidence": 0.95 },
      { "name": "building", "confidence": 0.82 }
    ],
    "text": {
      "text_detected": true,
      "total_lines": 2,
      "extracted_text": [
        {
          "text": "Welcome Sign",
          "bounding_box": [100, 200, 300, 250, 350, 280, 150, 230]
        }
      ]
    },
    "metadata": {
      "dominant_colors": ["Blue", "White"],
      "accent_color": "4F94CD",
      "is_bw_image": false,
      "adult_content": {
        "is_adult": false,
        "adult_score": 0.0012,
        "is_racy": false,
        "racy_score": 0.0089
      }
    }
  },
  "analysis_timestamp": "2025-08-06T22:20:52Z"
}
```

### 4. Get Cached Results
**GET** `/api/images/{imageId}/results`

Retrieve stored analysis results from Table Storage.

**Parameters:**
- `imageId` (path): UUID of analyzed image

**Response:** Same as analysis endpoint plus caching metadata

### 5. Search Results
**GET** `/api/results/search`

Search and filter analysis results with various criteria.

**Query Parameters:**
- `days_back` (int): Number of days to search (default: 7)
- `max_results` (int): Maximum results to return (default: 50, max: 100)
- `has_faces` (bool): Filter images with faces
- `has_objects` (bool): Filter images with objects
- `has_text` (bool): Filter images with text

**Example:** `/api/results/search?days_back=30&has_faces=true&max_results=20`

**Response:**
```json
{
  "success": true,
  "message": "Found 15 results",
  "query": {
    "days_back": 30,
    "max_results": 20,
    "filters": { "has_faces": true, "has_objects": false, "has_text": false }
  },
  "total_found": 15,
  "results": [
    {
      "imageId": "uuid",
      "blobName": "filename.jpg",
      "status": "completed",
      "uploadTime": "2025-08-06T20:46:16Z",
      "analysisTime": "2025-08-06T22:20:52Z",
      "summary": {
        "objectCount": 3,
        "faceCount": 2,
        "hasText": true,
        "primaryDescription": "A group of people in a park",
        "confidence": 0.89
      }
    }
  ]
}
```

### 6. Get Statistics
**GET** `/api/results/stats`

Retrieve analytics and statistics for processed images.

**Query Parameters:**
- `days_back` (int): Analysis period in days (default: 7)

**Response:**
```json
{
  "success": true,
  "period": {
    "days_back": 7,
    "start_date": "2025-07-30T22:21:22Z",
    "end_date": "2025-08-06T22:21:22Z"
  },
  "summary": {
    "total_images_analyzed": 150,
    "images_with_faces": 45,
    "images_with_objects": 120,
    "images_with_text": 30,
    "total_objects_detected": 450,
    "total_faces_detected": 95,
    "average_confidence": 0.78
  },
  "percentages": {
    "faces": 30.0,
    "objects": 80.0,
    "text": 20.0
  }
}
```

## 🚨 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Descriptive error message",
  "timestamp": "2025-08-06T22:20:52Z"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## 📊 Performance Metrics

- **Average Response Time:** <2 seconds
- **Upload Limit:** 4MB per image
- **Analysis Time:** 3-8 seconds depending on image complexity
- **Storage:** Azure Blob Storage + Table Storage
- **Availability:** 99.9% SLA

## 🔒 Security Features

- Managed Identity authentication
- Input validation and sanitization
- File type and size restrictions
- Content safety analysis
- Secure blob storage with private access
- Application Insights monitoring

## 📚 Usage Examples

### Upload and Analyze Workflow
```bash
# 1. Upload image
curl -X POST -F "image=@photo.jpg" \
  https://func-imagerecognition-centralcanada-prod-hjedbmc9e5gcf6df.canadacentral-01.azurewebsites.net/api/images/upload

# 2. Analyze image (using imageId from upload response)
curl -X POST \
  https://func-imagerecognition-centralcanada-prod-hjedbmc9e5gcf6df.canadacentral-01.azurewebsites.net/api/images/{imageId}/analyze

# 3. Get cached results
curl https://func-imagerecognition-centralcanada-prod-hjedbmc9e5gcf6df.canadacentral-01.azurewebsites.net/api/images/{imageId}/results
```

### Search Examples
```bash
# Find images with faces from last 30 days
curl "https://func-imagerecognition-centralcanada-prod-hjedbmc9e5gcf6df.canadacentral-01.azurewebsites.net/api/results/search?days_back=30&has_faces=true"

# Find images with text
curl "https://func-imagerecognition-centralcanada-prod-hjedbmc9e5gcf6df.canadacentral-01.azurewebsites.net/api/results/search?has_text=true"
```

## 🏗️ Architecture

- **Runtime:** Azure Functions (Python 3.13)
- **AI Service:** Azure Computer Vision API
- **Storage:** Azure Blob Storage + Table Storage
- **Monitoring:** Application Insights
- **Authentication:** Managed Identity
- **Deployment:** Azure Functions Premium Plan