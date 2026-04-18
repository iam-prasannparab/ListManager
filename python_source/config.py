import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MYSQL_HOST = os.getenv('DB_HOST', 'localhost')
    MYSQL_USER = os.getenv('DB_USER', 'root')
    MYSQL_PASSWORD = os.getenv('DB_PASSWORD', 'password')
    MYSQL_DB = os.getenv('DB_NAME', 'list_manager_db')
    PORT = int(os.getenv('PORT', 5000))
    DEBUG = os.getenv('DEBUG', 'True') == 'True'
