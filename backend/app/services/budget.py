"""Budget math helpers."""

from app.data.state_tax import STATE_TAX_RATES
from app.models import BudgetRequest, BudgetResponse, TaxBreakdown


# Rough placeholders for now.
FEDERAL_EFFECTIVE_RATE = 0.12
FICA_RATE = 0.0765


def _gross_income(payload: BudgetRequest) -> float:
    # Annual stays direct. Hourly gets annualized.
    if payload.income_type == "annual":
        return float(payload.annual_income or 0)
    return float((payload.hourly_rate or 0) * (payload.hours_per_week or 0) * 52)


def calculate_budget(payload: BudgetRequest) -> BudgetResponse:
    # Pull the state code into a safe format first.
    gross_income = _gross_income(payload)
    state = payload.state.upper()
    state_tax_rate = STATE_TAX_RATES.get(state, 0.0)

    # Keep the tax math easy to swap later.
    federal_tax = gross_income * FEDERAL_EFFECTIVE_RATE
    fica_tax = gross_income * FICA_RATE
    state_tax = gross_income * state_tax_rate
    total_tax = federal_tax + fica_tax + state_tax

    net_annual_income = max(gross_income - total_tax, 0)
    net_monthly_income = net_annual_income / 12
    recommended_max_rent = net_monthly_income * payload.rent_ratio

    # Round here so the UI gets clean numbers.
    return BudgetResponse(
        gross_annual_income=round(gross_income, 2),
        net_annual_income=round(net_annual_income, 2),
        net_monthly_income=round(net_monthly_income, 2),
        recommended_max_rent=round(recommended_max_rent, 2),
        comfortable_rent_range_min=round(recommended_max_rent * 0.85, 2),
        comfortable_rent_range_max=round(recommended_max_rent, 2),
        state_tax_rate=round(state_tax_rate, 4),
        tax_breakdown=TaxBreakdown(
            federal_tax=round(federal_tax, 2),
            fica_tax=round(fica_tax, 2),
            state_tax=round(state_tax, 2),
            total_tax=round(total_tax, 2),
        ),
    )
