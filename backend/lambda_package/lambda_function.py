import io
import os
import boto3
from urllib.parse import unquote_plus

from image_processor import ImageProcessor
from logger import logger

s3 = boto3.client("s3")

AWS_S3_BUCKET = os.environ["AWS_S3_BUCKET"]
S3_PREFIX_ORIGINAL = "original/"
S3_PREFIX_PROCESSED = "processed"


def lambda_handler(event, context):
    logger.info("Lambda execution started")

    for record in event.get("Records", []):
        try:
            bucket = record["s3"]["bucket"]["name"]
            key = unquote_plus(record["s3"]["object"]["key"])

            # Only process files uploaded to original/
            if not key.startswith(S3_PREFIX_ORIGINAL):
                logger.info(f"Skipping {key} - not in original folder")
                continue

            logger.info(f"Processing object: s3://{bucket}/{key}")

            response = s3.get_object(
                Bucket=bucket,
                Key=key
            )

            image_data = response["Body"].read()
            input_stream = io.BytesIO(image_data)

            # Read optional processing settings from S3 metadata
            metadata = response.get("Metadata", {})

            options = {
                "resize": metadata.get("resize", "true").lower() == "true",
                "apply_grayscale": metadata.get("grayscale", "false").lower() == "true",
                "quality": int(metadata.get("quality", 95)),
                "format": metadata.get("format", "original")
            }

            processor = ImageProcessor()
            output_stream = io.BytesIO()

            success, original_size, new_size = processor.process_image(
                input_stream,
                output_stream,
                filename=key,
                options=options
            )

            if not success:
                logger.error(f"Failed to process {key}")
                continue

            output_stream.seek(0)

            # Remove original/ prefix
            filename = key.replace(S3_PREFIX_ORIGINAL, "", 1)

            # Determine output format
            target_format = options.get("format", "original").lower()

            if target_format == "png" or (
                target_format == "original"
                and filename.lower().endswith(".png")
            ):
                content_type = "image/png"
                filename = f"{filename.rsplit('.', 1)[0]}.png"
            else:
                content_type = "image/jpeg"
                filename = f"{filename.rsplit('.', 1)[0]}.jpg"

            output_key = f"{S3_PREFIX_PROCESSED}/{filename}"

            s3.put_object(
                Bucket=AWS_S3_BUCKET,
                Key=output_key,
                Body=output_stream,
                ContentType=content_type
            )

            logger.info(
                f"Successfully uploaded to "
                f"s3://{AWS_S3_BUCKET}/{output_key}"
            )

            logger.info(
                f"Original Size: {original_size}, "
                f"New Size: {new_size}"
            )

        except Exception as e:
            logger.error(f"Error processing record: {str(e)}")
            raise

    logger.info("Lambda execution finished")

    return {
        "statusCode": 200,
        "body": "Successfully processed records."
    }