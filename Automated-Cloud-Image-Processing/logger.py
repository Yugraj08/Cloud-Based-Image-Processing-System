import logging
from config import LOG_FILE

def setup_logger():
    """
    Sets up the application logger to write logs exclusively to the log file.
    Console output is managed separately in the main runner for custom formatting.
    """
    app_logger = logging.getLogger("ImageProcessorLogger")
    
    # Avoid adding handlers multiple times if logger is imported elsewhere
    if app_logger.hasHandlers():
        return app_logger

    app_logger.setLevel(logging.INFO)

    # File Handler - append mode
    file_handler = logging.FileHandler(LOG_FILE, mode='a')
    
    # Simple formatter per requirement: "Application Started", "Processing cat.jpg", etc.
    # We omit timestamp in this specific example based on the prompt's provided example, 
    # but normally we would include it. We will use a clean message format.
    file_formatter = logging.Formatter('%(message)s')
    file_handler.setFormatter(file_formatter)

    app_logger.addHandler(file_handler)
    
    return app_logger

logger = setup_logger()
