from models import User, Pharmacy, Medication, Inventory, db
from datetime import datetime

def seed_data():
    # Create default medications
    medications = [
        Medication(name="Panadol", category="Pain Relief", description="Pain reliever and fever reducer", generic_name="Paracetamol"),
        Medication(name="Augmentin", category="Antibiotic", description="Broad-spectrum antibiotic", generic_name="Amoxicillin/Clavulanate"),
        Medication(name="Metformin", category="Diabetes", description="Oral diabetes medicine", generic_name="Metformin Hydrochloride"),
        Medication(name="Amlodipine", category="Blood Pressure", description="Calcium channel blocker", generic_name="Amlodipine Besylate"),
        Medication(name="Omeprazole", category="Acid Reflux", description="Proton pump inhibitor", generic_name="Omeprazole"),
        Medication(name="Amoxicillin", category="Antibiotic", description="Penicillin antibiotic", generic_name="Amoxicillin"),
        Medication(name="Ventolin", category="Asthma", description="Bronchodilator", generic_name="Salbutamol"),
        Medication(name="Losartan", category="Blood Pressure", description="Angiotensin II receptor blocker", generic_name="Losartan Potassium"),
        Medication(name="Atorvastatin", category="Cholesterol", description="Statin medication", generic_name="Atorvastatin Calcium"),
        Medication(name="Cetirizine", category="Allergy", description="Antihistamine", generic_name="Cetirizine Hydrochloride")
    ]
    
    for med in medications:
        if not Medication.query.filter_by(name=med.name).first():
            db.session.add(med)
    
    # Create default users
    users = [
        {
            'email': 'patient@example.com',
            'password': 'password',
            'role': 'patient',
            'name': 'John Patient',
            'phone': '+254712345678'
        },
        {
            'email': 'pharmacist@example.com',
            'password': 'password',
            'role': 'pharmacist',
            'name': 'Sarah Pharmacist',
            'phone': '+254723456789'
        },
        {
            'email': 'admin@example.com',
            'password': 'password',
            'role': 'admin',
            'name': 'Admin User',
            'phone': '+254734567890'
        }
    ]
    
    for user_data in users:
        if not User.query.filter_by(email=user_data['email']).first():
            user = User(
                email=user_data['email'],
                role=user_data['role'],
                name=user_data['name'],
                phone=user_data['phone']
            )
            user.set_password(user_data['password'])
            db.session.add(user)
    
    db.session.commit()
    
    # Create pharmacies
    pharmacist_user = User.query.filter_by(role='pharmacist').first()
    
    if pharmacist_user:
        pharmacies = [
            Pharmacy(
                name="Goodlife Pharmacy Westlands",
                address="ABC Place, Waiyaki Way, Nairobi",
                latitude=-1.265590,
                longitude=36.807350,
                phone="+254711123456",
                owner_id=pharmacist_user.id,
                subscription_status="active"
            ),
            Pharmacy(
                name="Pharmaceutical Access Ltd",
                address="Kimathi Street, CBD, Nairobi",
                latitude=-1.285270,
                longitude=36.821350,
                phone="+254722789012",
                owner_id=pharmacist_user.id,
                subscription_status="active"
            ),
            Pharmacy(
                name="Mediheal Pharmacy",
                address="Mombasa Road, Nairobi",
                latitude=-1.319240,
                longitude=36.854870,
                phone="+254733456789",
                owner_id=pharmacist_user.id,
                subscription_status="inactive"
            )
        ]
        
        for pharmacy in pharmacies:
            if not Pharmacy.query.filter_by(name=pharmacy.name).first():
                db.session.add(pharmacy)
        
        db.session.commit()
        
        # Create inventory items
        pharmacies = Pharmacy.query.all()
        medications = Medication.query.all()
        
        for pharmacy in pharmacies:
            for medication in medications:
                # Only add inventory for some medications to each pharmacy
                if (pharmacy.id + medication.id) % 3 == 0:
                    inventory = Inventory(
                        pharmacy_id=pharmacy.id,
                        medication_id=medication.id,
                        stock_quantity=50 if pharmacy.subscription_status == 'active' else 20,
                        price=500 + (medication.id * 50)
                    )
                    db.session.add(inventory)
        
        db.session.commit()
    
    print("Seed data created successfully!")