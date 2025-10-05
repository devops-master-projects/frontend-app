import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

// Lightweight top-level mocks (must be hoisted) to avoid heavy MUI imports
vi.mock('@mui/icons-material', () => ({
  Home: () => null,
  Search: () => null,
}))
vi.mock('@mui/x-date-pickers', () => ({
  LocalizationProvider: ({ children }: any) => children,
  DatePicker: (props: any) => (
    <input
      aria-label={props.label}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        props.onChange?.(val ? new Date(val) : null)
      }}
    />
  ),
}))
vi.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
  AdapterDateFns: class {},
  default: class {},
}))

const mockedNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

import GuestNavbar from "../../features/accommodations/navbar/GuestNavbar";

describe("GuestNavbar", () => {
  beforeEach(() => {
    mockedNavigate.mockReset();
    vi.clearAllMocks();
  });

  const setup = (props?: Partial<React.ComponentProps<typeof GuestNavbar>>) => {
    return render(
      <MemoryRouter>
        <GuestNavbar {...props} />
      </MemoryRouter>
    );
  };

  it("renders home and notifications buttons", () => {
    setup();
    expect(screen.getByTestId("guest-navbar-home")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /notifications/i })).toBeInTheDocument();
  });

  it("calls custom onHome when provided", () => {
    const onHome = vi.fn();
    setup({ onHome });
    fireEvent.click(screen.getByTestId("guest-navbar-home"));
    expect(onHome).toHaveBeenCalledTimes(1);
    expect(mockedNavigate).not.toHaveBeenCalled();
  });

  it("navigates to /accommodations when no onHome provided", () => {
    setup();
    fireEvent.click(screen.getByTestId("guest-navbar-home"));
    expect(mockedNavigate).toHaveBeenCalledWith("/accommodations");
  });

  it("does not render search toggle if enableSearch is false", () => {
    setup({ enableSearch: false });
    expect(screen.queryByTestId("guest-navbar-toggle-search")).not.toBeInTheDocument();
  });

  it("renders search toggle when enableSearch is true", () => {
    setup({ enableSearch: true });
    expect(screen.getByTestId("guest-navbar-toggle-search")).toBeInTheDocument();
  });

  it("toggles search collapse when search icon is clicked", async () => {
    setup({ enableSearch: true });
    const toggle = screen.getByTestId("guest-navbar-toggle-search");

    // open
    await userEvent.click(toggle);
    await waitFor(() => {
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    });

    // close
    await userEvent.click(toggle);
    await waitFor(() => {
      expect(screen.queryByLabelText(/location/i)).not.toBeInTheDocument();
    });
  });

  it("updates inputs and triggers onSearch with correct filters", async () => {
    const onSearch = vi.fn();
    setup({ enableSearch: true, onSearch });

    await userEvent.click(screen.getByTestId("guest-navbar-toggle-search"));

    const locationInput = await screen.findByLabelText(/location/i);
    const guestsInput = screen.getByLabelText(/guests/i);
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);
    const searchButton = screen.getByTestId("guest-navbar-submit-search");

    await userEvent.clear(locationInput);
    await userEvent.type(locationInput, "Paris");

    await userEvent.clear(guestsInput);
    await userEvent.type(guestsInput, "3");

    // Simulate changing MUI date pickers (they expose a text field)
    fireEvent.change(startDateInput, { target: { value: "2025-10-01" } });
    fireEvent.change(endDateInput, { target: { value: "2025-10-05" } });

    await userEvent.click(searchButton);

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith({
        location: "Paris",
        guests: 3,
        startDate: expect.any(String),
        endDate: expect.any(String),
      });
    });
  });

  it("calls onSearch even if fields are empty", async () => {
    const onSearch = vi.fn();
    setup({ enableSearch: true, onSearch });

    await userEvent.click(screen.getByTestId("guest-navbar-toggle-search"));

    const searchButton = await screen.findByTestId("guest-navbar-submit-search");
    await userEvent.click(searchButton);

    expect(onSearch).toHaveBeenCalledWith({
      location: "",
      guests: 1,
      startDate: undefined,
      endDate: undefined,
    });
  });
});