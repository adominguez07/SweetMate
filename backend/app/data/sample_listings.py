"""Generated sample listings for local search."""

# One anchor city per state keeps the fake data predictable.
STATE_MARKETS = {
    "AL": ("Birmingham", "Highland"),
    "AK": ("Anchorage", "Midtown"),
    "AZ": ("Phoenix", "Downtown"),
    "AR": ("Little Rock", "River Market"),
    "CA": ("San Diego", "North Park"),
    "CO": ("Denver", "Capitol Hill"),
    "CT": ("Hartford", "West End"),
    "DC": ("Washington", "Capitol Hill"),
    "DE": ("Wilmington", "Trolley Square"),
    "FL": ("Miami", "Brickell"),
    "GA": ("Atlanta", "Midtown"),
    "HI": ("Honolulu", "Kakaako"),
    "IA": ("Des Moines", "East Village"),
    "ID": ("Boise", "North End"),
    "IL": ("Chicago", "Lakeview"),
    "IN": ("Indianapolis", "Broad Ripple"),
    "KS": ("Overland Park", "Downtown"),
    "KY": ("Louisville", "NuLu"),
    "LA": ("New Orleans", "Warehouse District"),
    "MA": ("Boston", "Jamaica Plain"),
    "MD": ("Baltimore", "Canton"),
    "ME": ("Portland", "West End"),
    "MI": ("Detroit", "Midtown"),
    "MN": ("Minneapolis", "North Loop"),
    "MO": ("Kansas City", "Crossroads"),
    "MS": ("Jackson", "Fondren"),
    "MT": ("Bozeman", "Downtown"),
    "NC": ("Raleigh", "North Hills"),
    "ND": ("Fargo", "Downtown"),
    "NE": ("Omaha", "Blackstone"),
    "NH": ("Manchester", "North End"),
    "NJ": ("Jersey City", "Journal Square"),
    "NM": ("Albuquerque", "Nob Hill"),
    "NV": ("Las Vegas", "Summerlin"),
    "NY": ("Buffalo", "Elmwood Village"),
    "OH": ("Columbus", "Short North"),
    "OK": ("Oklahoma City", "Midtown"),
    "OR": ("Portland", "Pearl District"),
    "PA": ("Pittsburgh", "Shadyside"),
    "RI": ("Providence", "Federal Hill"),
    "SC": ("Charleston", "West Ashley"),
    "SD": ("Sioux Falls", "Downtown"),
    "TN": ("Nashville", "The Gulch"),
    "TX": ("Austin", "South Lamar"),
    "UT": ("Salt Lake City", "Sugar House"),
    "VA": ("Richmond", "Scott's Addition"),
    "VT": ("Burlington", "South End"),
    "WA": ("Seattle", "Capitol Hill"),
    "WI": ("Milwaukee", "Third Ward"),
    "WV": ("Charleston", "East End"),
    "WY": ("Cheyenne", "Downtown"),
}

# Reuse a few layouts so every state gets the same shape.
LISTING_TEMPLATES = [
    {
        "slug": "studio",
        "title_suffix": "Studio",
        "monthly_rent": 1280,
        "bedrooms": 1,
        "bathrooms": 1.0,
        "amenities": ["washer_dryer", "dishwasher", "air_conditioning"],
        "image_url": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
    },
    {
        "slug": "one-bedroom",
        "title_suffix": "Corner One Bedroom",
        "monthly_rent": 1495,
        "bedrooms": 1,
        "bathrooms": 1.0,
        "amenities": ["dishwasher", "parking", "pet_friendly"],
        "image_url": "https://images.unsplash.com/photo-1484154218962-a197022b5858",
    },
    {
        "slug": "two-bedroom",
        "title_suffix": "Modern Two Bedroom",
        "monthly_rent": 1825,
        "bedrooms": 2,
        "bathrooms": 2.0,
        "amenities": ["washer_dryer", "dishwasher", "parking", "gym"],
        "image_url": "https://images.unsplash.com/photo-1494526585095-c41746248156",
    },
    {
        "slug": "loft",
        "title_suffix": "Loft",
        "monthly_rent": 1710,
        "bedrooms": 1,
        "bathrooms": 1.0,
        "amenities": ["air_conditioning", "gym", "parking"],
        "image_url": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
    },
    {
        "slug": "family",
        "title_suffix": "Family Layout",
        "monthly_rent": 2090,
        "bedrooms": 3,
        "bathrooms": 2.0,
        "amenities": ["washer_dryer", "dishwasher", "parking", "pet_friendly", "pool"],
        "image_url": "https://images.unsplash.com/photo-1460317442991-0ec209397118",
    },
]

# Small rent bumps help the states feel less identical.
STATE_PRICE_ADJUSTMENTS = {
    "AK": 220,
    "CA": 520,
    "CO": 210,
    "CT": 240,
    "DC": 480,
    "DE": 90,
    "FL": 180,
    "GA": 120,
    "HI": 560,
    "IL": 180,
    "MA": 430,
    "MD": 260,
    "ME": 110,
    "MN": 120,
    "MT": 140,
    "NC": 95,
    "NH": 140,
    "NJ": 420,
    "NV": 170,
    "NY": 500,
    "OR": 260,
    "PA": 130,
    "RI": 180,
    "SC": 70,
    "TN": 90,
    "TX": 130,
    "UT": 160,
    "VA": 175,
    "VT": 150,
    "WA": 320,
    "WI": 80,
    "WY": 60,
}

# Simple neighborhood suffixes are enough here.
NEIGHBORHOOD_VARIANTS = [
    "Central",
    "Heights",
    "Station",
    "Commons",
    "District",
]


def build_sample_listings() -> list[dict]:
    # Generate everything from the template pieces above.
    listings: list[dict] = []

    for state, (city, base_neighborhood) in STATE_MARKETS.items():
        state_adjustment = STATE_PRICE_ADJUSTMENTS.get(state, 0)

        for index, template in enumerate(LISTING_TEMPLATES, start=1):
            neighborhood = f"{base_neighborhood} {NEIGHBORHOOD_VARIANTS[index - 1]}"
            monthly_rent = template["monthly_rent"] + state_adjustment + ((index - 1) * 55)
            listing_id = f"{state.lower()}-{template['slug']}-{index}"

            # Keep ids stable so links stay predictable.
            listings.append(
                {
                    "id": listing_id,
                    "title": f"{city} {template['title_suffix']}",
                    "city": city,
                    "state": state,
                    "monthly_rent": monthly_rent,
                    "bedrooms": template["bedrooms"],
                    "bathrooms": template["bathrooms"],
                    "amenities": template["amenities"],
                    "neighborhood": neighborhood,
                    "image_url": template["image_url"],
                    "listing_url": f"https://example.com/listings/{listing_id}",
                }
            )

    return listings


# Build once at import time.
SAMPLE_LISTINGS = build_sample_listings()
