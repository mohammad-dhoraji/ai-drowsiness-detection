from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class LinkGuardianRequest(BaseModel):
    guardian_email: str = Field(..., min_length=5, max_length=255)

    @field_validator("guardian_email")
    @classmethod
    def validate_guardian_email(cls, value: str) -> str:
        email = value.strip().lower()
        if "@" not in email or email.startswith("@") or email.endswith("@"):
            raise ValueError("guardian_email must be a valid email address")
        return email


class GuardianSummary(BaseModel):
    id: UUID
    name: str | None = None
    email: str
    linked_at: datetime | None = None


class DriverSummary(BaseModel):
    id: UUID
    name: str | None = None
    email: str
    linked_at: datetime | None = None


class LinkGuardianResponse(BaseModel):
    message: str
    link_id: int
    guardian: GuardianSummary


class MyGuardiansResponse(BaseModel):
    guardians: list[GuardianSummary]


class MyDriversResponse(BaseModel):
    drivers: list[DriverSummary]
