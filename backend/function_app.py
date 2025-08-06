import azure.functions as func
import datetime
import json
import logging
import uuid
import os
import time
from azure.storage.blob import BlobServiceClient
from azure.data.tables import TableServiceClient, TableEntity
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

# Initialize Table Storage client
def get_table_service_client():
    """Initialize Azure Table Storage client"""
    connection_string = os.environ.get("STORAGE_CONNECTION_STRING")
    if connection_string:
        return TableServiceClient.from_connection_string(connection_string)
    else:
        # Fallback to managed identity (for production)
        account_url = "https://stimagerecprod001.table.core.windows.net"
        credential = DefaultAzureCredential()
        return TableServiceClient(endpoint=account_url, credential=credential)

# Data Access Layer for Image Analysis Results
class ImageAnalysisRepository:
    """Repository pattern for Table Storage operations"""
    
    def __init__(self):
        self.table_service = get_table_service_client()
        self.table_name = "ImageAnalysisResults"
        self._ensure_table_exists()
    
    def _ensure_table_exists(self):
        """Create table if it doesn't exist"""
        try:
            table_client = self.table_service.get_table_client(self.table_name)
            table_client.create_table()
            logging.info(f"Table {self.table_name} created or already exists")
        except Exception as e:
            if "already exists" not in str(e).lower():
                logging.error(f"Error creating table: {str(e)}")
    
    def save_analysis_result(self, image_id, blob_name, analysis_data, upload_time, file_metadata):
        """Save analysis results to Table Storage"""
        try:
            # Create partition key (date) and row key
            analysis_time = datetime.datetime.utcnow()
            partition_key = analysis_time.strftime("%Y-%m-%d")
            row_key = f"{image_id}_{analysis_time.strftime('%Y%m%d_%H%M%S')}"
            
            # Extract key metrics for easy querying
            objects = analysis_data.get("analysis", {}).get("objects", [])
            faces = analysis_data.get("analysis", {}).get("faces", [])
            descriptions = analysis_data.get("analysis", {}).get("descriptions", [])
            tags = analysis_data.get("analysis", {}).get("tags", [])
            text_result = analysis_data.get("analysis", {}).get("text", {})
            
            # Get primary description and confidence
            primary_description = ""
            max_confidence = 0.0
            if descriptions:
                primary_description = descriptions[0].get("text", "")
                max_confidence = descriptions[0].get("confidence", 0.0)
            
            # Create tag string
            tag_names = [tag.get("name", "") for tag in tags[:10]]  # Limit to 10 tags
            tags_string = ",".join(tag_names)
            
            # Create entity
            entity = TableEntity()
            entity.update({
                "PartitionKey": partition_key,
                "RowKey": row_key,
                "imageId": image_id,
                "blobName": blob_name,
                "status": "completed",
                "uploadTime": upload_time,
                "analysisTime": analysis_time.isoformat() + "Z",
                "analysisResults": json.dumps(analysis_data),
                "objectCount": len(objects),
                "faceCount": len(faces),
                "hasText": text_result.get("text_detected", False),
                "tags": tags_string[:1000],  # Limit to 1000 chars
                "primaryDescription": primary_description[:1000],  # Limit to 1000 chars
                "confidence": round(max_confidence, 4),
                "fileSize": int(file_metadata.get("fileSize", 0)),
                "dimensions": file_metadata.get("dimensions", ""),
                "format": file_metadata.get("format", "")
            })
            
            # Save to table
            table_client = self.table_service.get_table_client(self.table_name)
            table_client.create_entity(entity)
            
            logging.info(f"Saved analysis results for image {image_id}")
            return True
            
        except Exception as e:
            logging.error(f"Error saving analysis results: {str(e)}")
            return False
    
    def get_analysis_result(self, image_id):
        """Get analysis result by image ID"""
        try:
            table_client = self.table_service.get_table_client(self.table_name)
            
            # Query by imageId (need to scan since it's not the key)
            filter_query = f"imageId eq '{image_id}'"
            entities = table_client.query_entities(query_filter=filter_query, select=None)
            
            for entity in entities:
                return {
                    "imageId": entity["imageId"],
                    "blobName": entity["blobName"],
                    "status": entity["status"],
                    "uploadTime": entity["uploadTime"],
                    "analysisTime": entity["analysisTime"],
                    "analysisResults": json.loads(entity["analysisResults"]),
                    "metadata": {
                        "objectCount": entity.get("objectCount", 0),
                        "faceCount": entity.get("faceCount", 0),
                        "hasText": entity.get("hasText", False),
                        "tags": entity.get("tags", ""),
                        "primaryDescription": entity.get("primaryDescription", ""),
                        "confidence": entity.get("confidence", 0.0),
                        "fileSize": entity.get("fileSize", 0),
                        "dimensions": entity.get("dimensions", ""),
                        "format": entity.get("format", "")
                    }
                }
            
            return None
            
        except Exception as e:
            logging.error(f"Error retrieving analysis result: {str(e)}")
            return None
    
    def get_results_by_date_range(self, start_date, end_date, max_results=50):
        """Get results within date range"""
        try:
            table_client = self.table_service.get_table_client(self.table_name)
            
            # Create date range filter
            start_str = start_date.strftime("%Y-%m-%d")
            end_str = end_date.strftime("%Y-%m-%d")
            filter_query = f"PartitionKey ge '{start_str}' and PartitionKey le '{end_str}'"
            
            entities = table_client.query_entities(
                query_filter=filter_query,
                select=["imageId", "blobName", "status", "uploadTime", "analysisTime", 
                       "objectCount", "faceCount", "hasText", "tags", "primaryDescription", 
                       "confidence", "fileSize", "dimensions", "format"]
            )
            
            results = []
            count = 0
            for entity in entities:
                if count >= max_results:
                    break
                    
                results.append({
                    "imageId": entity["imageId"],
                    "blobName": entity["blobName"],
                    "status": entity["status"],
                    "uploadTime": entity["uploadTime"],
                    "analysisTime": entity["analysisTime"],
                    "summary": {
                        "objectCount": entity.get("objectCount", 0),
                        "faceCount": entity.get("faceCount", 0),
                        "hasText": entity.get("hasText", False),
                        "primaryDescription": entity.get("primaryDescription", ""),
                        "confidence": entity.get("confidence", 0.0)
                    }
                })
                count += 1
            
            return results
            
        except Exception as e:
            logging.error(f"Error querying by date range: {str(e)}")
            return []
    
    def update_status(self, image_id, status):
        """Update the status of an analysis"""
        try:
            # First find the entity
            result = self.get_analysis_result(image_id)
            if not result:
                return False
            
            # Update status
            table_client = self.table_service.get_table_client(self.table_name)
            
            # Get the entity to update
            filter_query = f"imageId eq '{image_id}'"
            entities = table_client.query_entities(query_filter=filter_query)
            
            for entity in entities:
                entity["status"] = status
                table_client.update_entity(mode="replace", entity=entity)
                logging.info(f"Updated status for image {image_id} to {status}")
                return True
            
            return False
            
        except Exception as e:
            logging.error(f"Error updating status: {str(e)}")
            return False

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
        
        # 🔥 SAVE RESULTS TO TABLE STORAGE (FIXED LOCATION)
        saved_to_storage = False
        try:
            repository = ImageAnalysisRepository()
            file_metadata = {
                "fileSize": target_blob.metadata.get("file_size", "0"),
                "dimensions": target_blob.metadata.get("dimensions", ""),
                "format": target_blob.metadata.get("format", "")
            }
            
            saved = repository.save_analysis_result(
                image_id=image_id,
                blob_name=target_blob.name,
                analysis_data=analysis_data,
                upload_time=target_blob.metadata.get("upload_time", ""),
                file_metadata=file_metadata
            )
            
            if saved:
                logging.info(f"✅ Analysis results saved to Table Storage for image {image_id}")
                saved_to_storage = True
            else:
                logging.warning(f"❌ Failed to save analysis results for image {image_id}")
                
        except Exception as save_error:
            logging.error(f"💥 Error saving to Table Storage: {str(save_error)}")
            # Don't fail the request if saving fails
        
        # Return success response
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "message": "Image analysis completed successfully",
                "saved_to_storage": saved_to_storage,
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

