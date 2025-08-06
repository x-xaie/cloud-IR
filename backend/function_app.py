import azure.functions as func
import datetime
import json
import logging
import uuid
import os
import time
from azure.storage.blob import BlobServiceClient
from azure.identity import DefaultAzureCredential
from msrest.authentication import CognitiveServicesCredentials
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import OperationStatusCodes, VisualFeatureTypes
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

# Initialize Computer Vision client
def get_computer_vision_client():
    """Initialize Azure Computer Vision client"""
    endpoint = os.environ.get("COMPUTER_VISION_ENDPOINT")
    key = os.environ.get("COMPUTER_VISION_KEY")
    
    if not endpoint or not key:
        raise Exception("COMPUTER_VISION_ENDPOINT and COMPUTER_VISION_KEY environment variables required")
    
    credentials = CognitiveServicesCredentials(key)
    return ComputerVisionClient(endpoint, credentials)


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

@app.route(route="images/{imageId}/analyze", auth_level=func.AuthLevel.ANONYMOUS, methods=["POST"])
def analyze_image(req: func.HttpRequest) -> func.HttpResponse:
    """
    Analyze image endpoint
    Takes an imageId and analyzes the corresponding blob
    Returns comprehensive analysis results
    """
    logging.info('Image analysis endpoint called')
    
    try:
        # Get imageId from route
        image_id = req.route_params.get('imageId')
        if not image_id:
            return func.HttpResponse(
                json.dumps({
                    "success": False,
                    "error": "Image ID is required in URL path",
                    "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
                }),
                status_code=400,
                mimetype="application/json"
            )
        
        # Find the blob with this imageId        
        blob_service_client = get_blob_service_client()
        container_client = blob_service_client.get_container_client("images-upload")
        
        # Debug: Log all blobs and their metadata
        logging.info(f"Looking for image_id: {image_id}")
        blob_count = 0
        target_blob = None
        
        for blob in container_client.list_blobs(include=['metadata']):
            blob_count += 1
            logging.info(f"Blob {blob_count}: {blob.name}")
            if blob.metadata:
                logging.info(f"  Metadata: {blob.metadata}")
                if blob.metadata.get('image_id') == image_id:
                    target_blob = blob
                    logging.info(f"  ✅ MATCH FOUND!")
                    break
            else:
                logging.info(f"  No metadata found")
        
        logging.info(f"Total blobs found: {blob_count}")
        
        if not target_blob:
            return func.HttpResponse(
                json.dumps({
                    "success": False,
                    "error": f"Image with ID {image_id} not found. Searched {blob_count} blobs.",
                    "debug": f"Looking for image_id: {image_id}",
                    "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
                }),
                status_code=404,
                mimetype="application/json"
            )
        
        # Get blob URL for Computer Vision API
        blob_client = blob_service_client.get_blob_client(
            container="images-upload", 
            blob=target_blob.name
        )
        blob_url = blob_client.url
        
        # Initialize Computer Vision client
        cv_client = get_computer_vision_client()
        
        # Perform comprehensive analysis
        logging.info(f"Analyzing image: {blob_url}")
        
        # Visual features to extract
        visual_features = [
            VisualFeatureTypes.categories,
            VisualFeatureTypes.description,
            VisualFeatureTypes.faces,
            VisualFeatureTypes.objects,
            VisualFeatureTypes.tags,
            VisualFeatureTypes.adult,
            VisualFeatureTypes.color,
            VisualFeatureTypes.image_type
        ]
        
        # Call Computer Vision API
        analysis_result = cv_client.analyze_image(blob_url, visual_features=visual_features)
        
        # Extract objects
        objects = []
        if analysis_result.objects:
            for obj in analysis_result.objects:
                objects.append({
                    "name": obj.object_property,
                    "confidence": round(obj.confidence, 4),
                    "rectangle": {
                        "x": obj.rectangle.x,
                        "y": obj.rectangle.y,
                        "w": obj.rectangle.w,
                        "h": obj.rectangle.h
                    }
                })
        
        # Extract faces
        faces = []
        if analysis_result.faces:
            for face in analysis_result.faces:
                faces.append({
                    "age": face.age,
                    "gender": face.gender.value if face.gender else None,
                    "rectangle": {
                        "left": face.face_rectangle.left,
                        "top": face.face_rectangle.top,
                        "width": face.face_rectangle.width,
                        "height": face.face_rectangle.height
                    }
                })
        
        # Extract descriptions
        descriptions = []
        if analysis_result.description and analysis_result.description.captions:
            for caption in analysis_result.description.captions:
                descriptions.append({
                    "text": caption.text,
                    "confidence": round(caption.confidence, 4)
                })
        
        # Extract tags
        tags = []
        if analysis_result.tags:
            for tag in analysis_result.tags:
                tags.append({
                    "name": tag.name,
                    "confidence": round(tag.confidence, 4)
                })
        
        # Extract categories
        categories = []
        if analysis_result.categories:
            for category in analysis_result.categories:
                categories.append({
                    "name": category.name,
                    "score": round(category.score, 4)
                })
        
        # Perform OCR for text extraction
        ocr_result = None
        try:
            read_operation = cv_client.read(blob_url, raw=True)
            operation_id = read_operation.headers["Operation-Location"].split("/")[-1]
            
            # Wait for OCR to complete
            max_attempts = 10
            for attempt in range(max_attempts):
                read_result = cv_client.get_read_result(operation_id)
                if read_result.status == OperationStatusCodes.succeeded:
                    break
                elif read_result.status == OperationStatusCodes.failed:
                    logging.warning("OCR operation failed")
                    break
                time.sleep(1)
            
            # Extract text if successful
            if read_result.status == OperationStatusCodes.succeeded:
                extracted_text = []
                for page in read_result.analyze_result.read_results:
                    for line in page.lines:
                        extracted_text.append({
                            "text": line.text,
                            "bounding_box": line.bounding_box
                        })
                
                ocr_result = {
                    "text_detected": len(extracted_text) > 0,
                    "total_lines": len(extracted_text),
                    "extracted_text": extracted_text[:20]  # Limit to first 20 lines
                }
        
        except Exception as ocr_error:
            logging.warning(f"OCR failed: {str(ocr_error)}")
            ocr_result = {
                "text_detected": False,
                "error": str(ocr_error)
            }
        
        # Compile comprehensive analysis results
        analysis_data = {
            "imageId": image_id,
            "blobName": target_blob.name,
            "analysis": {
                "objects": objects,
                "faces": faces,
                "descriptions": descriptions,
                "tags": tags,
                "categories": categories,
                "text": ocr_result,
                "metadata": {
                    "dominant_colors": list(analysis_result.color.dominant_colors) if analysis_result.color else [],
                    "accent_color": analysis_result.color.accent_color if analysis_result.color else None,
                    "is_bw_image": analysis_result.color.is_bw_img if analysis_result.color else False,
                    "adult_content": {
                        "is_adult": analysis_result.adult.is_adult_content if analysis_result.adult else False,
                        "adult_score": round(analysis_result.adult.adult_score, 4) if analysis_result.adult else 0,
                        "is_racy": analysis_result.adult.is_racy_content if analysis_result.adult else False,
                        "racy_score": round(analysis_result.adult.racy_score, 4) if analysis_result.adult else 0
                    }
                }
            },
            "analysis_timestamp": datetime.datetime.utcnow().isoformat() + "Z"
        }
        
        logging.info(f"Analysis completed for image {image_id}")
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "message": "Image analysis completed successfully",
                **analysis_data
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"Analysis function error: {str(e)}")
        return func.HttpResponse(
            json.dumps({
                "success": False,
                "error": f"Analysis error: {str(e)}",
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
            }),
            status_code=500,
            mimetype="application/json"
        )