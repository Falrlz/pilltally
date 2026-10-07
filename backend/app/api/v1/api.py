"""Collect all /api/v1 endpoints in one router."""

from fastapi import APIRouter

from app.api.v1.endpoints import model, predict

api_router = APIRouter()

api_router.include_router(model.router, tags=["Model"])
api_router.include_router(predict.router, tags=["Predict"])
