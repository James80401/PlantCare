import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Layout from './Layout';

const mockAuth = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuth(),
}));

vi.mock('../context/BuddyCompanionContext', () => ({
  BuddyCompanionProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useBuddyCompanion: () => ({ missing: true }),
}));

vi.mock('../hooks/buddy/useBuddyQuestBadge', () => ({
  useBuddyQuestBadge: () => 0,
}));

vi.mock('../hooks/usePushNotifications', () => ({
  usePushNotifications: vi.fn(),
}));

vi.mock('./buddy/BuddyFloatingCompanion', () => ({
  default: () => null,
}));

function renderLayout(path = '/garden') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/garden" element={<Layout />}>
          <Route index element={<p>Dashboard content</p>} />
          <Route path="settings" element={<p>Settings content</p>} />
          <Route path="community" element={<p>Community content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('Layout mobile navigation', () => {
  beforeEach(() => {
    mockAuth.mockReturnValue({
      user: { email: 'admin@example.com', isAdmin: true },
      logout: vi.fn(),
      isPremium: false,
    });
  });

  it('keeps mobile primary navigation to the core tap targets', () => {
    renderLayout();

    const mobileNav = screen.getByRole('navigation', { name: 'Primary' });

    expect(within(mobileNav).getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('link', { name: /garden/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('link', { name: /house/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('link', { name: /browse/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('link', { name: /tips/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('button', { name: /more/i })).toBeInTheDocument();
    expect(within(mobileNav).getAllByRole('link')).toHaveLength(5);
  });

  it('keeps admin and settings reachable from the mobile more menu', () => {
    renderLayout('/garden/settings');

    const mobileNav = screen.getByRole('navigation', { name: 'Primary' });
    const moreButton = within(mobileNav).getByRole('button', { name: /more/i });

    expect(moreButton).toHaveClass('bg-emerald-800');

    fireEvent.click(moreButton);

    const moreMenu = document.getElementById('mobile-more-menu');
    expect(within(mobileNav).getByRole('link', { name: /settings/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(mobileNav).getByRole('link', { name: /admin/i })).toBeInTheDocument();
    expect(moreMenu).toHaveClass('overflow-y-auto');
  });
});
