import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ThemeProvider from '../../app/providers/ThemeProvider'

describe('ThemeProvider', () => {
  it('renders children', () => {
    render(
      <ThemeProvider>
        <div>child</div>
      </ThemeProvider>
    )
    expect(screen.getByText('child')).toBeInTheDocument()
  })
})
