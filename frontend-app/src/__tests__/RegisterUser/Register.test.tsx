import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest'

import { fireEvent, render, screen, within, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { BrowserRouter } from 'react-router-dom'
import Register from '../../features/auth/pages/Register'
import { registerUser } from '../../features/auth/api/authApi'

vi.mock('../../features/auth/api/authApi', () => ({
  registerUser: vi.fn(),
}))

const mockedRegisterUser = registerUser as MockedFunction<typeof registerUser>

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>
    </BrowserRouter>
  )
}

// removed userEvent-heavy helper for speed

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts with submit disabled and no alerts', () => {
    renderWithProviders(<Register />)
    const submit = screen.getByRole('button', { name: /create account/i })
    expect(submit).toBeDisabled()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('enables submit when all required fields are filled', () => {
    renderWithProviders(<Register />)
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'A' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'B' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'user' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } })
    // Role defaults to guest
    const submit = screen.getByRole('button', { name: /create account/i })
    expect(submit).toBeEnabled()
  })

  it('sends trimmed payload and address is undefined when empty', async () => {
    mockedRegisterUser.mockResolvedValue('All good!')
    renderWithProviders(<Register />)

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: '  Anja  ' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: '  Bane  ' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: '  anja@example.com  ' } })
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: '  anja  ' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } })
  // keep default role (guest) to avoid heavy Select interaction

    const user1 = userEvent.setup()
    await user1.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(mockedRegisterUser).toHaveBeenCalledTimes(1)
      expect(mockedRegisterUser).toHaveBeenCalledWith({
        username: 'anja',
        password: 'secret123',
        firstName: 'Anja',
        lastName: 'Bane',
        email: 'anja@example.com',
        address: undefined,
        role: 'guest',
      })
    })
  })

  it('shows success alert and clears fields after successful registration', async () => {
    mockedRegisterUser.mockResolvedValue('User registered successfully!')
    renderWithProviders(<Register />)

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'A' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'B' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'user' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } })
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: 'Novi Sad, Serbia' } })

    const user4 = userEvent.setup()
    await user4.click(screen.getByRole('button', { name: /create account/i }))

    // Wait for success UI to appear and then assert on form reset
    await screen.findByText(/user registered successfully/i)
    expect(screen.getByLabelText(/first name/i)).toHaveValue('')
    expect(screen.getByLabelText(/last name/i)).toHaveValue('')
    expect(screen.getByLabelText(/email/i)).toHaveValue('')
    expect(screen.getByLabelText(/username/i)).toHaveValue('')
    expect(screen.getByLabelText(/password/i)).toHaveValue('')
    expect(screen.getByLabelText(/address/i)).toHaveValue('')
  })

  it('shows error alert on failure and can be dismissed', async () => {
    mockedRegisterUser.mockRejectedValue(new Error('Registration failed (409)'))
    renderWithProviders(<Register />)

    // Fast fill with fireEvent to avoid slow userEvent typing
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Anja' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Bane' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'anja@example.com' } })
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'anja' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } })

  const userErr = userEvent.setup()
  await userErr.click(screen.getByRole('button', { name: /create account/i }))

    // Assert by text to be robust regardless of role/markup
    const alertText = await screen.findByText(/registration failed \(409\)/i)
    expect(alertText).toBeInTheDocument()

    // Close the alert and confirm it disappears
  const alert = (alertText.closest('[role="alert"]') ?? screen.getByRole('alert')) as HTMLElement
  const closeBtn = within(alert).getByRole('button', { name: /close/i })
    const user3 = userEvent.setup()
    await user3.click(closeBtn)
    await waitFor(() => expect(screen.queryByText(/registration failed \(409\)/i)).toBeNull())
  })

  it('shows loading state, disables button, and prevents double submit', async () => {
    let resolve!: (v: unknown) => void
    const deferred = new Promise((res) => (resolve = res))
    mockedRegisterUser.mockImplementation(() => deferred as Promise<string>)

    renderWithProviders(<Register />)
    // Fast fill
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'A' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'B' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'user' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } })

  const user4 = userEvent.setup()
  await user4.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByRole('button', { name: /registering…/i })).toBeDisabled()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()

    const loadingBtn = screen.getByRole('button', { name: /registering…/i })
    // Use fireEvent to simulate a click on a disabled button without throwing
    fireEvent.click(loadingBtn)
    expect(mockedRegisterUser).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolve('ok')
    })
  })

  it('includes address in payload when provided (trimmed)', async () => {
    mockedRegisterUser.mockResolvedValue('ok')
    renderWithProviders(<Register />)

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'A' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'B' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'user' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } })
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '  City, Street  ' } })
    const userInc = userEvent.setup()
    await userInc.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(mockedRegisterUser).toHaveBeenCalledWith(
        expect.objectContaining({ address: 'City, Street' })
      )
    )
  })
})