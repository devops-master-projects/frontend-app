import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import LandingPage from '../../app/LandingPage'

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>)
}

describe('LandingPage', () => {
  it('shows heading and actions', () => {
    renderWithTheme(<LandingPage />)
    expect(screen.getByRole('heading', { name: /your stay/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/auth/login')
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/auth/register')
  })
})
