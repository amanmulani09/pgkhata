import logging

from app.db.session import SessionLocal
from app.db.base_class import Base
from app.db.session import engine
from app import models
from app.core.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init():
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check if user exists
    user = db.query(models.User).filter(models.User.email == "admin@example.com").first()
    if not user:
        user = models.User(
            email="admin@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="Admin User",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Created user: {user.email}")
        
        # Create a sample PG
        pg = models.PG(
            owner_id=user.id,
            name="Sunrise PG",
            address="123 Main St",
            city="Pune"
        )
        db.add(pg)
        db.commit()
        db.refresh(pg)
        logger.info(f"Created PG: {pg.name}")

        # Create Rooms
        for floor in range(1, 3):
            for r_num in range(1, 4):
                room = models.Room(
                    pg_id=pg.id,
                    room_number=f"{floor}0{r_num}",
                    floor=floor,
                    type="Double"
                )
                db.add(room)
                db.commit()
                db.refresh(room)
                
                # Create Beds
                for b_char in ['A', 'B']:
                    bed = models.Bed(
                        room_id=room.id,
                        bed_number=f"{room.room_number}-{b_char}",
                        monthly_price=5000.0
                    )
                    db.add(bed)
        
        db.commit()
        logger.info("Initialized sample data")
    else:
        logger.info("Sample data already initialized")

if __name__ == "__main__":
    logger.info("Creating initial data")
    init()
    logger.info("Initial data created")
