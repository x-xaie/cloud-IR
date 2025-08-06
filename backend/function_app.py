

import azure.functions as func
import datetime
import json
import logging
import uuid
import os
from azure.storage.blob import BlobServiceClient
from azure.identity import DefaultAzureCredential
from PIL import Image
import io

app = func.FunctionApp()

# Initialize blob service client
def get_blob_service_client():
    """Initialize Azure Blob Storage client"""
    connection_string = os.environ.get("STORAGE_CONNECTION_STRING")
    if connection_string:
        return BlobServiceClient.from_connection_string(connection_string)
    else:
        # Fallback to managed identity (for production)
        account_url = "https://stimagerecprod001.blob.core.windows.net"
        credential = DefaultAzureCredential()
        return BlobServiceClient(account_url=account_url, credential=credential)

@app.route(route="health", auth_level=func.AuthLevel.ANONYMOUS)
def health(req: func.HttpRequest) -> func.HttpResponse:
    """
    Health check endpoint for the Image Recognition Service
    Returns JSON with service status and timestamp
    """
    logging.info('Health check endpoint called')
    
    try:
        # Create health response
        health_data = {
            "status": "healthy",
            "service": "Image Recognition Service",
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "version": "1.0.0"
        }
        
        return func.HttpResponse(
            json.dumps(health_data),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"Health check failed: {str(e)}")
        
        error_response = {
            "status": "unhealthy",
            "service": "Image Recognition Service", 
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "error": str(e)
        }
        
        return func.HttpResponse(
            json.dumps(error_response),
            status_code=500,
            mimetype="application/json"
        )

@app.route(route="images/upload", auth_level=func.AuthLevel.ANONYMOUS, methods=["POST"])
def upload_image(req: func.HttpRequest) -> func.HttpResponse:
    """
    Upload image endpoint
    Accepts multipart/form-data with image file
    Validates and stores in Azure Blob Storage
    """
    logging.info('Image upload endpoint called')
    
    try:
        # Check if request has files
        if not hasattr(req, 'files') or not req.files:
            return func.HttpResponse(
                json.dumps({
                    "success": False,
                    "error": "No file provided. Please upload an image file.",
                    "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
                }),
                status_code=400,
                mimetype="application/json"
            )
        
        # Get the uploaded file
        file_data = None
        original_filename = None
        
        # Handle different ways files might be sent
        for field_name in req.files:
            file_data = req.files[field_name]
            original_filename = getattr(file_data, 'filename', 'upload.jpg')
            break
        
        if not file_data:
            return func.HttpResponse(
                json.dumps({
                    "success": False,
                    "error": "No valid file found in request",
                    "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
                }),
                status_code=400,
                mimetype="application/json"
            )
        
        # Read file content
        file_content = file_data.read()
        file_size = len(file_content)
        
        # Validate file size (4MB limit)
        max_size = 4 * 1024 * 1024  # 4MB in bytes
        if file_size > max_size:
            return func.HttpResponse(
                json.dumps({
                    "success": False,
                    "error": f"File too large. Maximum size is 4MB, got {file_size / (1024*1024):.2f}MB",
                    "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
                }),
                status_code=400,
                mimetype="application/json"
            )
        
        # Validate file format using PIL
        try:
            image = Image.open(io.BytesIO(file_content))
            image_format = image.format.lower() if image.format else None
            
            # Check allowed formats
            allowed_formats = ['jpeg', 'jpg', 'png']
            if image_format not in allowed_formats:
                return func.HttpResponse(
                    json.dumps({
                        "success": False,
                        "error": f"Unsupported format '{image_format}'. Allowed: JPEG, PNG",
                        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
                    }),
                    status_code=400,
                    mimetype="application/json"
                )
            
            # Check image dimensions
            width, height = image.size
            max_dimension = 4000
            if width > max_dimension or height > max_dimension:
                return func.HttpResponse(
                    json.dumps({
                        "success": False,
                        "error": f"Image too large. Max dimensions: {max_dimension}x{max_dimension}, got {width}x{height}",
                        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
                    }),
                    status_code=400,
                    mimetype="application/json"
                )
            
        except Exception as img_error:
            return func.HttpResponse(
                json.dumps({
                    "success": False,
                    "error": f"Invalid image file: {str(img_error)}",
                    "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
                }),
                status_code=400,
                mimetype="application/json"
            )
        
        # Generate unique filename
        image_id = str(uuid.uuid4())
        timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        file_extension = image_format if image_format == 'png' else 'jpg'
        blob_name = f"{timestamp}_{image_id}.{file_extension}"
        
        # Upload to Azure Blob Storage
        try:
            blob_service_client = get_blob_service_client()
            container_name = "images-upload"
            
            # Get blob client
            blob_client = blob_service_client.get_blob_client(
                container=container_name, 
                blob=blob_name
            )
            
            # Upload with metadata
            metadata = {
                "image_id": image_id,
                "original_name": original_filename,
                "upload_time": datetime.datetime.utcnow().isoformat() + "Z",
                "file_size": str(file_size),
                "dimensions": f"{width}x{height}",
                "format": image_format
            }
            
            # Reset file pointer and upload
            blob_client.upload_blob(
                file_content, 
                overwrite=True, 
                metadata=metadata,
                content_type=f"image/{image_format}"
            )
            
            # Generate blob URL
            blob_url = blob_client.url
            
            logging.info(f"Successfully uploaded image: {blob_name}")
            
            # Return success response
            response_data = {
                "success": True,
                "imageId": image_id,
                "blobName": blob_name,
                "uploadUrl": blob_url,
                "message": "Image uploaded successfully",
                "metadata": {
                    "originalName": original_filename,
                    "fileSize": file_size,
                    "dimensions": f"{width}x{height}",
                    "format": image_format,
                    "uploadTime": datetime.datetime.utcnow().isoformat() + "Z"
                }
            }
            
            return func.HttpResponse(
                json.dumps(response_data),
                status_code=200,
                mimetype="application/json"
            )
            
        except Exception as storage_error:
            logging.error(f"Blob storage error: {str(storage_error)}")
            return func.HttpResponse(
                json.dumps({
                    "success": False,
                    "error": f"Storage error: {str(storage_error)}",
                    "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
                }),
                status_code=500,
                mimetype="application/json"
            )
            
    except Exception as e:
        logging.error(f"Upload function error: {str(e)}")
        return func.HttpResponse(
            json.dumps({
                "success": False,
                "error": f"Server error: {str(e)}",
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
            }),
            status_code=500,
            mimetype="application/json"
        )