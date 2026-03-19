// Main app screen.
import { FormEvent, useMemo, useState } from "react";
import {
  Amenity,
  ApartmentSearchRequest,
  BudgetRequest,
  BudgetResponse,
  Listing,
  calculateBudget,
  searchApartments,
} from "./api";
import { AMENITY_OPTIONS, STATES } from "./constants";

type PlannerMode = "solo" | "household";
type WorkspaceTab = "budgeting" | "search";
type IncomeType = "annual" | "hourly";

type ContributorForm = {
  id: number;
  name: string;
  incomeType: IncomeType;
  annualIncome: string;
  hourlyRate: string;
  hoursPerWeek: string;
  rentShare: string;
};

type ContributorBudget = {
  id: number;
  name: string;
  rentSharePercent: number;
  budget: BudgetResponse;
  assignedContribution: number;
  fairSharePercent: number;
  fairContribution: number;
  monthlyLeftAfterAssignedRent: number;
};

type HouseholdBudgetResult = {
  totalNetAnnualIncome: number;
  totalNetMonthlyIncome: number;
  recommendedMaxRent: number;
  comfortableRentRangeMin: number;
  comfortableRentRangeMax: number;
  totalEstimatedTaxes: number;
  contributors: ContributorBudget[];
};

// Keep money formatting in one place.
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const percent = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

function createContributor(id: number, name: string, rentShare: string): ContributorForm {
  // New household rows start here.
  return {
    id,
    name,
    incomeType: "annual",
    annualIncome: "",
    hourlyRate: "",
    hoursPerWeek: "40",
    rentShare,
  };
}

function getContributorBudgetRequest(
  contributor: ContributorForm,
  state: string,
  rentRatio: number,
): BudgetRequest {
  // Convert the form shape into the API shape.
  return {
    income_type: contributor.incomeType,
    annual_income: contributor.incomeType === "annual" ? Number(contributor.annualIncome || 0) : undefined,
    hourly_rate: contributor.incomeType === "hourly" ? Number(contributor.hourlyRate || 0) : undefined,
    hours_per_week: contributor.incomeType === "hourly" ? Number(contributor.hoursPerWeek || 0) : undefined,
    state,
    rent_ratio: rentRatio,
  };
}

