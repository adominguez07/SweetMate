import type { Amenity } from "./api";

// Use short state codes in the selects.
export const STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DC", "DE", "FL", "GA", "HI",
  "IA", "ID", "IL", "IN", "KS", "KY", "LA", "MA", "MD", "ME", "MI", "MN",
  "MO", "MS", "MT", "NC", "ND", "NE", "NH", "NJ", "NM", "NV", "NY", "OH",
  "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VA", "VT", "WA",
  "WI", "WV", "WY",
];

// Keep labels nicer than the raw keys.
export const AMENITY_OPTIONS: { value: Amenity; label: string }[] = [
  { value: "washer_dryer", label: "Washer / Dryer" },
  { value: "dishwasher", label: "Dishwasher" },
  { value: "air_conditioning", label: "Air Conditioning" },
  { value: "parking", label: "Parking" },
  { value: "gym", label: "Gym" },
  { value: "pool", label: "Pool" },
  { value: "pet_friendly", label: "Pet Friendly" },
];
