import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';

interface Options extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  path?: string;
  withAuth?: boolean;
  routes?: Array<{ path: string; element: ReactNode }>;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderApp(ui: ReactElement, options: Options = {}) {
  const {
    route = '/',
    path = '/',
    withAuth = false,
    routes,
    ...renderOptions
  } = options;
  const queryClient = createQueryClient();

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        {withAuth ? <AuthProvider>{children}</AuthProvider> : children}
      </MemoryRouter>
    </QueryClientProvider>
  );

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });
  return { ...result, queryClient };
}

/** Renders `ui` as the element for `path`, with optional extra routes for redirect assertions. */
export function renderRoute(element: ReactElement, options: Options = {}) {
  const { path = '/', routes = [], ...rest } = options;
  const tree = (
    <Routes>
      <Route path={path} element={element} />
      <Route path="/" element={<div>Dashboard home</div>} />
      {routes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
    </Routes>
  );
  return renderApp(tree, { path, ...rest });
}

export function envelope<T>(data: T) {
  return {
    success: true,
    data,
    message: null,
    timestamp: new Date().toISOString(),
  };
}
