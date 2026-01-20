from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine.url import make_url
import os

from app.core.config import settings

# Parse the DATABASE_URL to handle special characters in passwords
database_url = make_url(settings.DATABASE_URL)

# Determine if we're in production (Supabase requires SSL)
is_production = os.getenv("ENV", "development") == "production"

# Configure connection arguments for Supabase
connect_args = {}
if is_production:
    # Supabase requires SSL
    connect_args = {
        "sslmode": "require",
        "connect_timeout": 10,
    }

engine = create_engine(
    database_url, 
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=5 if is_production else 10,
    max_overflow=10 if is_production else 20,
    pool_recycle=300,  # Recycle connections after 5 minutes (Supabase recommendation)
    connect_args=connect_args,
    echo=False,  # Set to True for SQL debugging
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