function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("budgeting");
  const [plannerMode, setPlannerMode] = useState<PlannerMode>("solo");
  const [incomeType, setIncomeType] = useState<IncomeType>("annual");
  const [annualIncome, setAnnualIncome] = useState("85000");
  const [hourlyRate, setHourlyRate] = useState("28");
  const [hoursPerWeek, setHoursPerWeek] = useState("40");
  const [state, setState] = useState("TX");
  const [city, setCity] = useState("");
  const [rentRatio, setRentRatio] = useState("0.30");
  const [bedrooms, setBedrooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [selectedAmenities, setSelectedAmenities] = useState<Amenity[]>([]);
  const [budget, setBudget] = useState<BudgetResponse | null>(null);
  const [householdBudget, setHouseholdBudget] = useState<HouseholdBudgetResult | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingBudget, setLoadingBudget] = useState(false);
  const [loadingListings, setLoadingListings] = useState(false);
  const [error, setError] = useState("");
  const [contributors, setContributors] = useState<ContributorForm[]>([
    createContributor(1, "Person 1", "50"),
    createContributor(2, "Person 2", "50"),
  ]);

  // Search uses whichever budget is active.
  const activeBudgetRent = useMemo(() => {
    if (plannerMode === "household") return householdBudget?.recommendedMaxRent ?? null;
    return budget?.recommended_max_rent ?? null;
  }, [plannerMode, householdBudget, budget]);

  const toggleAmenity = (amenity: Amenity) => {
    // Simple include-or-remove toggle.
    setSelectedAmenities((current) =>
      current.includes(amenity) ? current.filter((item) => item !== amenity) : [...current, amenity],
    );
  };

  const updateContributor = (id: number, field: keyof ContributorForm, value: string | number) => {
    // Update one household row at a time.
    setContributors((current) =>
      current.map((contributor) => (contributor.id === id ? { ...contributor, [field]: value } : contributor)),
    );
  };

  const addContributor = () => {
    // Give the new person a simple default share.
    setContributors((current) => {
      const nextId = Math.max(...current.map((item) => item.id), 0) + 1;
      const share = current.length > 0 ? (100 / (current.length + 1)).toFixed(1) : "100";
      return [...current, createContributor(nextId, `Person ${nextId}`, share)];
    });
  };

  const removeContributor = (id: number) => {
    setContributors((current) => current.filter((contributor) => contributor.id !== id));
  };

  const getApartmentPayload = (maxMonthlyRent: number): ApartmentSearchRequest => ({
    // The search tab reads from the current UI filters.
    max_monthly_rent: maxMonthlyRent,
    state,
    city: city.trim() || undefined,
    min_bedrooms: Number(bedrooms),
    min_bathrooms: Number(bathrooms),
    required_amenities: selectedAmenities,
  });

  const buildHouseholdBudget = async (rentRatioValue: number) => {
    // Shares still need to total 100.
    const totalShare = contributors.reduce((sum, contributor) => sum + Number(contributor.rentShare || 0), 0);
    if (Math.abs(totalShare - 100) > 0.2) throw new Error("Contributor rent shares must add up to 100%.");

    // Run each person through the same budget endpoint.
    const results = await Promise.all(
      contributors.map(async (contributor) => ({
        id: contributor.id,
        name: contributor.name.trim() || `Person ${contributor.id}`,
        rentSharePercent: Number(contributor.rentShare),
        budget: await calculateBudget(getContributorBudgetRequest(contributor, state, rentRatioValue)),
      })),
    );

    const totalNetAnnualIncome = results.reduce((sum, contributor) => sum + contributor.budget.net_annual_income, 0);
    const totalNetMonthlyIncome = results.reduce((sum, contributor) => sum + contributor.budget.net_monthly_income, 0);
    const totalEstimatedTaxes = results.reduce((sum, contributor) => sum + contributor.budget.tax_breakdown.total_tax, 0);
    const recommendedMaxRent = totalNetMonthlyIncome * rentRatioValue;

    // Package the totals the UI expects.
    return {
      totalNetAnnualIncome,
      totalNetMonthlyIncome,
      recommendedMaxRent,
      comfortableRentRangeMin: recommendedMaxRent * 0.85,
      comfortableRentRangeMax: recommendedMaxRent,
      totalEstimatedTaxes,
      contributors: results.map((contributor) => {
        const fairSharePercent =
          totalNetMonthlyIncome > 0 ? (contributor.budget.net_monthly_income / totalNetMonthlyIncome) * 100 : 0;
        const assignedContribution = recommendedMaxRent * (contributor.rentSharePercent / 100);
        return {
          ...contributor,
          assignedContribution,
          fairSharePercent,
          fairContribution: recommendedMaxRent * (fairSharePercent / 100),
          monthlyLeftAfterAssignedRent: contributor.budget.net_monthly_income - assignedContribution,
        };
      }),
    };
  };

  const handleBudgetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    // Budgeting tab saves the budget first.
    event.preventDefault();
    setLoadingBudget(true);
    setError("");
    try {
      const rentRatioValue = Number(rentRatio);
      if (plannerMode === "solo") {
        setBudget(
          await calculateBudget({
            income_type: incomeType,
            annual_income: incomeType === "annual" ? Number(annualIncome) : undefined,
            hourly_rate: incomeType === "hourly" ? Number(hourlyRate) : undefined,
            hours_per_week: incomeType === "hourly" ? Number(hoursPerWeek) : undefined,
            state,
            rent_ratio: rentRatioValue,
          }),
        );
        setHouseholdBudget(null);
      } else {
        setHouseholdBudget(await buildHouseholdBudget(rentRatioValue));
        setBudget(null);
      }
      setListings([]);
      setActiveTab("search");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong while calculating your budget.");
    } finally {
      setLoadingBudget(false);
    }
  };

  const handleApartmentSearch = async () => {
    // Search only works after a budget exists.
    if (!activeBudgetRent) {
      setError("Calculate a budget first so apartment search knows your price range.");
      return;
    }
    setLoadingListings(true);
    setError("");
    try {
      const apartmentResponse = await searchApartments(getApartmentPayload(activeBudgetRent));
      setListings(apartmentResponse.matches);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong while searching apartments.");
    } finally {
      setLoadingListings(false);
    }
  };

  return (
    <div
      className={
        activeTab === "search" ? "page-shell theme-search" : "page-shell theme-budgeting"
      }
    >
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Relocation planning with real budget guardrails</p>
          <h1>First Budget. Then Search.</h1>
          <p className="hero-text">
            SweetMate separates budget planning from apartment discovery so users can first understand affordability and then search listings inside that range.
          </p>
        </div>
        <div className="hero-stat">
          <span>Workspace</span>
          <strong>Budgeting + apartment search</strong>
          <small>One place to price the move and browse options</small>
        </div>
      </section>

      <div className="workspace-tabs">
        <button type="button" className={activeTab === "budgeting" ? "workspace-tab active" : "workspace-tab"} onClick={() => setActiveTab("budgeting")}>
          Budgeting
        </button>
        <button type="button" className={activeTab === "search" ? "workspace-tab active" : "workspace-tab"} onClick={() => setActiveTab("search")}>
          Apartment Search
        </button>
      </div>

      {/* Main split: pricing first, listings second. */}
      {activeTab === "budgeting" ? (
        <main className="layout">
          <form className="panel form-panel" onSubmit={handleBudgetSubmit}>
            <div className="section-heading">
              <h2>Budgeting Side</h2>
              <p>Use this area for income, taxes, cost splits, and affordability.</p>
            </div>

            <section className="input-section">
              <div className="section-heading compact">
                <h2>Income Setup</h2>
                <p>Choose a solo or household setup, then enter income details.</p>
              </div>
              <div className="toggle-row full-width">
                <button type="button" className={plannerMode === "solo" ? "toggle active" : "toggle"} onClick={() => setPlannerMode("solo")}>Solo Budget</button>
                <button type="button" className={plannerMode === "household" ? "toggle active" : "toggle"} onClick={() => setPlannerMode("household")}>Household Budget</button>
              </div>

              {plannerMode === "solo" ? (
                <>
                  <div className="toggle-row">
                    <button type="button" className={incomeType === "annual" ? "toggle active" : "toggle"} onClick={() => setIncomeType("annual")}>Annual Salary</button>
                    <button type="button" className={incomeType === "hourly" ? "toggle active" : "toggle"} onClick={() => setIncomeType("hourly")}>Hourly Pay</button>
                  </div>
                  {incomeType === "annual" ? (
                    <label>Annual income<input type="number" min="0" value={annualIncome} onChange={(event) => setAnnualIncome(event.target.value)} /></label>
                  ) : (
                    <div className="grid two-up">
                      <label>Hourly rate<input type="number" min="0" step="0.01" value={hourlyRate} onChange={(event) => setHourlyRate(event.target.value)} /></label>
                      <label>Average hours / week<input type="number" min="1" max="168" step="0.5" value={hoursPerWeek} onChange={(event) => setHoursPerWeek(event.target.value)} /></label>
                    </div>
                  )}
                </>
              ) : (
                <section className="contributor-section">
                  <div className="section-heading compact">
                    <h2>Household Contributors</h2>
                    <p>Add each person and decide how the rent should be split.</p>
                  </div>
                  <div className="contributor-stack">
                    {contributors.map((contributor, index) => (
                      <article key={contributor.id} className="contributor-card">
                        <div className="contributor-header">
                          <strong>Contributor {index + 1}</strong>
                          {contributors.length > 1 ? <button type="button" className="ghost-button" onClick={() => removeContributor(contributor.id)}>Remove</button> : null}
                        </div>
                        <div className="grid two-up">
                          <label>Name<input type="text" value={contributor.name} onChange={(event) => updateContributor(contributor.id, "name", event.target.value)} /></label>
                          <label>Rent share %<input type="number" min="0" max="100" step="0.1" value={contributor.rentShare} onChange={(event) => updateContributor(contributor.id, "rentShare", event.target.value)} /></label>
                        </div>
                        <div className="toggle-row">
                          <button type="button" className={contributor.incomeType === "annual" ? "toggle active" : "toggle"} onClick={() => updateContributor(contributor.id, "incomeType", "annual")}>Annual</button>
                          <button type="button" className={contributor.incomeType === "hourly" ? "toggle active" : "toggle"} onClick={() => updateContributor(contributor.id, "incomeType", "hourly")}>Hourly</button>
                        </div>
                        {contributor.incomeType === "annual" ? (
                          <label>Annual income<input type="number" min="0" value={contributor.annualIncome} onChange={(event) => updateContributor(contributor.id, "annualIncome", event.target.value)} /></label>
                        ) : (
                          <div className="grid two-up">
                            <label>Hourly rate<input type="number" min="0" step="0.01" value={contributor.hourlyRate} onChange={(event) => updateContributor(contributor.id, "hourlyRate", event.target.value)} /></label>
                            <label>Hours / week<input type="number" min="1" max="168" step="0.5" value={contributor.hoursPerWeek} onChange={(event) => updateContributor(contributor.id, "hoursPerWeek", event.target.value)} /></label>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                  <button type="button" className="secondary-button" onClick={addContributor}>Add contributor</button>
                </section>
              )}

              <div className="grid two-up">
                <label>State<select value={state} onChange={(event) => setState(event.target.value)}>{STATES.map((stateOption) => <option key={stateOption} value={stateOption}>{stateOption}</option>)}</select></label>
                <label>Rent ratio<input type="number" min="0.1" max="0.6" step="0.01" value={rentRatio} onChange={(event) => setRentRatio(event.target.value)} /></label>
              </div>
              {plannerMode === "household" ? <p className="helper-text">Current share total: {percent.format(contributors.reduce((sum, contributor) => sum + Number(contributor.rentShare || 0), 0))}%</p> : null}
            </section>

            <button className="submit-button" type="submit" disabled={loadingBudget}>
              {loadingBudget ? "Calculating budget..." : "Save budget and continue"}
            </button>
            {error ? <p className="error-text">{error}</p> : null}
          </form>

          <section className="results-column">
            <article className="panel summary-panel">
              <div className="section-heading">
                <h2>{plannerMode === "solo" ? "Budget Summary" : "Household Summary"}</h2>
                <p>{plannerMode === "solo" ? "Review your after-tax income and recommended rent range." : "Review household totals and how rent can be split."}</p>
              </div>

              {budget ? (
                <div className="summary-grid">
                  <div><span>Net annual income</span><strong>{currency.format(budget.net_annual_income)}</strong></div>
                  <div><span>Net monthly income</span><strong>{currency.format(budget.net_monthly_income)}</strong></div>
                  <div><span>Recommended max rent</span><strong>{currency.format(budget.recommended_max_rent)}</strong></div>
                  <div><span>Comfortable range</span><strong>{currency.format(budget.comfortable_rent_range_min)} to {currency.format(budget.comfortable_rent_range_max)}</strong></div>
                  <div><span>State tax rate used</span><strong>{(budget.state_tax_rate * 100).toFixed(2)}%</strong></div>
                  <div><span>Total estimated taxes</span><strong>{currency.format(budget.tax_breakdown.total_tax)}</strong></div>
                </div>
              ) : null}

              {householdBudget ? (
                <div className="household-results">
                  <div className="summary-grid">
                    <div><span>Total household net annual</span><strong>{currency.format(householdBudget.totalNetAnnualIncome)}</strong></div>
                    <div><span>Total household net monthly</span><strong>{currency.format(householdBudget.totalNetMonthlyIncome)}</strong></div>
                    <div><span>Recommended max rent</span><strong>{currency.format(householdBudget.recommendedMaxRent)}</strong></div>
                    <div><span>Comfortable range</span><strong>{currency.format(householdBudget.comfortableRentRangeMin)} to {currency.format(householdBudget.comfortableRentRangeMax)}</strong></div>
                    <div><span>Total estimated taxes</span><strong>{currency.format(householdBudget.totalEstimatedTaxes)}</strong></div>
                    <div><span>Contributors</span><strong>{householdBudget.contributors.length}</strong></div>
                  </div>
                  <div className="split-grid">
                    {householdBudget.contributors.map((contributor) => (
                      <article key={contributor.id} className="split-card">
                        <h3>{contributor.name}</h3>
                        <p>Pays {percent.format(contributor.rentSharePercent)}% of the rent</p>
                        <strong>{currency.format(contributor.assignedContribution)} / month</strong>
                        <span>Based on net monthly income of {currency.format(contributor.budget.net_monthly_income)}</span>
                      </article>
                    ))}
                  </div>
                  <div className="fairness-panel">
                    <div className="section-heading compact">
                      <h2>Fair Split Suggestion</h2>
                      <p>This suggestion makes each person contribute the same percentage of their own net monthly income.</p>
                    </div>
                    <div className="split-grid">
                      {householdBudget.contributors.map((contributor) => (
                        <article key={`${contributor.id}-fair`} className="split-card fair-card">
                          <h3>{contributor.name}</h3>
                          <p>Suggested share: {percent.format(contributor.fairSharePercent)}%</p>
                          <strong>{currency.format(contributor.fairContribution)} / month</strong>
                          <span>This keeps everyone near {percent.format(Number(rentRatio) * 100)}% of their net monthly income.</span>
                        </article>
                      ))}
                    </div>
                  </div>
                  <div className="fairness-panel">
                    <div className="section-heading compact">
                      <h2>Individual Summary</h2>
                      <p>A quick look at each person's net income, assigned rent, and money left after rent.</p>
                    </div>
                    <div className="split-grid">
                      {householdBudget.contributors.map((contributor) => (
                        <article key={`${contributor.id}-summary`} className="split-card summary-card">
                          <h3>{contributor.name}</h3>
                          <p>Net monthly income</p>
                          <strong>{currency.format(contributor.budget.net_monthly_income)}</strong>
                          <span>Assigned rent: {currency.format(contributor.assignedContribution)}</span>
                          <span>Left after rent: {currency.format(contributor.monthlyLeftAfterAssignedRent)}</span>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {!budget && !householdBudget ? <p className="empty-state">Build a budget first. Once it looks good, switch to Apartment Search.</p> : null}
            </article>
          </section>
        </main>
      ) : (
        <main className="layout">
          <aside className="panel form-panel">
            <div className="section-heading">
              <h2>Apartment Search</h2>
              <p>Use your saved budget to search listings that fit the move.</p>
            </div>
            <section className="input-section">
              <div className="section-heading compact">
                <h2>Budget Guardrail</h2>
                <p>The search uses the max rent calculated on the budgeting side.</p>
              </div>
              <div className="summary-grid single-column">
                <div><span>Active budget mode</span><strong>{plannerMode === "solo" ? "Solo" : "Household"}</strong></div>
                <div><span>Max rent used for search</span><strong>{activeBudgetRent ? currency.format(activeBudgetRent) : "Calculate first"}</strong></div>
              </div>
            </section>
            <section className="input-section">
              <div className="section-heading compact">
                <h2>Search Filters</h2>
                <p>Refine the apartment results without changing the saved budget.</p>
              </div>
              <div className="grid two-up">
                <label>State<select value={state} onChange={(event) => setState(event.target.value)}>{STATES.map((stateOption) => <option key={stateOption} value={stateOption}>{stateOption}</option>)}</select></label>
                <label>City<input type="text" placeholder="Optional" value={city} onChange={(event) => setCity(event.target.value)} /></label>
              </div>
              <div className="grid two-up">
                <label>Minimum bedrooms<input type="number" min="0" value={bedrooms} onChange={(event) => setBedrooms(event.target.value)} /></label>
                <label>Minimum bathrooms<input type="number" min="0" step="0.5" value={bathrooms} onChange={(event) => setBathrooms(event.target.value)} /></label>
              </div>
              <div>
                <span className="label-title">Required amenities</span>
                <div className="amenity-grid">
                  {AMENITY_OPTIONS.map((option) => (
                    <label key={option.value} className="checkbox-card">
                      <input type="checkbox" checked={selectedAmenities.includes(option.value)} onChange={() => toggleAmenity(option.value)} />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>
            <button className="submit-button" type="button" onClick={handleApartmentSearch} disabled={loadingListings}>
              {loadingListings ? "Searching apartments..." : "Search apartments"}
            </button>
            {error ? <p className="error-text">{error}</p> : null}
          </aside>

          <section className="results-column">
            <article className="panel listings-panel">
              <div className="section-heading">
                <h2>Apartment Results</h2>
                <p>This tab is dedicated to listings, filtered by the budget ceiling you already calculated.</p>
              </div>
              {listings.length > 0 ? (
                <div className="listing-grid">
                  {listings.map((listing) => (
                    <a key={listing.id} className="listing-card" href={listing.listing_url} target="_blank" rel="noreferrer">
                      <img src={listing.image_url} alt={listing.title} />
                      <div className="listing-content">
                        <div className="listing-topline">
                          <h3>{listing.title}</h3>
                          <span>{currency.format(listing.monthly_rent)}/mo</span>
                        </div>
                        <p>{listing.neighborhood}, {listing.city}, {listing.state}</p>
                        <p>{listing.bedrooms} bd • {listing.bathrooms} ba</p>
                        <div className="tag-row">
                          {listing.amenities.map((amenity) => <span key={amenity} className="tag">{amenity.split("_").join(" ")}</span>)}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No listings yet. Use the Apartment Search button to fetch apartments with your saved budget.</p>
              )}
            </article>
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
