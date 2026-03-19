"""Listing filters for the sample dataset."""

from app.data.sample_listings import SAMPLE_LISTINGS
from app.models import ApartmentSearchRequest, ApartmentSearchResponse, Listing


def search_listings(payload: ApartmentSearchRequest) -> ApartmentSearchResponse:
    # Build matches in memory for now.
    matches: list[Listing] = []

    for raw_listing in SAMPLE_LISTINGS:
        listing = Listing(**raw_listing)

        # Skip anything outside the current filters.
        if listing.monthly_rent > payload.max_monthly_rent:
            continue
        if payload.city and listing.city.lower() != payload.city.lower():
            continue
        if payload.state and listing.state.upper() != payload.state.upper():
            continue
        if listing.bedrooms < payload.min_bedrooms:
            continue
        if listing.bathrooms < payload.min_bathrooms:
            continue
        if any(amenity not in listing.amenities for amenity in payload.required_amenities):
            continue

        matches.append(listing)

    # Cheapest first feels best for this UI.
    matches.sort(key=lambda item: item.monthly_rent)
    return ApartmentSearchResponse(matches=matches, total_matches=len(matches))
