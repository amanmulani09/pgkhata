from fastapi import APIRouter

from app.api.v1.endpoints import login, users, pgs, tenants, rents

api_router = APIRouter()

api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(pgs.router, prefix="/pgs", tags=["pgs"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(rents.router, prefix="/rents", tags=["rents"])
