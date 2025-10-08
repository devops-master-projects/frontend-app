import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../../app/App'

describe('App', () => {
  it('renders LandingPage content', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /book/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/auth/login')
  })
})
