"""Main API entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models import ApartmentSearchRequest, ApartmentSearchResponse, BudgetRequest, BudgetResponse
from app.services.budget import calculate_budget
from app.services.listings import search_listings

app = FastAPI(
    title="SweetMate API",
    description="Budgeting and apartment search support for relocation planning.",
    version="0.1.0",
)

# Let the local Vite app talk to the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/budget/calculate", response_model=BudgetResponse)
def budget_calculator(payload: BudgetRequest) -> BudgetResponse:
    # Keep the route thin.
    return calculate_budget(payload)


@app.post("/api/apartments/search", response_model=ApartmentSearchResponse)
def apartment_search(payload: ApartmentSearchRequest) -> ApartmentSearchResponse:
    # Same idea here.
    return search_listings(payload)
