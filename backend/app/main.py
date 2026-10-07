"""
The FastAPI app.

At startup the model is loaded once and stored in app.state.predictor.
If loading fails, the server still starts: /health says the model is not
loaded and the model endpoints answer 503.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.api.v1.endpoints import health
from app.core.config import settings
from app.core.logging import get_logger, setup_logging
from app.services.model_loader import create_session, get_model_path, load_model_info
from app.services.predictor import Predictor

logger = get_logger("main")


def load_predictor() -> Predictor | None:
    """Load the model from settings.models_dir, or None if that fails."""

    try:
        info = load_model_info(settings.models_dir)
        session = create_session(get_model_path(settings.models_dir))
    except (FileNotFoundError, ValueError, RuntimeError) as error:
        logger.error("Model not loaded: %s", error)
        return None

    logger.info(
        "Model loaded: %s (conf_threshold %s)", info.run_name, info.conf_threshold
    )
    return Predictor(session, info)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Code before yield runs at startup, code after yield at shutdown."""

    setup_logging()
    app.state.predictor = load_predictor()
    yield


app = FastAPI(title="Pilltally API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(api_router, prefix="/api/v1")