@app.route(route="images/{imageId}/results", auth_level=func.AuthLevel.ANONYMOUS, methods=["GET"])
def get_analysis_results(req: func.HttpRequest) -> func.HttpResponse:
    """
    Get stored analysis results by image ID
    Returns cached results from Table Storage
    """
    logging.info('Get analysis results endpoint called')
    
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
        
        # Get results from Table Storage
        repository = ImageAnalysisRepository()
        result = repository.get_analysis_result(image_id)
        
        if not result:
            return func.HttpResponse(
                json.dumps({
                    "success": False,
                    "error": f"No analysis results found for image ID {image_id}",
                    "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
                }),
                status_code=404,
                mimetype="application/json"
            )
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "message": "Analysis results retrieved successfully",
                "cached": True,
                **result
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"Get results function error: {str(e)}")
        return func.HttpResponse(
            json.dumps({
                "success": False,
                "error": f"Retrieval error: {str(e)}",
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
            }),
            status_code=500,
            mimetype="application/json"
        )

@app.route(route="results/search", auth_level=func.AuthLevel.ANONYMOUS, methods=["GET"])
def search_results(req: func.HttpRequest) -> func.HttpResponse:
    """
    Search analysis results with filters
    Query parameters: days_back, max_results, has_faces, has_objects, has_text
    """
    logging.info('Search results endpoint called')
    
    try:
        # Parse query parameters
        days_back = int(req.params.get('days_back', '7'))
        max_results = int(req.params.get('max_results', '50'))
        has_faces = req.params.get('has_faces', '').lower() == 'true'
        has_objects = req.params.get('has_objects', '').lower() == 'true'
        has_text = req.params.get('has_text', '').lower() == 'true'
        
        # Limit max_results for performance
        max_results = min(max_results, 100)
        
        # Calculate date range
        end_date = datetime.datetime.utcnow()
        start_date = end_date - datetime.timedelta(days=days_back)
        
        # Get results from Table Storage
        repository = ImageAnalysisRepository()
        results = repository.get_results_by_date_range(start_date, end_date, max_results)
        
        # Apply filters
        filtered_results = []
        for result in results:
            summary = result.get("summary", {})
            
            # Apply filters
            if has_faces and summary.get("faceCount", 0) == 0:
                continue
            if has_objects and summary.get("objectCount", 0) == 0:
                continue
            if has_text and not summary.get("hasText", False):
                continue
            
            filtered_results.append(result)
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "message": f"Found {len(filtered_results)} results",
                "query": {
                    "days_back": days_back,
                    "max_results": max_results,
                    "filters": {
                        "has_faces": has_faces,
                        "has_objects": has_objects,
                        "has_text": has_text
                    },
                    "date_range": {
                        "start": start_date.isoformat() + "Z",
                        "end": end_date.isoformat() + "Z"
                    }
                },
                "total_found": len(filtered_results),
                "results": filtered_results
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"Search function error: {str(e)}")
        return func.HttpResponse(
            json.dumps({
                "success": False,
                "error": f"Search error: {str(e)}",
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
            }),
            status_code=500,
            mimetype="application/json"
        )

