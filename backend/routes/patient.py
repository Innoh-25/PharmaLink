from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Pharmacy, Medication, Inventory, Reservation, db
from utils.helpers import role_required, paginate
import math

patient_bp = Blueprint('patient', __name__)

@patient_bp.route('/pharmacies/search', methods=['GET'])
@jwt_required()
@role_required(['patient'])
def search_pharmacies():
    try:
        medication_name = request.args.get('medication')
        location = request.args.get('location')
        latitude = request.args.get('lat')
        longitude = request.args.get('lng')
        max_distance = request.args.get('max_distance', 10, type=float)  # in km
        
        if not medication_name:
            return jsonify({'message': 'Medication name is required'}), 400
            
        # Find medication
        medication = Medication.query.filter(
            Medication.name.ilike(f'%{medication_name}%')
        ).first()
        
        if not medication:
            return jsonify({'message': 'Medication not found'}), 404
            
        # Find pharmacies with the medication in stock
        query = Inventory.query.filter_by(medication_id=medication.id)
        query = query.filter(Inventory.stock_quantity > 0)
        
        inventories = query.all()
        
        if not inventories:
            return jsonify({'message': 'No pharmacies found with this medication in stock'}), 404
            
        # Get pharmacy details
        results = []
        for inventory in inventories:
            pharmacy = Pharmacy.query.get(inventory.pharmacy_id)
            
            if pharmacy:
                pharmacy_data = pharmacy.to_dict()
                pharmacy_data['price'] = inventory.price
                pharmacy_data['stock'] = inventory.stock_quantity
                pharmacy_data['distance'] = None
                
                # Calculate distance if coordinates provided
                if latitude and longitude and pharmacy.latitude and pharmacy.longitude:
                    distance = calculate_distance(
                        float(latitude), float(longitude),
                        pharmacy.latitude, pharmacy.longitude
                    )
                    pharmacy_data['distance'] = distance
                
                results.append(pharmacy_data)
        
        # Sort by distance if available
        if latitude and longitude:
            results.sort(key=lambda x: x['distance'] if x['distance'] is not None else float('inf'))
        else:
            # Sort by price if no location provided
            results.sort(key=lambda x: x['price'])
        
        return jsonify({
            'medication': medication.to_dict(),
            'pharmacies': results
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

def calculate_distance(lat1, lng1, lat2, lng2):
    # Haversine formula to calculate distance between two points
    R = 6371  # Earth's radius in km
    
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    
    a = (math.sin(dlat/2) * math.sin(dlat/2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlng/2) * math.sin(dlng/2))
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c
    
    return round(distance, 2)

@patient_bp.route('/reservations', methods=['POST'])
@jwt_required()
@role_required(['patient'])
def create_reservation():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        pharmacy_id = data.get('pharmacy_id')
        medication_id = data.get('medication_id')
        quantity = data.get('quantity', 1)
        
        if not pharmacy_id or not medication_id:
            return jsonify({'message': 'Pharmacy and medication are required'}), 400
            
        # Check if medication is available
        inventory = Inventory.query.filter_by(
            pharmacy_id=pharmacy_id,
            medication_id=medication_id
        ).first()
        
        if not inventory or inventory.stock_quantity < quantity:
            return jsonify({'message': 'Not enough stock available'}), 400
            
        # Create reservation
        reservation = Reservation(
            user_id=user_id,
            pharmacy_id=pharmacy_id,
            medication_id=medication_id,
            quantity=quantity,
            customer_name=data.get('customer_name'),
            customer_phone=data.get('customer_phone'),
            notes=data.get('notes'),
            status='pending'
        )
        
        # Update inventory
        inventory.stock_quantity -= quantity
        
        db.session.add(reservation)
        db.session.commit()
        
        return jsonify({
            'message': 'Reservation created successfully',
            'reservation': reservation.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@patient_bp.route('/reservations', methods=['GET'])
@jwt_required()
@role_required(['patient'])
def get_reservations():
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        reservations = Reservation.query.filter_by(user_id=user_id)
        reservations = reservations.order_by(Reservation.created_at.desc())
        
        result = paginate(reservations, page, per_page)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@patient_bp.route('/reservations/<int:reservation_id>', methods=['GET'])
@jwt_required()
@role_required(['patient'])
def get_reservation(reservation_id):
    try:
        user_id = get_jwt_identity()
        reservation = Reservation.query.filter_by(
            id=reservation_id,
            user_id=user_id
        ).first()
        
        if not reservation:
            return jsonify({'message': 'Reservation not found'}), 404
            
        return jsonify({'reservation': reservation.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@patient_bp.route('/reservations/<int:reservation_id>/cancel', methods=['PUT'])
@jwt_required()
@role_required(['patient'])
def cancel_reservation(reservation_id):
    try:
        user_id = get_jwt_identity()
        reservation = Reservation.query.filter_by(
            id=reservation_id,
            user_id=user_id
        ).first()
        
        if not reservation:
            return jsonify({'message': 'Reservation not found'}), 404
            
        if reservation.status not in ['pending', 'confirmed']:
            return jsonify({'message': 'Cannot cancel this reservation'}), 400
            
        # Restore inventory
        inventory = Inventory.query.filter_by(
            pharmacy_id=reservation.pharmacy_id,
            medication_id=reservation.medication_id
        ).first()
        
        if inventory:
            inventory.stock_quantity += reservation.quantity
            
        # Update reservation status
        reservation.status = 'cancelled'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Reservation cancelled successfully',
            'reservation': reservation.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@patient_bp.route('/medications/search', methods=['GET'])
@jwt_required()
@role_required(['patient'])
def search_medications():
    try:
        query = request.args.get('q', '')
        
        if not query or len(query) < 2:
            return jsonify({'medications': []}), 200
            
        medications = Medication.query.filter(
            Medication.name.ilike(f'%{query}%')
        ).limit(10).all()
        
        return jsonify({
            'medications': [med.to_dict() for med in medications]
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500