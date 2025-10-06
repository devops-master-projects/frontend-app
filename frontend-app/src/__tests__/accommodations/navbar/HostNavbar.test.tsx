import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest"
import { MemoryRouter } from "react-router-dom"
import * as notificationsApi from "../../../features/notifications/api/notificationsApi.ts"
import HostNavbar from "../../../features/accommodations/navbar/HostNavbar"

vi.mock("@mui/icons-material", () => ({
  Home: () => null,
  Search: () => null,
  Notifications: () => null,
}))
vi.mock("@mui/x-date-pickers", () => ({
  LocalizationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DatePicker: (props: { label: string; onChange?: (d: Date | null) => void }) => (
    <input
      aria-label={props.label}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        props.onChange?.(val ? new Date(val) : null)
      }}
    />
  ),
}))
vi.mock("@mui/x-date-pickers/AdapterDateFns", () => ({
  AdapterDateFns: class {},
  default: class {},
}))


const mockedNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  }
})

vi.mock("../../../features/notifications/api/notificationsApi.ts", () => ({
  fetchNotificationSettings: vi.fn(),
  updateNotificationSetting: vi.fn(),
}))


describe("HostNavbar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedNavigate.mockReset()
  })

  const defaultSettings = [
    { notifType: "NEW_BOOKING", enabled: true },
    { notifType: "BOOKING_CANCELLED", enabled: false },
  ]

  const setup = (props?: Partial<React.ComponentProps<typeof HostNavbar>>) => {
    return render(
      <MemoryRouter>
        <HostNavbar {...props} />
      </MemoryRouter>
    )
  }

  it("renders navigation buttons and links", async () => {
    ;(notificationsApi.fetchNotificationSettings as unknown as Mock).mockResolvedValue(defaultSettings)

    setup({ enableSearch: true })
    expect(await screen.findByTestId("host-navbar-home")).toBeInTheDocument()
    expect(await screen.findByRole("link", { name: /new accommodation/i })).toBeInTheDocument()
    expect(await screen.findByRole("link", { name: /new amenity/i })).toBeInTheDocument()
    expect(await screen.findByRole("link", { name: /notifications/i })).toBeInTheDocument()
  })

  it("calls onHome if provided", async () => {
    const onHome = vi.fn()
    ;(notificationsApi.fetchNotificationSettings as unknown as Mock).mockResolvedValue([])

    setup({ onHome })
    await userEvent.click(screen.getByTestId("host-navbar-home"))
    expect(onHome).toHaveBeenCalledTimes(1)
    expect(mockedNavigate).not.toHaveBeenCalled()
  })

  it("navigates to /accommodations if no onHome provided", async () => {
    ;(notificationsApi.fetchNotificationSettings as unknown as Mock).mockResolvedValue([])

    setup()
    await userEvent.click(screen.getByTestId("host-navbar-home"))
    expect(mockedNavigate).toHaveBeenCalledWith("/accommodations")
  })

  it("toggles search bar visibility", async () => {
    ;(notificationsApi.fetchNotificationSettings as unknown as Mock).mockResolvedValue([])

    setup({ enableSearch: true })

    const toggleButton = screen.getByTestId("host-navbar-toggle-search")
    expect(screen.queryByLabelText(/location/i)).not.toBeInTheDocument()

    await userEvent.click(toggleButton)
    await waitFor(() => expect(screen.getByLabelText(/location/i)).toBeInTheDocument())

    await userEvent.click(toggleButton)
    await waitFor(() => expect(screen.queryByLabelText(/location/i)).not.toBeInTheDocument())
  })

  it("fetches and displays notification settings in popover", async () => {
    ;(notificationsApi.fetchNotificationSettings as unknown as Mock).mockResolvedValue(defaultSettings)

    setup({ enableSearch: true })

    const notifButton = screen.getByTestId("host-navbar-open-notifications")
    await userEvent.click(notifButton)

    await waitFor(() => {
      expect(screen.getByText(/new booking/i)).toBeInTheDocument()
      expect(screen.getByText(/booking cancelled/i)).toBeInTheDocument()
    })
  })

  it("calls updateNotificationSetting when switch toggled", async () => {
    ;(notificationsApi.fetchNotificationSettings as unknown as Mock).mockResolvedValue(defaultSettings)
    ;(notificationsApi.updateNotificationSetting as unknown as Mock).mockResolvedValue({})

    setup({ enableSearch: true })

    const notifButton = screen.getByTestId("host-navbar-open-notifications")
    await userEvent.click(notifButton)

  const switches = await screen.findAllByRole("switch")
    expect(switches).toHaveLength(2)

    await userEvent.click(switches[0])

    await waitFor(() => {
      expect(notificationsApi.updateNotificationSetting).toHaveBeenCalledWith("NEW_BOOKING", false)
    })
  })

  it("updates search inputs and calls onSearch with correct filters", async () => {
    ;(notificationsApi.fetchNotificationSettings as unknown as Mock).mockResolvedValue([])
    const onSearch = vi.fn()

    setup({ enableSearch: true, onSearch })

    await userEvent.click(screen.getByTestId("host-navbar-toggle-search"))

    const locationInput = await screen.findByLabelText(/location/i)
    const guestsInput = screen.getByLabelText(/guests/i)
    const startDateInput = screen.getByLabelText(/start date/i)
    const endDateInput = screen.getByLabelText(/end date/i)
    const searchButton = screen.getByTestId("host-navbar-submit-search")

    await userEvent.clear(locationInput)
    await userEvent.type(locationInput, "Paris")

    await userEvent.clear(guestsInput)
    await userEvent.type(guestsInput, "4")

    fireEvent.change(startDateInput, { target: { value: "2025-10-01" } })
    fireEvent.change(endDateInput, { target: { value: "2025-10-05" } })

    await userEvent.click(searchButton)

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith({
        location: "Paris",
        guests: 4,
        startDate: expect.any(String),
        endDate: expect.any(String),
      })
    })
  })

  it("calls onSearch with default values if empty", async () => {
    ;(notificationsApi.fetchNotificationSettings as unknown as Mock).mockResolvedValue([])
    const onSearch = vi.fn()

    setup({ enableSearch: true, onSearch })

    await userEvent.click(screen.getByTestId("host-navbar-toggle-search"))
    await userEvent.click(await screen.findByTestId("host-navbar-submit-search"))

    expect(onSearch).toHaveBeenCalledWith({
      location: "",
      guests: 1,
      startDate: undefined,
      endDate: undefined,
    })
  })
})