@app.route(route="results/stats", auth_level=func.AuthLevel.ANONYMOUS, methods=["GET"])
def get_analysis_stats(req: func.HttpRequest) -> func.HttpResponse:
    """
    Get analysis statistics and summary
    """
    logging.info('Get stats endpoint called')
    
    try:
        days_back = int(req.params.get('days_back', '7'))
        
        # Calculate date range
        end_date = datetime.datetime.utcnow()
        start_date = end_date - datetime.timedelta(days=days_back)
        
        # Get results
        repository = ImageAnalysisRepository()
        results = repository.get_results_by_date_range(start_date, end_date, 1000)
        
        # Calculate statistics
        total_images = len(results)
        images_with_faces = sum(1 for r in results if r.get("summary", {}).get("faceCount", 0) > 0)
        images_with_objects = sum(1 for r in results if r.get("summary", {}).get("objectCount", 0) > 0)
        images_with_text = sum(1 for r in results if r.get("summary", {}).get("hasText", False))
        
        # Average confidence
        confidences = [r.get("summary", {}).get("confidence", 0) for r in results if r.get("summary", {}).get("confidence", 0) > 0]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        
        # Total objects and faces
        total_objects = sum(r.get("summary", {}).get("objectCount", 0) for r in results)
        total_faces = sum(r.get("summary", {}).get("faceCount", 0) for r in results)
        
        stats = {
            "success": True,
            "period": {
                "days_back": days_back,
                "start_date": start_date.isoformat() + "Z",
                "end_date": end_date.isoformat() + "Z"
            },
            "summary": {
                "total_images_analyzed": total_images,
                "images_with_faces": images_with_faces,
                "images_with_objects": images_with_objects,
                "images_with_text": images_with_text,
                "total_objects_detected": total_objects,
                "total_faces_detected": total_faces,
                "average_confidence": round(avg_confidence, 4)
            },
            "percentages": {
                "faces": round((images_with_faces / total_images * 100) if total_images > 0 else 0, 2),
                "objects": round((images_with_objects / total_images * 100) if total_images > 0 else 0, 2),
                "text": round((images_with_text / total_images * 100) if total_images > 0 else 0, 2)
            }
        }
        
        return func.HttpResponse(
            json.dumps(stats),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"Stats function error: {str(e)}")
        return func.HttpResponse(
            json.dumps({
                "success": False,
                "error": f"Stats error: {str(e)}",
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
            }),
            status_code=500,
            mimetype="application/json"
        )