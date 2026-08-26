"""
Social Service — Gemini AI Content Generation
=================================================
Generates social media marketing content and images using
the Google Gemini API. Falls back to mock content if no API key is set.
"""

from datetime import datetime, timezone
from typing import Optional

from backend.config import get_settings


# ── In-memory history (simple demo storage) ──────────────────
_content_history: list[dict] = []
_next_id: int = 1


class GeminiService:
    """
    Service for generating social media content using Google Gemini.
    
    If GEMINI_API_KEY is not configured, falls back to high-quality
    mock content for demonstration purposes.
    """

    def __init__(self):
        self.settings = get_settings()
        self._model = None
        self._is_available = False
        self._init_client()

    def _init_client(self):
        """Initialize the Gemini client if an API key is available."""
        if not self.settings.GEMINI_API_KEY:
            print("[GeminiService] No API key configured — using mock mode")
            return

        try:
            import google.generativeai as genai
            genai.configure(api_key=self.settings.GEMINI_API_KEY)
            self._model = genai.GenerativeModel("gemini-1.5-flash")
            self._is_available = True
            print("[GeminiService] Gemini API initialized successfully")
        except Exception as e:
            print(f"[GeminiService] Failed to initialize Gemini: {e}")
            self._is_available = False

    def generate_content(
        self,
        product_category: str,
        campaign_type: str,
        tone: str = "professional",
        platform: str = "linkedin",
        additional_context: Optional[str] = None,
    ) -> dict:
        """
        Generate social media marketing content.
        
        Returns dict with generated_content, hashtags, etc.
        """
        global _content_history, _next_id

        if self._is_available:
            result = self._generate_with_gemini(
                product_category, campaign_type, tone, platform, additional_context
            )
        else:
            result = self._generate_mock_content(
                product_category, campaign_type, tone, platform
            )

        # Store in history
        _content_history.append({
            "id": _next_id,
            "platform": platform,
            "campaign_type": campaign_type,
            "content_preview": result["generated_content"][:100] + "...",
            "generated_at": result["generated_at"],
        })
        _next_id += 1

        return result

    def generate_image(
        self,
        prompt: str,
        style: str = "photorealistic",
    ) -> dict:
        """
        Generate a marketing image description/concept.
        
        Note: Gemini 1.5 Flash doesn't generate images directly,
        so we generate a detailed image concept/description instead.
        """
        now = datetime.now(timezone.utc)

        if self._is_available:
            try:
                image_prompt = (
                    f"Create a detailed visual concept description for a marketing image. "
                    f"Style: {style}. Description: {prompt}. "
                    f"Describe the composition, colors, lighting, and key elements "
                    f"that would make this image compelling for social media marketing."
                )
                response = self._model.generate_content(image_prompt)
                return {
                    "status": "success",
                    "prompt": prompt,
                    "image_url": None,
                    "image_base64": None,
                    "message": response.text,
                    "generated_at": now,
                    "is_mock": False,
                }
            except Exception as e:
                return {
                    "status": "error",
                    "prompt": prompt,
                    "image_url": None,
                    "image_base64": None,
                    "message": f"Gemini API error: {str(e)}",
                    "generated_at": now,
                    "is_mock": False,
                }

        # Mock image response
        return {
            "status": "success",
            "prompt": prompt,
            "image_url": None,
            "image_base64": None,
            "message": (
                f"📸 Image Concept: {prompt}\n\n"
                f"Style: {style}\n\n"
                f"Visual Description: A stunning {style} composition featuring "
                f"the described scene with professional lighting, balanced composition, "
                f"and a color palette that evokes trust and innovation. "
                f"The image would work perfectly as a social media header or "
                f"promotional banner.\n\n"
                f"Note: Set GEMINI_API_KEY in .env to enable AI-powered image concepts."
            ),
            "generated_at": now,
            "is_mock": True,
        }

    def get_history(self) -> dict:
        """Return the content generation history."""
        return {
            "items": list(reversed(_content_history)),
            "total": len(_content_history),
        }

    def _generate_with_gemini(
        self,
        product_category: str,
        campaign_type: str,
        tone: str,
        platform: str,
        additional_context: Optional[str],
    ) -> dict:
        """Generate content using the real Gemini API."""
        now = datetime.now(timezone.utc)

        platform_guidelines = {
            "linkedin": "Professional tone, 1300 character max, use line breaks for readability",
            "twitter": "Concise, 280 character max, punchy and engaging",
            "instagram": "Visual storytelling, use emojis, 2200 character max",
            "facebook": "Conversational, 500-1000 characters, encourage engagement",
        }

        prompt = (
            f"You are an expert social media marketing copywriter. "
            f"Generate a {platform} post for a {campaign_type.replace('_', ' ')} campaign.\n\n"
            f"Product Category: {product_category}\n"
            f"Tone: {tone}\n"
            f"Platform Guidelines: {platform_guidelines.get(platform, 'General social media post')}\n"
        )

        if additional_context:
            prompt += f"Additional Context: {additional_context}\n"

        prompt += (
            "\nProvide:\n"
            "1. The complete post text\n"
            "2. A list of 5 relevant hashtags (just the hashtags, one per line)\n\n"
            "Format your response as:\n"
            "POST:\n[your post here]\n\nHASHTAGS:\n[hashtags here]"
        )

        try:
            response = self._model.generate_content(prompt)
            text = response.text

            # Parse response
            content = text
            hashtags = []
            if "HASHTAGS:" in text:
                parts = text.split("HASHTAGS:")
                content = parts[0].replace("POST:", "").strip()
                hashtag_text = parts[1].strip()
                hashtags = [
                    tag.strip()
                    for tag in hashtag_text.split("\n")
                    if tag.strip().startswith("#")
                ]

            return {
                "status": "success",
                "platform": platform,
                "campaign_type": campaign_type,
                "generated_content": content,
                "hashtags": hashtags,
                "character_count": len(content),
                "generated_at": now,
                "is_mock": False,
            }
        except Exception as e:
            return {
                "status": "error",
                "platform": platform,
                "campaign_type": campaign_type,
                "generated_content": f"Error generating content: {str(e)}",
                "hashtags": [],
                "character_count": 0,
                "generated_at": now,
                "is_mock": False,
            }

    def _generate_mock_content(
        self,
        product_category: str,
        campaign_type: str,
        tone: str,
        platform: str,
    ) -> dict:
        """Generate high-quality mock content for demo purposes."""
        now = datetime.now(timezone.utc)

        templates = {
            "product_launch": {
                "linkedin": (
                    f"🚀 Exciting News! We're thrilled to announce our latest {product_category} lineup.\n\n"
                    f"After months of research and development, our team has created solutions "
                    f"that will transform how your business operates.\n\n"
                    f"Key highlights:\n"
                    f"✅ Industry-leading performance\n"
                    f"✅ Competitive pricing with smart discount optimization\n"
                    f"✅ Backed by AI-driven analytics\n\n"
                    f"Ready to elevate your {product_category.lower()} game? "
                    f"Contact our sales team today for a personalized demo.\n\n"
                    f"#Innovation #BusinessGrowth"
                ),
                "twitter": (
                    f"🚀 NEW: Our latest {product_category} products are here! "
                    f"AI-optimized pricing, unmatched quality. "
                    f"Check them out → #NewLaunch #{product_category.replace(' ', '')}"
                ),
            },
            "seasonal_sale": {
                "linkedin": (
                    f"📣 Seasonal Sale Alert!\n\n"
                    f"Take advantage of our AI-optimized pricing on {product_category} products. "
                    f"Our smart discount engine ensures you get the best value while we maintain "
                    f"the quality you trust.\n\n"
                    f"🔥 Limited time offers\n"
                    f"📊 Data-driven deals\n"
                    f"💡 Smart savings\n\n"
                    f"Don't miss out — shop now!"
                ),
                "twitter": (
                    f"🔥 SALE: Big savings on {product_category}! "
                    f"Our AI picks the best deals so you save more. "
                    f"Shop now! #Sale #{product_category.replace(' ', '')}"
                ),
            },
        }

        # Get template or default
        campaign_templates = templates.get(campaign_type, templates["product_launch"])
        content = campaign_templates.get(platform, campaign_templates.get("linkedin", ""))

        # Default fallback
        if not content:
            content = (
                f"Discover the best in {product_category}! "
                f"Our AI-powered platform finds optimal pricing for maximum value. "
                f"Contact us to learn more about our {campaign_type.replace('_', ' ')} offerings."
            )

        hashtags = [
            f"#{product_category.replace(' ', '')}",
            "#SalesAnalyzer",
            "#AIpowered",
            f"#{campaign_type.replace('_', '').title()}",
            "#SmartBusiness",
        ]

        return {
            "status": "success",
            "platform": platform,
            "campaign_type": campaign_type,
            "generated_content": content,
            "hashtags": hashtags,
            "character_count": len(content),
            "generated_at": now,
            "is_mock": True,
        }


# ── Singleton ────────────────────────────────────────────────
_gemini_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """Get or create the singleton GeminiService."""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
