# Import all the models, so that Base has them before being
# imported by Alembic or used by main
from app.db.base_class import Base  # noqa
from app.models.user import User  # noqa
from app.models.pg_structure import PG, Room, Bed  # noqa
from app.models.tenant_management import Tenant, RentRecord  # noqa
