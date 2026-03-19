# SweetMate

SweetMate is a full-stack relocation budgeting app. It helps users estimate take-home income after federal, FICA, and state taxes, figure out a realistic rent ceiling, and then search apartment listings that fit that budget.

## What it does

- Supports `annual salary` and `hourly pay + hours per week`
- Supports `solo` and `household` budgeting modes
- Lets household users split rent by custom percentages
- Suggests a fair split based on each person's net monthly income
- Shows an individual summary for each contributor
- Separates the UI into a `Budgeting` tab and an `Apartment Search` tab
- Filters listings by state, city, beds, baths, and amenities

## Stack

- Backend: FastAPI
- Frontend: React + TypeScript + Vite
- Data: generated sample apartment listings

## Project shape

- [backend/app/main.py](c:\Users\AEDom\OneDrive\Desktop\Personal Projects\SweetMate\backend\app\main.py)
  Main API entrypoint
- [backend/app/services/budget.py](c:\Users\AEDom\OneDrive\Desktop\Personal Projects\SweetMate\backend\app\services\budget.py)
  Budget and tax calculations
- [backend/app/services/listings.py](c:\Users\AEDom\OneDrive\Desktop\Personal Projects\SweetMate\backend\app\services\listings.py)
  Apartment filtering for the sample data
- [backend/app/data/sample_listings.py](c:\Users\AEDom\OneDrive\Desktop\Personal Projects\SweetMate\backend\app\data\sample_listings.py)
  Generated sample listings for every state
- [frontend/src/App.tsx](c:\Users\AEDom\OneDrive\Desktop\Personal Projects\SweetMate\frontend\src\App.tsx)
  Main app UI and page flow
- [frontend/src/styles.css](c:\Users\AEDom\OneDrive\Desktop\Personal Projects\SweetMate\frontend\src\styles.css)
  App styling and tab-based color themes

## Virtual environment

A local virtual environment already exists at `.venv`.

Activate it in PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

## Backend setup

```powershell
cd backend
../.venv/Scripts/python.exe -m pip install -r requirements.txt
../.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
```

## Frontend setup

Use `npm.cmd` on Windows if PowerShell blocks `npm.ps1`:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

The frontend expects the backend at `http://localhost:8000`.

## Current API routes

- `GET /api/health`
- `POST /api/budget/calculate`
- `POST /api/apartments/search`

## Sample listing data

The app currently uses generated sample data instead of a real apartment API.

- Each state, plus `DC`, gets `5` sample listings
- The sample data is generated in [backend/app/data/sample_listings.py](c:\Users\AEDom\OneDrive\Desktop\Personal Projects\SweetMate\backend\app\data\sample_listings.py)
- Listing search is still shaped like a real API-backed flow, so it can be swapped later

## Notes for real listing APIs

When you're ready, the sample listing service can be replaced with a real provider such as RentCast, Realtor-compatible feeds, Zillow-compatible feeds, or a RapidAPI-based apartment source while keeping the same frontend flow.

## Current assumptions

- Tax math uses rough effective-rate estimates for the first pass
- State tax rates are stored in [backend/app/data/state_tax.py](c:\Users\AEDom\OneDrive\Desktop\Personal Projects\SweetMate\backend\app\data\state_tax.py)
- Listing results are filtered in memory from the generated sample dataset
