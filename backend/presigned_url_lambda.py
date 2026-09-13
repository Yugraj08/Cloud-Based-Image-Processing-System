import json
import boto3
import os
import uuid

s3_client = boto3.client("s3")

AWS_S3_BUCKET = os.environ["AWS_S3_BUCKET"]
S3_PREFIX_ORIGINAL = "original/"


def lambda_handler(event, context):
    """
    Generate a presigned S3 URL for uploading an image.
    """

    try:
        query_params = event.get("queryStringParameters") or {}

        filename = query_params.get(
            "filename",
            f"{uuid.uuid4()}.jpg"
        )

        content_type = query_params.get(
            "contentType",
            "image/jpeg"
        )

        object_key = f"{S3_PREFIX_ORIGINAL}{filename}"

        presigned_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": AWS_S3_BUCKET,
                "Key": object_key,
                "ContentType": content_type
            },
            ExpiresIn=300
        )

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true"
            },
            "body": json.dumps({
                "data": {
                    "uploadUrl": presigned_url,
                    "jobId": filename
                }
            })
        }

    except Exception as e:
        print(f"Error generating presigned URL: {str(e)}")

        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "error": "Failed to generate upload URL"
            })
        }