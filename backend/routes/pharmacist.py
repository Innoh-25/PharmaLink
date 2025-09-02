from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Pharmacy, Medication, Inventory, Reservation, db
from utils.helpers import role_required, paginate

pharmacist_bp = Blueprint('pharmacist', __name__)

@pharmacist_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@role_required(['pharmacist'])
def get_dashboard():
    try:
        user_id = get_jwt_identity()
        
        # Get pharmacist's pharmacy
        pharmacy = Pharmacy.query.filter_by(owner_id=user_id).first()
        
        if not pharmacy:
            return jsonify({'message': 'Pharmacy not found'}), 404
            
        # Get statistics
        pending_reservations = Reservation.query.filter_by(
            pharmacy_id=pharmacy.id,
            status='pending'
        ).count()
        
        total_medications = Inventory.query.filter_by(
            pharmacy_id=pharmacy.id
        ).count()
        
        low_stock_items = Inventory.query.filter(
            Inventory.pharmacy_id == pharmacy.id,
            Inventory.stock_quantity < 10
        ).count()
        
        # Calculate revenue (simplified)
        completed_reservations = Reservation.query.filter_by(
            pharmacy_id=pharmacy.id,
            status='completed'
        ).all()
        
        monthly_revenue = sum(
            res.quantity * Inventory.query.filter_by(
                pharmacy_id=pharmacy.id,
                medication_id=res.medication_id
            ).first().price
            for res in completed_reservations
            if res.created_at.month == db.func.extract('month', db.func.now())
        )
        
        # Get recent reservations
        recent_reservations = Reservation.query.filter_by(
            pharmacy_id=pharmacy.id
        ).order_by(Reservation.created_at.desc()).limit(5).all()
        
        # Get low stock items
        low_stock = Inventory.query.filter(
            Inventory.pharmacy_id == pharmacy.id,
            Inventory.stock_quantity < 10
        ).order_by(Inventory.stock_quantity.asc()).limit(5).all()
        
        return jsonify({
            'stats': {
                'pending_reservations': pending_reservations,
                'total_medications': total_medications,
                'low_stock_items': low_stock_items,
                'monthly_revenue': round(monthly_revenue, 2)
            },
            'recent_reservations': [res.to_dict() for res in recent_reservations],
            'low_stock_items': [inv.to_dict() for inv in low_stock],
            'pharmacy': pharmacy.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@pharmacist_bp.route('/inventory', methods=['GET'])
@jwt_required()
@role_required(['pharmacist'])
def get_inventory():
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        
        # Get pharmacist's pharmacy
        pharmacy = Pharmacy.query.filter_by(owner_id=user_id).first()
        
        if not pharmacy:
            return jsonify({'message': 'Pharmacy not found'}), 404
            
        # Build query
        query = Inventory.query.filter_by(pharmacy_id=pharmacy.id)
        
        if search:
            query = query.join(Medication).filter(
                Medication.name.ilike(f'%{search}%')
            )
            
        query = query.order_by(Inventory.updated_at.desc())
        
        result = paginate(query, page, per_page)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@pharmacist_bp.route('/inventory', methods=['POST'])
@jwt_required()
@role_required(['pharmacist'])
def add_inventory_item():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Get pharmacist's pharmacy
        pharmacy = Pharmacy.query.filter_by(owner_id=user_id).first()
        
        if not pharmacy:
            return jsonify({'message': 'Pharmacy not found'}), 404
            
        medication_id = data.get('medication_id')
        stock_quantity = data.get('stock_quantity', 0)
        price = data.get('price', 0.0)
        
        if not medication_id:
            return jsonify({'message': 'Medication ID is required'}), 400
            
        # Check if medication exists
        medication = Medication.query.get(medication_id)
        
        if not medication:
            return jsonify({'message': 'Medication not found'}), 404
            
        # Check if inventory item already exists
        existing = Inventory.query.filter_by(
            pharmacy_id=pharmacy.id,
            medication_id=medication_id
        ).first()
        
        if existing:
            # Update existing item
            existing.stock_quantity += stock_quantity
            existing.price = price
        else:
            # Create new inventory item
            inventory = Inventory(
                pharmacy_id=pharmacy.id,
                medication_id=medication_id,
                stock_quantity=stock_quantity,
                price=price
            )
            db.session.add(inventory)
            
        db.session.commit()
        
        return jsonify({
            'message': 'Inventory updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@pharmacist_bp.route('/inventory/<int:inventory_id>', methods=['PUT'])
@jwt_required()
@role_required(['pharmacist'])
def update_inventory_item(inventory_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Get pharmacist's pharmacy
        pharmacy = Pharmacy.query.filter_by(owner_id=user_id).first()
        
        if not pharmacy:
            return jsonify({'message': 'Pharmacy not found'}), 404
            
        # Get inventory item
        inventory = Inventory.query.filter_by(
            id=inventory_id,
            pharmacy_id=pharmacy.id
        ).first()
        
        if not inventory:
            return jsonify({'message': 'Inventory item not found'}), 404
            
        # Update fields
        if 'stock_quantity' in data:
            inventory.stock_quantity = data['stock_quantity']
        if 'price' in data:
            inventory.price = data['price']
            
        db.session.commit()
        
        return jsonify({
            'message': 'Inventory updated successfully',
            'inventory': inventory.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@pharmacist_bp.route('/reservations', methods=['GET'])
@jwt_required()
@role_required(['pharmacist'])
def get_pharmacy_reservations():
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status')
        
        # Get pharmacist's pharmacy
        pharmacy = Pharmacy.query.filter_by(owner_id=user_id).first()
        
        if not pharmacy:
            return jsonify({'message': 'Pharmacy not found'}), 404
            
        # Build query
        query = Reservation.query.filter_by(pharmacy_id=pharmacy.id)
        
        if status:
            query = query.filter_by(status=status)
            
        query = query.order_by(Reservation.created_at.desc())
        
        result = paginate(query, page, per_page)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@pharmacist_bp.route('/reservations/<int:reservation_id>', methods=['PUT'])
@jwt_required()
@role_required(['pharmacist'])
def update_reservation_status(reservation_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        status = data.get('status')
        
        if not status:
            return jsonify({'message': 'Status is required'}), 400
            
        # Get pharmacist's pharmacy
        pharmacy = Pharmacy.query.filter_by(owner_id=user_id).first()
        
        if not pharmacy:
            return jsonify({'message': 'Pharmacy not found'}), 404
            
        # Get reservation
        reservation = Reservation.query.filter_by(
            id=reservation_id,
            pharmacy_id=pharmacy.id
        ).first()
        
        if not reservation:
            return jsonify({'message': 'Reservation not found'}), 404
            
        # Update status
        reservation.status = status
        
        db.session.commit()
        
        return jsonify({
            'message': 'Reservation status updated successfully',
            'reservation': reservation.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500