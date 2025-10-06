/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type */

import React from "react";
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { ReactElement } from "react";
import type { SearchResponse } from "../../features/accommodations/api/accommodationsApi";
import * as api from "../../features/accommodations/api/accommodationsApi";
import * as auth from "../../features/auth/api/authApi";

/* ---------------- MOCKOVI: MUI ---------------- */
vi.mock("@mui/material", () => ({
  Container: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Grid: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Typography: ({ children }: { children?: React.ReactNode }) => <h1>{children}</h1>,
  Pagination: (props: any) => (
      <button
          aria-label="Go to page 2"
          data-testid="pagination-btn"
          onClick={() => props.onChange?.({}, 2)}
      >
        Go to page 2
      </button>
  ),
  Box: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@mui/material/styles", () => ({}));
vi.mock("@mui/material/utils", () => ({}));
vi.mock("@mui/icons-material", () => ({}));

/* ---------------- MOCKOVI: useNavigate / useLocation ---------------- */
let locState = { pathname: "/accommodations", state: {} };
const listeners: ((l: typeof locState) => void)[] = [];

vi.mock("react-router-dom", async (orig) => {
  const actual: unknown = await orig();
  return {
    ...(actual as object),
    useNavigate: () => (path: string, opts?: { state?: object }) => {
      locState = { pathname: path, state: opts?.state ?? {} };
      listeners.forEach((l) => l(locState)); // trigger re-render
    },
    useLocation: () => {
      const [loc, setLoc] = React.useState(locState);
      React.useEffect(() => {
        const listener = (newLoc: unknown) => {
          if (typeof newLoc === "object" && newLoc !== null) {
            setLoc({ ...(newLoc as { pathname: string; state: {} }) });
          }
        };
        listeners.push(listener);
        return () => {
          const i = listeners.indexOf(listener);
          if (i >= 0) listeners.splice(i, 1);
        };
      }, []);
      return loc;
    },
    MemoryRouter: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Routes: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Route: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  };
});

/* ---------------- MOCKOVI: Navbar ---------------- */
vi.mock("../../features/accommodations/navbar/HostNavbar.tsx", () => ({
  default: (props: { onSearch?: (filters: { q?: string }) => void; onHome?: () => void }): ReactElement => (
      <div>
        <button data-testid="host-search" onClick={() => props.onSearch?.({ q: "beach" })}>
          Search
        </button>
        <button data-testid="host-home" onClick={() => props.onHome?.()}>
          Home
        </button>
      </div>
  ),
}));

vi.mock("../../features/accommodations/navbar/GuestNavbar.tsx", () => ({
  default: (props: { onHome?: () => void }): ReactElement => (
      <div>
        <button data-testid="guest-home" onClick={() => props.onHome?.()}>
          Home
        </button>
      </div>
  ),
}));

/* ---------------- MOCKOVI: Karte i API ---------------- */
vi.mock("../../features/accommodations/pages/AccommodationCard", () => ({
  default: (props: { accommodation: SearchResponse }): ReactElement => (
      <div data-testid={`acc-${props.accommodation.id}`}>{props.accommodation.name}</div>
  ),
}));

vi.mock("../../features/auth/api/authApi", () => ({
  getRole: vi.fn(() => "GUEST"),
}));

vi.mock("../../features/accommodations/api/accommodationsApi", () => ({
  fetchAccommodations: vi.fn(),
  searchAccommodations: vi.fn(),
}));

/* ---------------- Dinamički import ---------------- */
let Dashboard: React.ComponentType;
beforeAll(async () => {
  const mod = await import("../../features/accommodations/pages/AccommodationDashboard");
  Dashboard = mod.default as React.ComponentType;
});

/* ---------------- Helper funkcija ---------------- */
const makeItems = (n: number): SearchResponse[] =>
    Array.from({ length: n }).map((_, i) => ({
      id: String(i + 1),
      name: `Place ${i + 1}`,
      location: { city: "X", country: "Y", address: "", postalCode: "" },
      description: "",
      photos: [],
      amenities: [],
      minGuests: 1,
      maxGuests: 2,
      totalPrice: 0,
      unitPrice: 0,
      pricingMode: "PER_PERSON",
    }));

/* ---------------- TESTOVI ---------------- */
describe("AccommodationDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    locState = { pathname: "/accommodations", state: {} };
  });

  it("renders list, paginates, and onHome resets to first page", async () => {
    vi.mocked(api.fetchAccommodations).mockResolvedValue(makeItems(7));

    render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: /accommodations/i })).toBeInTheDocument();
    expect(screen.getByTestId("acc-1")).toBeInTheDocument();
    expect(screen.getByTestId("acc-6")).toBeInTheDocument();
    expect(screen.queryByTestId("acc-7")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /go to page 2/i }));
    expect(await screen.findByTestId("acc-7")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("guest-home"));
    expect(await screen.findByTestId("acc-1")).toBeInTheDocument();
  });

  it("HOST: search navigates and passes results", async () => {
    vi.mocked(api.fetchAccommodations).mockResolvedValue(makeItems(3));
    const results = makeItems(2);
    const searchSpy = vi.spyOn(api, "searchAccommodations").mockResolvedValue(results);
    vi.spyOn(auth, "getRole").mockImplementation(() => "HOST");

    const ResultsView = () => {
      const loc = useLocation() as { state?: { results?: SearchResponse[] } };
      return <div>Results {loc.state?.results?.length ?? 0}</div>;
    };

    const App = () => (
        <>
          <Dashboard />
          <ResultsView />
        </>
    );

    render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: /accommodations/i })).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId("host-search"));
    });

    await screen.findByText(/results 2/i);
    expect(searchSpy).toHaveBeenCalled();
  });
});
