"""Shared request and response shapes."""

from typing import Literal

from pydantic import BaseModel, Field, model_validator

# Keep the frontend and backend using the same amenity keys.
Amenity = Literal[
    "washer_dryer",
    "dishwasher",
    "air_conditioning",
    "parking",
    "gym",
    "pool",
    "pet_friendly",
]


class BudgetRequest(BaseModel):
    income_type: Literal["annual", "hourly"] = "annual"
    annual_income: float | None = Field(default=None, ge=0)
    hourly_rate: float | None = Field(default=None, ge=0)
    hours_per_week: float | None = Field(default=None, gt=0, le=168)
    state: str = Field(min_length=2, max_length=2)
    rent_ratio: float = Field(default=0.3, gt=0.05, le=0.6)

    @model_validator(mode="after")
    def validate_income_fields(self) -> "BudgetRequest":
        # Only one income path should be required at a time.
        if self.income_type == "annual" and self.annual_income is None:
            raise ValueError("annual_income is required when income_type is 'annual'")
        if self.income_type == "hourly":
            if self.hourly_rate is None:
                raise ValueError("hourly_rate is required when income_type is 'hourly'")
            if self.hours_per_week is None:
                raise ValueError("hours_per_week is required when income_type is 'hourly'")
        return self


class TaxBreakdown(BaseModel):
    federal_tax: float
    fica_tax: float
    state_tax: float
    total_tax: float


class BudgetResponse(BaseModel):
    gross_annual_income: float
    net_annual_income: float
    net_monthly_income: float
    recommended_max_rent: float
    comfortable_rent_range_min: float
    comfortable_rent_range_max: float
    state_tax_rate: float
    tax_breakdown: TaxBreakdown


class Listing(BaseModel):
    # This matches the sample data shape for now.
    id: str
    title: str
    city: str
    state: str
    monthly_rent: float
    bedrooms: int
    bathrooms: float
    amenities: list[Amenity]
    neighborhood: str
    image_url: str
    listing_url: str


class ApartmentSearchRequest(BaseModel):
    # Filters stay simple until a real API replaces the sample data.
    max_monthly_rent: float = Field(gt=0)
    city: str | None = None
    state: str | None = Field(default=None, min_length=2, max_length=2)
    min_bedrooms: int = Field(default=0, ge=0)
    min_bathrooms: float = Field(default=0, ge=0)
    required_amenities: list[Amenity] = Field(default_factory=list)


class ApartmentSearchResponse(BaseModel):
    matches: list[Listing]
    total_matches: int
