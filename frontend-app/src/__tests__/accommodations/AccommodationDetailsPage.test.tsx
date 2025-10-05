/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import * as api from "../../features/accommodations/api/accommodationsApi";
import type { AccommodationResponseDto } from "../../features/accommodations/api/accommodationsApi";
import Details from "../../features/accommodations/pages/AccommodationDetailsPage";

/* ---------------- Mock navigate ---------------- */
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

/* ---------------- MUI Mock ---------------- */
vi.mock("@mui/material", () => ({
  Container: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Typography: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Paper: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Box: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Button: (props: any) => (
    <button {...props}>{props.children}</button>
  ),
  Chip: ({ label }: { label: string }) => <span>{label}</span>,
  Divider: () => <hr />,
}));

vi.mock("@mui/material/Grid", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@mui/material/styles", () => ({
  useTheme: () => ({ palette: { primary: { main: "blue" } } }),
}));

/* ---------------- Navbar mocks ---------------- */
vi.mock("../../features/accommodations/navbar/HostNavbar.tsx", () => ({
  default: () => <div data-testid="host-navbar" />,
}));
vi.mock("../../features/accommodations/navbar/GuestNavbar.tsx", () => ({
  default: () => <div data-testid="guest-navbar" />,
}));
vi.mock("../../features/accommodations/navbar/Navbar.tsx", () => ({
  default: () => <div data-testid="default-navbar" />,
}));
vi.mock("../../features/accommodations/pages/PhotoCarousel.tsx", () => ({
  default: () => <div data-testid="carousel" />,
}));
vi.mock("../../features/reviews/pages/ReviewsSection.tsx", () => ({
  ReviewsSection: () => <div data-testid="reviews-section" />,
}));

/* ---------------- API mocks ---------------- */
vi.mock("../../features/accommodations/api/accommodationsApi", () => ({
  fetchAccommodationById: vi.fn(),
}));
vi.mock("../../features/booking/api/bookingApi", () => ({
  canGuestRateAccommodation: vi.fn(() => Promise.resolve(false)),
}));

vi.mock("../../features/auth/api/authApi", () => ({
  getRole: vi.fn(() => "HOST"),
  getUserId: vi.fn(() => "host-123"),
  getHostProfile: vi.fn(() => Promise.resolve({ id: "h1", firstName: "John", lastName: "Doe" })),
}));

/* ---------------- Base DTO ---------------- */
const base: AccommodationResponseDto = {
  id: "a1",
  name: "Sample",
  location: { address: "Addr", city: "X", country: "Y", postalCode: "000" },
  description: "Desc",
  minGuests: 1,
  maxGuests: 4,
  autoConfirm: true,
  pricingMode: "PER_PERSON",
  amenities: [{ id: "am1", name: "Wifi", description: "" }],
  urlPhotos: ["p1.jpg"],
  hostId: "host-123",
};

/* ---------------- Tests ---------------- */
describe("AccommodationDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    expect(await screen.findByText("Sample")).toBeInTheDocument();

    // click all host buttons
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    fireEvent.click(screen.getByRole("button", { name: /availabilities/i }));
    fireEvent.click(screen.getByRole("button", { name: /requests/i }));

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

    const authApi = await import("../../features/auth/api/authApi");
    vi.spyOn(authApi, "getRole").mockReturnValue("GUEST");

    render(
      <MemoryRouter initialEntries={["/accommodations/a1"]}>
        <Routes>
          <Route path="/accommodations/:id" element={<Details />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Sample")).toBeInTheDocument();

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

    const autoRow = await screen.findByText(/auto-confirm/i);
    expect(autoRow).toHaveTextContent(/auto-confirm:\s*no/i);
  });
});
