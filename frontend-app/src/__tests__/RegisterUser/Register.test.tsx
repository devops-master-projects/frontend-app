import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest'

import { fireEvent, render, screen, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { BrowserRouter } from 'react-router-dom'

vi.mock('../../features/auth/api/authApi', () => ({
  registerUser: vi.fn(),
}))

import Register from '../../features/auth/pages/Register'
import { registerUser } from '../../features/auth/api/authApi'

const mockedRegisterUser = registerUser as MockedFunction<typeof registerUser>

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>
    </BrowserRouter>
  )
}

async function fillRequiredFields(
  u = userEvent.setup(),
  { role = 'guest' as 'guest' | 'host' } = {}
) {
  await u.type(screen.getByLabelText(/first name/i), '  Anja  ')
  await u.type(screen.getByLabelText(/last name/i), '  Bane  ')
  await u.type(screen.getByLabelText(/email/i), '  anja@example.com  ')
  await u.type(screen.getByLabelText(/username/i), '  anja  ')
  await u.type(screen.getByLabelText(/password/i), 'secret123')

  // Default role is 'guest'; only open the select when switching to 'host'
  if (role !== 'guest') {
    const roleField = screen.getByLabelText(/role/i)
    await u.click(roleField)
    const listbox = await screen.findByRole('listbox')
    await u.click(within(listbox).getByRole('option', { name: role }))
  }
}

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

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

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

  it('shows success alert and clears fields after successful registration', async () => {
    mockedRegisterUser.mockResolvedValue('User registered successfully!')
    renderWithProviders(<Register />)

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'A' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'B' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'user' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } })
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: 'Novi Sad, Serbia' } })

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    // Success alert might not always have role=alert; assert by text for robustness
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
    const u = userEvent.setup()
    await fillRequiredFields(u)

    await u.click(screen.getByRole('button', { name: /create account/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/registration failed \(409\)/i)

    const closeBtn = within(alert).getByRole('button', { name: /close/i })
    await u.click(closeBtn)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows loading state, disables button, and prevents double submit', async () => {
    let resolve!: (v: unknown) => void
    const deferred = new Promise((res) => (resolve = res))
    mockedRegisterUser.mockImplementation(() => deferred as Promise<string>)

    renderWithProviders(<Register />)
    const u = userEvent.setup()
    await fillRequiredFields(u)

    const submit = screen.getByRole('button', { name: /create account/i })
    await u.click(submit)

    expect(screen.getByRole('button', { name: /registering…/i })).toBeDisabled()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()

    const loadingBtn = screen.getByRole('button', { name: /registering…/i })
    expect(loadingBtn).toBeDisabled()
    fireEvent.click(loadingBtn)
    expect(mockedRegisterUser).toHaveBeenCalledTimes(1)

    // Resolve the promise in act to avoid warnings
    await act(async () => {
      resolve('ok')
    })
  })

  it('includes address in payload when provided (trimmed)', async () => {
    mockedRegisterUser.mockResolvedValue('ok')
    renderWithProviders(<Register />)
    const u = userEvent.setup()
    await fillRequiredFields(u)

    await u.type(screen.getByLabelText(/address/i), '  City, Street  ')
    await u.click(screen.getByRole('button', { name: /create account/i }))

    expect(mockedRegisterUser).toHaveBeenCalledWith(
      expect.objectContaining({ address: 'City, Street' })
    )
  })
})