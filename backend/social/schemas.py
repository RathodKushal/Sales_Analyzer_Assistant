"""
Social Schemas — Pydantic Models
====================================
Request and response schemas for AI content generation endpoints.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# ── Request Schemas ──────────────────────────────────────────

class ContentRequest(BaseModel):
    """Request schema for social media content generation."""
    product_category: str = Field(..., examples=["Technology"])
    campaign_type: str = Field(
        ...,
        description="Type of campaign: product_launch, seasonal_sale, brand_awareness, flash_deal",
        examples=["product_launch"],
    )
    tone: Optional[str] = Field(
        default="professional",
        description="Tone of voice: professional, casual, excited, urgent",
        examples=["professional"],
    )
    platform: Optional[str] = Field(
        default="linkedin",
        description="Target platform: linkedin, twitter, instagram, facebook",
        examples=["linkedin"],
    )
    additional_context: Optional[str] = Field(
        default=None,
        description="Extra context or instructions for the AI",
        examples=["Focus on back-to-school season"],
    )


class ImageRequest(BaseModel):
    """Request schema for marketing image generation."""
    prompt: str = Field(
        ...,
        description="Text prompt describing the desired image",
        examples=["Modern office setup with technology products"],
    )
    style: Optional[str] = Field(
        default="photorealistic",
        description="Image style: photorealistic, illustration, minimalist, vibrant",
        examples=["photorealistic"],
    )


# ── Response Schemas ─────────────────────────────────────────

class ContentResponse(BaseModel):
    """Response for generated social media content."""
    status: str = "success"
    platform: str
    campaign_type: str
    generated_content: str
    hashtags: list[str] = []
    character_count: int
    generated_at: datetime
    is_mock: bool = Field(
        default=False,
        description="True if content was generated using mock (no API key)",
    )


class ImageResponse(BaseModel):
    """Response for generated marketing image."""
    status: str = "success"
    prompt: str
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    message: str
    generated_at: datetime
    is_mock: bool = False


class ContentHistoryItem(BaseModel):
    """A single item in the content generation history."""
    id: int
    platform: str
    campaign_type: str
    content_preview: str
    generated_at: datetime


class ContentHistoryResponse(BaseModel):
    """Response listing content generation history."""
    items: list[ContentHistoryItem]
    total: int
