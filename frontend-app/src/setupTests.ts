import '@testing-library/jest-dom'

import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll } from 'vitest';

export const server = setupServer(
  http.get('/api/health', () => HttpResponse.json({ ok: true }))
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

