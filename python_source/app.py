from flask import Flask
from config import Config
from routes.item_routes import item_bp
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Register Blueprints
    app.register_blueprint(item_bp)

    @app.route('/')
    def index():
        return {"message": "List Manager API is running"}, 200

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG)
