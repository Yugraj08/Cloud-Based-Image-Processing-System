import json
import boto3
import os

s3_client = boto3.client("s3")

AWS_S3_BUCKET = os.environ["AWS_S3_BUCKET"]
S3_PREFIX_PROCESSED = "processed/"


def lambda_handler(event, context):
    """
    Check whether the processed image exists in S3.
    """

    try:
        path_parameters = event.get("pathParameters") or {}
        job_id = path_parameters.get("jobId")

        if not job_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Access-Control-Allow-Origin": "*"
                },
                "body": json.dumps({
                    "error": "jobId required"
                })
            }

        # Remove file extension from job ID
        base_name = job_id.rsplit(".", 1)[0]

        # Look for the processed file
        prefix = f"{S3_PREFIX_PROCESSED}{base_name}"

        response = s3_client.list_objects_v2(
            Bucket=AWS_S3_BUCKET,
            Prefix=prefix
        )

        contents = response.get("Contents", [])

        if contents:
            object_key = contents[0]["Key"]
            filename = object_key.split("/")[-1]

            download_url = s3_client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": AWS_S3_BUCKET,
                    "Key": object_key
                },
                ExpiresIn=3600
            )

            return {
                "statusCode": 200,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true"
                },
                "body": json.dumps({
                    "data": {
                        "status": "completed",
                        "downloadUrl": download_url,
                        "filename": filename
                    }
                })
            }

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true"
            },
            "body": json.dumps({
                "data": {
                    "status": "pending"
                }
            })
        }

    except Exception as e:
        print(f"Error checking job status: {str(e)}")

        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "error": "Failed to check job status"
            })
        }