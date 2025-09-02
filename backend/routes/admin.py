from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Pharmacy, Medication, Reservation, Subscription, Advertisement, db
from utils.helpers import role_required, paginate
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_admin_dashboard():
    try:
        # Get statistics
        total_pharmacies = Pharmacy.query.count()
        premium_subscriptions = Subscription.query.filter_by(status='active').count()
        total_users = User.query.count()
        
        # Calculate revenue
        active_subscriptions = Subscription.query.filter_by(status='active').all()
        total_revenue = sum(sub.amount for sub in active_subscriptions)
        
        # Get recent activity
        recent_reservations = Reservation.query.order_by(
            Reservation.created_at.desc()
        ).limit(5).all()
        
        recent_users = User.query.order_by(
            User.created_at.desc()
        ).limit(5).all()
        
        return jsonify({
            'stats': {
                'total_pharmacies': total_pharmacies,
                'premium_subscriptions': premium_subscriptions,
                'total_revenue': total_revenue,
                'total_users': total_users
            },
            'recent_reservations': [res.to_dict() for res in recent_reservations],
            'recent_users': [user.to_dict() for user in recent_users]
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_users():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        role = request.args.get('role')
        search = request.args.get('search', '')
        
        # Build query
        query = User.query
        
        if role:
            query = query.filter_by(role=role)
            
        if search:
            query = query.filter(
                (User.name.ilike(f'%{search}%')) |
                (User.email.ilike(f'%{search}%'))
            )
            
        query = query.order_by(User.created_at.desc())
        
        result = paginate(query, page, per_page)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@role_required(['admin'])
def update_user(user_id):
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        data = request.get_json()
        
        if 'role' in data:
            user.role = data['role']
        if 'name' in data:
            user.name = data['name']
        if 'phone' in data:
            user.phone = data['phone']
            
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/pharmacies', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_pharmacies():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        subscription_status = request.args.get('subscription_status')
        search = request.args.get('search', '')
        
        # Build query
        query = Pharmacy.query
        
        if subscription_status:
            query = query.filter_by(subscription_status=subscription_status)
            
        if search:
            query = query.filter(Pharmacy.name.ilike(f'%{search}%'))
            
        query = query.order_by(Pharmacy.created_at.desc())
        
        result = paginate(query, page, per_page)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/subscriptions', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_subscriptions():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status')
        
        # Build query
        query = Subscription.query.join(Pharmacy)
        
        if status:
            query = query.filter(Subscription.status == status)
            
        query = query.order_by(Subscription.created_at.desc())
        
        result = paginate(query, page, per_page)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/advertisements', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_advertisements():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        active = request.args.get('active', type=bool)
        
        # Build query
        query = Advertisement.query
        
        if active is not None:
            query = query.filter_by(active=active)
            
        query = query.order_by(Advertisement.created_at.desc())
        
        result = paginate(query, page, per_page)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/advertisements', methods=['POST'])
@jwt_required()
@role_required(['admin'])
def create_advertisement():
    try:
        data = request.get_json()
        
        advertisement = Advertisement(
            title=data.get('title'),
            content=data.get('content'),
            image_url=data.get('image_url'),
            advertiser_name=data.get('advertiser_name'),
            budget=data.get('budget', 0.0),
            active=data.get('active', True)
        )
        
        db.session.add(advertisement)
        db.session.commit()
        
        return jsonify({
            'message': 'Advertisement created successfully',
            'advertisement': advertisement.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/analytics', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_analytics():
    try:
        # Get date range (last 30 days)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=30)
        
        # Get user registrations
        user_registrations = User.query.filter(
            User.created_at.between(start_date, end_date)
        ).count()
        
        # Get reservations
        reservations = Reservation.query.filter(
            Reservation.created_at.between(start_date, end_date)
        ).count()
        
        # Get revenue
        revenue = Subscription.query.filter(
            Subscription.created_at.between(start_date, end_date)
        ).with_entities(db.func.sum(Subscription.amount)).scalar() or 0
        
        # Get popular medications
        popular_medications = db.session.query(
            Medication.name,
            db.func.count(Reservation.id).label('reservation_count')
        ).join(Reservation).filter(
            Reservation.created_at.between(start_date, end_date)
        ).group_by(Medication.id).order_by(
            db.func.count(Reservation.id).desc()
        ).limit(5).all()
        
        return jsonify({
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'user_registrations': user_registrations,
            'reservations': reservations,
            'revenue': revenue,
            'popular_medications': [
                {'name': name, 'reservation_count': count}
                for name, count in popular_medications
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500