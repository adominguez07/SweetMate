// Keep API calls in one place.
const API_BASE_URL = "http://localhost:8000/api";

export type IncomeType = "annual" | "hourly";
export type Amenity =
  | "washer_dryer"
  | "dishwasher"
  | "air_conditioning"
  | "parking"
  | "gym"
  | "pool"
  | "pet_friendly";

export type BudgetRequest = {
  income_type: IncomeType;
  annual_income?: number;
  hourly_rate?: number;
  hours_per_week?: number;
  state: string;
  rent_ratio: number;
};

export type BudgetResponse = {
  gross_annual_income: number;
  net_annual_income: number;
  net_monthly_income: number;
  recommended_max_rent: number;
  comfortable_rent_range_min: number;
  comfortable_rent_range_max: number;
  state_tax_rate: number;
  tax_breakdown: {
    federal_tax: number;
    fica_tax: number;
    state_tax: number;
    total_tax: number;
  };
};

export type ApartmentSearchRequest = {
  max_monthly_rent: number;
  city?: string;
  state?: string;
  min_bedrooms: number;
  min_bathrooms: number;
  required_amenities: Amenity[];
};

export type Listing = {
  id: string;
  title: string;
  city: string;
  state: string;
  monthly_rent: number;
  bedrooms: number;
  bathrooms: number;
  amenities: Amenity[];
  neighborhood: string;
  image_url: string;
  listing_url: string;
};

export type ApartmentSearchResponse = {
  matches: Listing[];
  total_matches: number;
};

async function request<T>(path: string, body: unknown): Promise<T> {
  // All POST calls share this wrapper.
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function calculateBudget(payload: BudgetRequest) {
  // Budget route.
  return request<BudgetResponse>("/budget/calculate", payload);
}

export function searchApartments(payload: ApartmentSearchRequest) {
  // Search route.
  return request<ApartmentSearchResponse>("/apartments/search", payload);
}
