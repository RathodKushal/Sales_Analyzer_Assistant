"""
System Setting Model — SQLAlchemy ORM
=====================================
Stores dynamically configurable platform settings.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from backend.database import Base


class SystemSetting(Base):
    """Dynamically configurable platform parameters."""

    __tablename__ = "system_settings"

    key = Column(String(100), primary_key=True, index=True)
    value = Column(String(1000), nullable=False)
    category = Column(String(50), default="general", index=True)  # general, security, analytics, notifications
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<SystemSetting(key='{self.key}', value='{self.value}', category='{self.category}')>"
