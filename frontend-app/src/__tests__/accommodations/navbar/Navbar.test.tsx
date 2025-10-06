/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/* ---------- 🧭 MOCK useNavigate (async factory so we can spread real exports) ---------- */
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/* ---------- 🧭 MOCK MUI DatePickers ---------- */
vi.mock('@mui/x-date-pickers', () => ({
  LocalizationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DatePicker: (props: { label: string; onChange?: (d: Date | null) => void }) => (
    <input
      aria-label={props.label}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        props.onChange?.(val ? new Date(val) : null);
      }}
    />
  ),
}));
vi.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
  AdapterDateFns: class {},
  default: class {},
}));

/* ---------- ⚙️ MUI Icons + Tooltip minimal mocks ---------- */
vi.mock('@mui/icons-material', () => ({
  Home: () => <span data-testid="icon-home" />,
  Search: () => <span data-testid="icon-search" />,
  Login: () => <span data-testid="icon-login" />,
  PersonAdd: () => <span data-testid="icon-signup" />,
}));
vi.mock('@mui/material', async (orig) => {
  const actual: any = await orig();
  return {
    ...actual,
    Tooltip: ({ title, children }: any) => <div title={title}>{children}</div>,
  };
});

/* ---------- 📦 Import Component ---------- */
import Navbar from '../../../features/accommodations/navbar/Navbar';
import { MemoryRouter } from 'react-router-dom';

describe('Navbar (unauthenticated)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates to login and register when icon buttons clicked', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    // Buttons: Home, Login, Sign Up
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);

    // Login click
    await user.click(buttons[1]);
    expect(mockNavigate).toHaveBeenCalledWith('/auth/login');

    // Sign up click
    await user.click(buttons[2]);
    expect(mockNavigate).toHaveBeenCalledWith('/auth/register');
  });

  it('calls onHome when provided instead of navigating', async () => {
    const onHome = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Navbar onHome={onHome} />
      </MemoryRouter>
    );

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);
    expect(onHome).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalledWith('/accommodations');
  });

  it('shows search when enabled and submits filters', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Navbar enableSearch onSearch={onSearch} />
      </MemoryRouter>
    );

    const buttons = screen.getAllByRole('button');
    // enableSearch=true -> Home, Search, Login, SignUp
    await user.click(buttons[1]); // open search bar

    const locationInput = await screen.findByLabelText(/location/i);
    const guestsInput = screen.getByLabelText(/guests/i);
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);
    const submit = screen.getByRole('button', { name: /search/i });

    await user.clear(locationInput);
    await user.type(locationInput, 'Paris');

    await user.clear(guestsInput);
    await user.type(guestsInput, '3');

    fireEvent.change(startDateInput, { target: { value: '2025-10-01' } });
    fireEvent.change(endDateInput, { target: { value: '2025-10-05' } });

    await user.click(submit);

    expect(onSearch).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(onSearch).mock.calls[0][0];
    expect(arg.location).toBe('Paris');
    expect(arg.guests).toBe(3);
    expect(arg.startDate).toBe('2025-10-01');
    expect(arg.endDate).toBe('2025-10-05');
  });
});
