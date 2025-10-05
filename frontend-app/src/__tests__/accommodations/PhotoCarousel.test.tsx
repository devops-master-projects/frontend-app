import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@mui/icons-material', () => ({
  KeyboardArrowLeft: () => null,
  KeyboardArrowRight: () => null,
}))
vi.mock('react-swipeable-views', () => ({
  __esModule: true,
  default: (props: any) => props.children,
}))

import PhotoCarousel from '../../features/accommodations/pages/PhotoCarousel'

describe('PhotoCarousel', () => {
  it('returns null when no photos', () => {
    const { container } = render(<PhotoCarousel photos={[]} name="X" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders images and stepper when multiple photos', () => {
    render(<PhotoCarousel photos={["/a.jpg", "/b.jpg"]} name="Place" />)
    expect(screen.getAllByRole('img').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })
})
