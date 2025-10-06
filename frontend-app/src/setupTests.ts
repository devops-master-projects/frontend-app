import '@testing-library/jest-dom'
import React from 'react'

import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

export const server = setupServer(
  http.get('/api/health', () => HttpResponse.json({ ok: true }))
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Reduce file handles by mocking MUI icons to lightweight stubs in tests
vi.mock('@mui/icons-material', () => new Proxy({}, {
  get: () => () => null,
}))

// Mock MUI X Date Pickers to lightweight stubs to avoid heavy jsdom work
vi.mock('@mui/x-date-pickers', () => ({
  DatePicker: () => null,
  LocalizationProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock AdapterDateFns export used by LocalizationProvider
vi.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
  AdapterDateFns: class {},
  default: class {},
}))


