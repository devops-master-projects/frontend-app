import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest'
import { fireEvent, render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { BrowserRouter } from 'react-router-dom'

// Mock the navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../features/accommodations/navbar/Navbar.tsx', () => ({
  default: () => <div data-testid="mock-navbar" />,
}));


vi.mock('../../features/auth/api/authApi', () => ({
  loginUser: vi.fn(),
}))

import Login from '../../features/auth/pages/Login'
import { loginUser } from '../../features/auth/api/authApi'

const mockedLoginUser = loginUser as MockedFunction<typeof loginUser>

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>
    </BrowserRouter>
  )
}

async function fillLoginFields(
  u = userEvent.setup(),
  { username = 'testuser', password = 'password123' } = {}
) {
  await u.type(screen.getByLabelText(/username/i), username)
  await u.type(screen.getByLabelText(/password/i), password)
}

const mockLoginResponse = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'Bearer',
  expires_in: 3600,
  scope: 'openid profile',
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockReset()
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('starts with submit disabled and no alerts', () => {
    renderWithProviders(<Login />)
    const submit = screen.getByRole('button', { name: /sign in/i })
    expect(submit).toBeDisabled()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('enables submit when both username and password are filled', async () => {
    renderWithProviders(<Login />)
    const u = userEvent.setup()
    
    const submit = screen.getByRole('button', { name: /sign in/i })
    expect(submit).toBeDisabled()

    await u.type(screen.getByLabelText(/username/i), 'testuser')
    expect(submit).toBeDisabled() // Still disabled with only username

    await u.type(screen.getByLabelText(/password/i), 'password')
    expect(submit).toBeEnabled() // Now enabled with both fields
  })

  it('trims username and sends correct payload on submit', async () => {
    mockedLoginUser.mockResolvedValue(mockLoginResponse)
    renderWithProviders(<Login />)
    const u = userEvent.setup()
    
    await fillLoginFields(u, { username: '  testuser  ', password: 'password123' })
    await u.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockedLoginUser).toHaveBeenCalledTimes(1)
    expect(mockedLoginUser).toHaveBeenCalledWith({
      username: 'testuser', // trimmed
      password: 'password123', // not trimmed
    })
  })

  it('stores tokens in localStorage and navigates on successful login', async () => {
    mockedLoginUser.mockResolvedValue(mockLoginResponse)
    renderWithProviders(<Login />)
    const u = userEvent.setup()
    
    await fillLoginFields(u)
    await u.click(screen.getByRole('button', { name: /sign in/i }))

    // Wait for async operations to complete
    await vi.waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('mock-access-token')
      expect(localStorage.getItem('refresh_token')).toBe('mock-refresh-token')
      expect(localStorage.getItem('token_type')).toBe('Bearer')
      expect(mockNavigate).toHaveBeenCalledWith('/accommodations')
    })
  })

  it('shows error alert on login failure and can be dismissed', async () => {
    mockedLoginUser.mockRejectedValue(new Error('Authentication failed: Invalid credentials'))
    renderWithProviders(<Login />)
    const u = userEvent.setup()
    
    await fillLoginFields(u)
    await u.click(screen.getByRole('button', { name: /sign in/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/authentication failed: invalid credentials/i)

    // Test dismissing the alert
    const closeBtn = screen.getByRole('button', { name: /close/i })
    await u.click(closeBtn)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows loading state, disables button, and prevents double submit', async () => {
    let resolve!: (v: unknown) => void
    const deferred = new Promise((res) => (resolve = res))
    mockedLoginUser.mockImplementation(() => deferred as Promise<typeof mockLoginResponse>)

    renderWithProviders(<Login />)
    const u = userEvent.setup()
    await fillLoginFields(u)

    const submit = screen.getByRole('button', { name: /sign in/i })
    await u.click(submit)

    // Check loading state
    expect(screen.getByRole('button', { name: /signing in…/i })).toBeDisabled()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()

    // Try to click the disabled button (should not trigger another call)
    const loadingBtn = screen.getByRole('button', { name: /signing in…/i })
    fireEvent.click(loadingBtn)
    expect(mockedLoginUser).toHaveBeenCalledTimes(1) // Still only called once

    // Resolve the promise in act to avoid warnings
    await act(async () => {
      resolve(mockLoginResponse)
    })
  })

  it('does not submit with empty username', async () => {
    renderWithProviders(<Login />)
    const u = userEvent.setup()
    
    await u.type(screen.getByLabelText(/password/i), 'password123')
    const submit = screen.getByRole('button', { name: /sign in/i })
    expect(submit).toBeDisabled()
  })

  it('does not submit with empty password', async () => {
    renderWithProviders(<Login />)
    const u = userEvent.setup()
    
    await u.type(screen.getByLabelText(/username/i), 'testuser')
    const submit = screen.getByRole('button', { name: /sign in/i })
    expect(submit).toBeDisabled()
  })

  it('does not submit with only whitespace username', async () => {
    renderWithProviders(<Login />)
    const u = userEvent.setup()
    
    await u.type(screen.getByLabelText(/username/i), '   ')
    await u.type(screen.getByLabelText(/password/i), 'password123')
    const submit = screen.getByRole('button', { name: /sign in/i })
    expect(submit).toBeDisabled()
  })

  it('does not submit with only whitespace password', async () => {
    renderWithProviders(<Login />)
    const u = userEvent.setup()
    
    await u.type(screen.getByLabelText(/username/i), 'testuser')
    await u.type(screen.getByLabelText(/password/i), '   ')
    const submit = screen.getByRole('button', { name: /sign in/i })
    expect(submit).toBeDisabled()
  })

  it('handles non-Error exceptions in catch block', async () => {
    mockedLoginUser.mockRejectedValue('String error')
    renderWithProviders(<Login />)
    const u = userEvent.setup()
    
    await fillLoginFields(u)
    await u.click(screen.getByRole('button', { name: /sign in/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('String error')
  })

  it('shows default error message for falsy error values', async () => {
    // Mock with empty string instead of null
    mockedLoginUser.mockRejectedValue('')
    renderWithProviders(<Login />)
    const u = userEvent.setup()
    
    await fillLoginFields(u)
    await u.click(screen.getByRole('button', { name: /sign in/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Login failed')
  })

  it('has correct form structure and accessibility', () => {
    renderWithProviders(<Login />)
    
    // Check form element by tag name instead of role
    const form = document.querySelector('form')
    expect(form).toBeInTheDocument()
    
    // Check required fields
    expect(screen.getByLabelText(/username/i)).toBeRequired()
    expect(screen.getByLabelText(/password/i)).toBeRequired()
    
    // Check password field type
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password')
    
    // Check autofocus on username
    expect(screen.getByLabelText(/username/i)).toHaveFocus()
  })

  it('contains link to registration page', () => {
    renderWithProviders(<Login />)
    
    const registerLink = screen.getByRole('link', { name: /create one here/i })
    expect(registerLink).toHaveAttribute('href', '/auth/register')
  })

  it('prevents form submission on Enter when form is invalid', async () => {
    renderWithProviders(<Login />)
    const u = userEvent.setup()
    
    const usernameField = screen.getByLabelText(/username/i)
    await u.type(usernameField, 'testuser')
    // No password entered
    
    await u.type(usernameField, '{enter}')
    
    expect(mockedLoginUser).not.toHaveBeenCalled()
  })

  it('submits form on Enter when form is valid', async () => {
    mockedLoginUser.mockResolvedValue(mockLoginResponse)
    renderWithProviders(<Login />)
    const u = userEvent.setup()
    
    await fillLoginFields(u)
    
    const passwordField = screen.getByLabelText(/password/i)
    await u.type(passwordField, '{enter}')
    
    expect(mockedLoginUser).toHaveBeenCalledTimes(1)
  })
})