from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import config
from database import db, init_db
from data.seed_data import seed_data

# Import blueprints
from routes.auth import auth_bp
from routes.patient import patient_bp
from routes.pharmacist import pharmacist_bp
from routes.admin import admin_bp

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    JWTManager(app)
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(patient_bp, url_prefix='/api/patient')
    app.register_blueprint(pharmacist_bp, url_prefix='/api/pharmacist')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # Initialize database
    with app.app_context():
        init_db(app)
        # Seed initial data
        seed_data()
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'message': 'Resource not found'}), 404
        
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'message': 'Internal server error'}), 500
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return jsonify({'status': 'healthy', 'message': 'PharmaLink API is running'})
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)