import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import * as api from "../../features/accommodations/api/accommodationsApi";
import type { AccommodationResponseDto } from "../../features/accommodations/api/accommodationsApi";
import Details from "../../features/accommodations/pages/AccommodationDetailsPage";

const navigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock("../../features/accommodations/navbar/HostNavbar.tsx", () => ({
  default: () => <div data-testid="host-navbar" />,
}));
vi.mock("../../features/accommodations/navbar/GuestNavbar.tsx", () => ({
  default: () => <div data-testid="guest-navbar" />,
}));
vi.mock("../../features/accommodations/pages/PhotoCarousel.tsx", () => ({
  default: () => <div data-testid="carousel" />,
}));

vi.mock("../../features/accommodations/api/accommodationsApi", () => ({
  fetchAccommodationById: vi.fn(),
}));
vi.mock("../../features/auth/api/authApi", () => ({
  getRole: vi.fn(() => "HOST"),
}));

const base: AccommodationResponseDto = {
  id: "a1",
  name: "Sample",
  location: { address: "Addr", city: "X", country: "Y", postalCode: "000" },
  description: "Desc",
  minGuests: 1,
  maxGuests: 4,
  autoConfirm: true,
  pricingMode: "FIXED",
  amenities: [{ id: "am1", name: "Wifi", description: "" }],
  urlPhotos: ["p1.jpg"],
};

describe("AccommodationDetailsPage", () => {
  beforeEach(() => {
    // Reset all mocks to their initial implementations between tests
    // (important so getRole returns HOST again after tests that set it to GUEST)
    vi.resetAllMocks();
  });

  it("does not fetch when id is missing", () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Details />} />
        </Routes>
      </MemoryRouter>
    );
    expect(api.fetchAccommodationById).not.toHaveBeenCalled();
    expect(screen.getByText(/loading accommodation/i)).toBeInTheDocument();
  });

  it("loads and renders host view, triggers all host buttons", async () => {
  vi.mocked(api.fetchAccommodationById).mockResolvedValue(base);

    render(
      <MemoryRouter initialEntries={["/accommodations/a1"]}>
        <Routes>
          <Route path="/accommodations/:id" element={<Details />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: /sample/i })).toBeInTheDocument();

    // click all host buttons
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    fireEvent.click(screen.getByRole("button", { name: /availabilities/i }));
    fireEvent.click(screen.getByRole("button", { name: /requests/i }));

    // check that navigate has been called 3 times
    expect(navigate).toHaveBeenCalledTimes(3);
    expect(navigate).toHaveBeenCalledWith("/accommodations/a1/edit");
    expect(navigate).toHaveBeenCalledWith("/accommodations/a1/availability/new");
    expect(navigate).toHaveBeenCalledWith("/accommodations/a1/requests");
  });

  it("renders guest view and triggers Book now", async () => {
    vi.mocked(api.fetchAccommodationById).mockResolvedValue({
      ...base,
      urlPhotos: [],
      amenities: [],
    });

    const mod = await import("../../features/auth/api/authApi");
    vi.spyOn(mod, "getRole").mockReturnValue("GUEST");

    render(
      <MemoryRouter initialEntries={["/accommodations/a1"]}>
        <Routes>
          <Route path="/accommodations/:id" element={<Details />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: /sample/i })).toBeInTheDocument();

    const bookBtn = screen.getByRole("button", { name: /book now/i });
    fireEvent.click(bookBtn);
    expect(navigate).toHaveBeenCalledWith("/accommodations/a1/reservations/new");
  });

  it("handles fetch error branch", async () => {
    vi.mocked(api.fetchAccommodationById).mockRejectedValue(new Error("Boom"));
    render(
      <MemoryRouter initialEntries={["/accommodations/a1"]}>
        <Routes>
          <Route path="/accommodations/:id" element={<Details />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/boom/i)).toBeInTheDocument();
  });

  it("renders with autoConfirm = false and still shows correctly", async () => {
    vi.mocked(api.fetchAccommodationById).mockResolvedValue({
      ...base,
      autoConfirm: false,
    });

    render(
      <MemoryRouter initialEntries={["/accommodations/a1"]}>
        <Routes>
          <Route path="/accommodations/:id" element={<Details />} />
        </Routes>
      </MemoryRouter>
    );

    // Scope the assertion to the "Auto-confirm" row to avoid matching text like "Book now"
    const autoRow = await screen.findByText(/auto-confirm:/i);
    expect(autoRow).toHaveTextContent(/auto-confirm:\s*no/i);
  });
});
