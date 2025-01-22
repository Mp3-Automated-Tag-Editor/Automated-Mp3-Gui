# logging_config.py

import logging
from dotenv import load_dotenv
import re
import os

def setup_logging():
    load_dotenv()
    level = os.getenv("LOGGING_LEVEL")

    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG)

    # File handler
    file_handler = logging.FileHandler('app.log')

    # Console handler
    console_handler = logging.StreamHandler()

    # Set Level
    if level == "DEBUG":
        console_handler.setLevel(logging.DEBUG)
        file_handler.setLevel(logging.DEBUG)
    elif level == "INFO":
        console_handler.setLevel(logging.INFO)
        file_handler.setLevel(logging.INFO)
    else:
        console_handler.setLevel(logging.INFO)
        file_handler.setLevel(logging.INFO)
        
    # Formatter
    formatter = logging.Formatter('%(levelname)s - %(asctime)s - | %(filename)s | - %(message)s')
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    # Add handlers to the logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger
