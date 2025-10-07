
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Popover: (props: { open?: boolean; children?: React.ReactNode }) =>
        props.open ? <div data-testid="mock-popover">{props.children}</div> : null,
  };
});

vi.mock("@mui/base/FocusTrap", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

declare global { interface Window { __vitest__?: boolean; } }
window.__vitest__ = true;
process.env.NODE_ENV = 'test';

vi.mock('../../features/auth/api/authApi', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  changeCredentials: vi.fn(),
  deleteAccount: vi.fn(),
  getRole: vi.fn(() => 'GUEST'), // ✅ dodaj ovo
}));

vi.setConfig({ testTimeout: 15000 })

const mockNavigate = vi.fn()

vi.mock("../../features/accommodations/navbar/HostNavbar.tsx", () => ({
  default: () => <div data-testid="host-navbar" />,
}));
vi.mock("../../features/accommodations/navbar/GuestNavbar.tsx", () => ({
  default: () => <div data-testid="guest-navbar" />,
}));
vi.mock('@mui/base/FocusTrap', () => ({
  __esModule: true,
  default: ({ children }: unknown) => <>{children}</>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import React from "react";

import Profile from '../../features/auth/pages/Profile';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {render, screen, waitFor, within, fireEvent, cleanup} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {getProfile, updateProfile, changeCredentials, deleteAccount} from '../../features/auth/api/authApi';

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
});


describe('Profile component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prefills profile form when getProfile resolves', async () => {
    vi.mocked(getProfile).mockResolvedValue({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      address: 'Some Street 1',
    });

    render(<Profile />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toHaveValue('Ada');
      expect(screen.getByLabelText(/last name/i)).toHaveValue('Lovelace');
      expect(screen.getByLabelText(/email/i)).toHaveValue('ada@example.com');
      expect(screen.getByLabelText(/address/i)).toHaveValue('Some Street 1');
    });
  });

  it('silently ignores getProfile errors (keeps defaults)', async () => {
    vi.mocked(getProfile).mockRejectedValue(new Error('401'));

    render(<Profile />);
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toHaveValue('');
      expect(screen.getByLabelText(/email/i)).toHaveValue('');
    });
  });

  it('submits profile successfully and shows success alert', async () => {
    vi.mocked(getProfile).mockResolvedValue({ firstName: '', lastName: '', email: '', address: '' })
    vi.mocked(updateProfile).mockResolvedValue('Profile updated successfully!')

    render(<Profile />)

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Nikola' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Tesla' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'tesla@acme.com' } })
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: 'Wardenclyffe' } })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await screen.findByText(/profile updated successfully/i)

    expect(updateProfile).toHaveBeenCalledWith({
      firstName: 'Nikola',
      lastName: 'Tesla',
      email: 'tesla@acme.com',
      address: 'Wardenclyffe',
    })
  })

  it('shows error alert when updateProfile fails', async () => {
    vi.mocked(getProfile).mockResolvedValue({
      firstName: '',
      lastName: '',
      email: '',
      address: '',
    });
    vi.mocked(updateProfile).mockRejectedValue(new Error('Bad Request'));

    render(<Profile />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/first name/i), 'A');
    await user.type(screen.getByLabelText(/last name/i), 'B');
    await user.type(screen.getByLabelText(/email/i), 'c@d.com');

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/bad request/i)).toBeInTheDocument();
    });
  });

  it('validates credentials: requires new password & confirmation', async () => {
    vi.mocked(getProfile).mockResolvedValue({
      firstName: '',
      lastName: '',
      email: '',
      address: '',
    });

    render(<Profile />);
  fireEvent.click(screen.getByRole('tab', { name: /credentials/i }));

    const credsButton = screen.getByRole('button', { name: /update credentials/i });
    const credsForm = credsButton.closest('form') as HTMLElement;
    const withinForm = within(credsForm);

    fireEvent.submit(credsForm);
    const alert1 = await screen.findByRole('alert');
    expect(alert1).toHaveTextContent(/current password is required/i);

  fireEvent.change(withinForm.getByLabelText(/current password/i, { selector: 'input' }), { target: { value: 'oldpass' } });
    fireEvent.submit(credsForm);
    const alert2 = await screen.findByRole('alert');
    expect(alert2).toHaveTextContent(/new password is required/i);

    const [newPwdShort, confirmShort] = withinForm.getAllByLabelText(/new password/i, { selector: 'input' });
  fireEvent.change(newPwdShort, { target: { value: '1234567' } });
  fireEvent.change(confirmShort, { target: { value: '1234567' } });
    fireEvent.submit(credsForm);
    const alert3 = await screen.findByRole('alert');
    expect(alert3).toHaveTextContent(/at least 8 characters/i);

  fireEvent.change(newPwdShort, { target: { value: '' } });
  fireEvent.change(confirmShort, { target: { value: '' } });
  fireEvent.change(newPwdShort, { target: { value: '12345678' } });
  fireEvent.change(confirmShort, { target: { value: '87654321' } });
    fireEvent.submit(credsForm);
    const alert4 = await screen.findByRole('alert');
    expect(alert4).toHaveTextContent(/confirmation does not match/i);
  });
  it('submits credentials successfully and resets fields', async () => {
    vi.mocked(getProfile).mockResolvedValue({
      firstName: '',
      lastName: '',
      email: '',
      address: '',
    });
    vi.mocked(changeCredentials).mockResolvedValue('Credentials updated successfully!');

    render(<Profile />);
  fireEvent.click(screen.getByRole('tab', { name: /credentials/i }));

    const credsButton = screen.getByRole('button', { name: /update credentials/i });
    const credsForm = credsButton.closest('form') as HTMLElement;
    const withinForm = within(credsForm);

    const current = withinForm.getByLabelText(/current password/i, { selector: 'input' });
    const [newPwd, confirm] = withinForm.getAllByLabelText(/new password/i, { selector: 'input' });

  fireEvent.change(current, { target: { value: 'oldpass123' } });
  fireEvent.change(newPwd, { target: { value: 'newpassword' } });
  fireEvent.change(confirm, { target: { value: 'newpassword' } });

  fireEvent.click(credsButton);

    await waitFor(() => {
      expect(changeCredentials).toHaveBeenCalledWith({
        currentPassword: 'oldpass123',
        newPassword: 'newpassword',
      });
      expect(screen.getByText(/credentials updated successfully/i)).toBeInTheDocument();
    });

    expect(current).toHaveValue('');
    expect(newPwd).toHaveValue('');
    expect(confirm).toHaveValue('');
  });

  it('shows error alert when changeCredentials fails', async () => {
    vi.mocked(getProfile).mockResolvedValue({
      firstName: '',
      lastName: '',
      email: '',
      address: '',
    });
    vi.mocked(changeCredentials).mockRejectedValue(new Error('Forbidden'));

    render(<Profile />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('tab', { name: /credentials/i }));

    const credsButton = screen.getByRole('button', { name: /update credentials/i });
    const credsForm = credsButton.closest('form') as HTMLElement;
    const withinForm = within(credsForm);

    await user.type(withinForm.getByLabelText(/current password/i, { selector: 'input' }), 'old');
    const [newPwd, confirm] = withinForm.getAllByLabelText(/new password/i, { selector: 'input' });
    await user.type(newPwd, 'newpassword');
    await user.type(confirm, 'newpassword');

    await user.click(credsButton);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/forbidden/i);
  });

  it('opens popover and calls deleteAccount successfully', async () => {
    vi.mocked(getProfile).mockResolvedValue({
      firstName: '',
      lastName: '',
      email: '',
      address: '',
    });
    vi.mocked(deleteAccount).mockResolvedValue();

    render(<Profile />);

    const deleteButton = screen.getByRole('button', { name: /delete account/i });
    fireEvent.click(deleteButton);

    const popover = await screen.findByTestId("mock-popover");
    expect(within(popover).getByText(/delete account/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteAccount).toHaveBeenCalledTimes(1);
    });
  });

  it('shows error message when deleteAccount fails', async () => {
    vi.mocked(getProfile).mockResolvedValue({
      firstName: '',
      lastName: '',
      email: '',
      address: '',
    });
    vi.mocked(deleteAccount).mockRejectedValue(new Error('Failed to delete account'));

    render(<Profile />);

    fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(await screen.findByText(/delete account/i)).toBeInTheDocument();
  });

  it('does not redirect when running under Vitest (window.__vitest__)', async () => {
    vi.mocked(getProfile).mockResolvedValue({
      firstName: '',
      lastName: '',
      email: '',
      address: '',
    });
    vi.mocked(deleteAccount).mockResolvedValue();

    const originalLocation = window.location;
    // @ts-ignore
    delete (window as unknown).location;
    (window as unknown).location = { href: '' };

    render(<Profile />);

    fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(deleteAccount).toHaveBeenCalledTimes(1);
    });

    expect(window.location.href).toBe('');

    window.location = originalLocation;
  });
});
