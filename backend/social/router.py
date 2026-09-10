"""
Social Router — AI Content Generation
=========================================
Endpoints for generating social media marketing content and images
using the Google Gemini API (with mock fallback).
"""

from fastapi import APIRouter, Depends

from backend.auth.models import User
from backend.auth.utils import get_current_user
from backend.social.service import get_gemini_service, GeminiService
from backend.social.schemas import (
    ContentRequest,
    ContentResponse,
    ImageRequest,
    ImageResponse,
    ContentHistoryResponse,
)

router = APIRouter(prefix="/api/social", tags=["Social Media AI"])


def get_service() -> GeminiService:
    """FastAPI dependency — returns the singleton GeminiService."""
    return get_gemini_service()


@router.post(
    "/generate-content",
    response_model=ContentResponse,
    summary="Generate social media text content",
)
def generate_content(
    payload: ContentRequest,
    _user: User = Depends(get_current_user),
    service: GeminiService = Depends(get_service),
):
    """
    Generate social media marketing content using AI.

    Provide a product category, campaign type, tone, and target platform.
    If a Gemini API key is configured, uses the real API.
    Otherwise, returns high-quality mock content for demonstration.
    """
    result = service.generate_content(
        product_category=payload.product_category,
        campaign_type=payload.campaign_type,
        tone=payload.tone or "professional",
        platform=payload.platform or "linkedin",
        additional_context=payload.additional_context,
    )
    return ContentResponse(**result)


@router.post(
    "/generate-image",
    response_model=ImageResponse,
    summary="Generate a marketing image concept",
)
def generate_image(
    payload: ImageRequest,
    _user: User = Depends(get_current_user),
    service: GeminiService = Depends(get_service),
):
    """
    Generate a marketing image concept/description using AI.

    Provide a text prompt and optional style preference.
    Returns a detailed visual concept that can guide image creation.
    """
    result = service.generate_image(
        prompt=payload.prompt,
        style=payload.style or "photorealistic",
    )
    return ImageResponse(**result)


@router.get(
    "/history",
    response_model=ContentHistoryResponse,
    summary="Get content generation history",
)
def get_history(
    _user: User = Depends(get_current_user),
    service: GeminiService = Depends(get_service),
):
    """List previously generated social media content in this session."""
    return ContentHistoryResponse(**service.get_history())
