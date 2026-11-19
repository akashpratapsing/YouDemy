import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { useAuth } from '@/auth/AuthContext';
import { api, TOKEN_KEY } from '@/lib/api';
import { envelope, renderRoute } from '@/test/utils';

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'student@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function apiError(message: string) {
  return new AxiosError(
    message,
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
    {
      data: { success: false, code: 'INVALID_CREDENTIALS', message, timestamp: '', path: '/api/auth/login' },
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: {} as never,
    },
  );
}

describe('authentication flows', () => {
  it('signs in, stores the token, and redirects to the requested page', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({
      data: envelope({ token: 'login-token', tokenType: 'Bearer', user }),
    } as never);

    renderRoute(<LoginPage />, { route: '/login', path: '/login', withAuth: true });
    const userEventSetup = userEvent.setup();

    await userEventSetup.type(screen.getByLabelText(/email address/i), user.email);
    await userEventSetup.type(screen.getByLabelText('Password', { exact: true }), 'password123');
    await userEventSetup.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Dashboard home')).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_KEY)).toBe('login-token');
    expect(post).toHaveBeenCalledWith('/auth/login', {
      email: user.email,
      password: 'password123',
    });
  });

  it('shows a server error message when credentials are rejected', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(apiError('Invalid email or password.'));

    renderRoute(<LoginPage />, { route: '/login', path: '/login', withAuth: true });
    const userEventSetup = userEvent.setup();

    await userEventSetup.type(screen.getByLabelText(/email address/i), user.email);
    await userEventSetup.type(screen.getByLabelText('Password', { exact: true }), 'wrong-password');
    await userEventSetup.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('validates registration input before calling the API', async () => {
    const post = vi.spyOn(api, 'post');

    renderRoute(<RegisterPage />, { route: '/register', path: '/register', withAuth: true });
    const userEventSetup = userEvent.setup();

    await userEventSetup.type(screen.getByLabelText(/email address/i), user.email);
    await userEventSetup.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEventSetup.type(screen.getByLabelText(/confirm password/i), 'different123');
    await userEventSetup.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Passwords do not match.');
    expect(post).not.toHaveBeenCalled();
  });

  it('registers a new account and starts an authenticated session', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({
      data: envelope({ token: 'register-token', tokenType: 'Bearer', user }),
    } as never);

    renderRoute(<RegisterPage />, { route: '/register', path: '/register', withAuth: true });
    const userEventSetup = userEvent.setup();

    await userEventSetup.type(screen.getByLabelText(/email address/i), user.email);
    await userEventSetup.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEventSetup.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEventSetup.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Dashboard home')).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_KEY)).toBe('register-token');
    expect(post).toHaveBeenCalledWith('/auth/register', {
      email: user.email,
      password: 'password123',
    });
  });

  it('restores an existing session from the stored token', async () => {
    localStorage.setItem(TOKEN_KEY, 'stored-token');
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: envelope(user) } as never);

    function SessionProbe() {
      const { user: currentUser, isLoading } = useAuth();
      return <div>{isLoading ? 'Checking session' : (currentUser?.email ?? 'Anonymous')}</div>;
    }

    renderRoute(<SessionProbe />, { withAuth: true });

    expect(await screen.findByText(user.email)).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith('/auth/me');
  });
});
