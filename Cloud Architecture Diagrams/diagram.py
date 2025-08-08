from diagrams import Cluster, Diagram
from diagrams.azure.compute import FunctionApps
from diagrams.azure.storage import BlobStorage, TableStorage
from diagrams.azure.analytics import LogAnalyticsWorkspaces
from diagrams.azure.identity import ManagedIdentities
from diagrams.onprem.client import Users
from diagrams.programming.language import Python
from diagrams.onprem.ci import GithubActions
from diagrams.aws.mobile import Amplify
from diagrams.custom import Custom

with Diagram("Image Analysis App Architecture", show=False, direction="LR"):

    user = Users("User")

    with Cluster("Frontend"):
        react_frontend = Amplify("React App (AWS Amplify)")

    with Cluster("Azure Functions (Python)"):
        upload_func = FunctionApps("POST /upload")
        analyze_func = FunctionApps("POST /analyze/{imageId}")
        results_func = FunctionApps("GET /images/{imageId}/results")
        search_func = FunctionApps("GET /results/search")
        stats_func = FunctionApps("GET /results/stats")
    
    with Cluster("Azure Storage"):
        blob = BlobStorage("Blob Storage\n(images-upload)")
        table = TableStorage("Table Storage\n(ImageAnalysisResults)")

    with Cluster("External API"):
        vision_api = Custom("Azure\nComputer Vision", "./icons/cv.png")  # You can create or download a custom icon

    with Cluster("Monitoring"):
        logs = LogAnalyticsWorkspaces("App Insights\n(Log Workspace)")

    user >> react_frontend
    react_frontend >> upload_func
    react_frontend >> results_func
    react_frontend >> search_func
    react_frontend >> stats_func

    upload_func >> blob
    upload_func >> analyze_func
    analyze_func >> vision_api
    analyze_func >> table
    analyze_func >> blob

    results_func >> table
    search_func >> table
    stats_func >> table

    [upload_func, analyze_func, results_func, search_func, stats_func] >> logs
    [upload_func, analyze_func] >> ManagedIdentities("Managed Identity") >> [blob, table]
