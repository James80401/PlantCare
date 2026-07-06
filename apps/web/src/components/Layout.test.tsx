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
          <Route path="tasks" element={<p>Tasks content</p>} />
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

  it('closes the mobile more menu with Escape', () => {
    renderLayout('/garden/settings');

    const mobileNav = screen.getByRole('navigation', { name: 'Primary' });
    const moreButton = within(mobileNav).getByRole('button', { name: /more/i });

    fireEvent.click(moreButton);
    expect(document.getElementById('mobile-more-menu')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(document.getElementById('mobile-more-menu')).not.toBeInTheDocument();
    expect(moreButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps the skip-link target focusable and visible focus styles on shell nav', () => {
    renderLayout('/garden/community');

    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    const main = document.getElementById('main-content');
    const desktopNav = screen.getByRole('navigation', { name: 'Main' });
    const activeDesktopLink = within(desktopNav).getByRole('link', { name: /tips/i });
    const mobileNav = screen.getByRole('navigation', { name: 'Primary' });
    const activeMobileLink = within(mobileNav).getByRole('link', { name: /tips/i });

    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(main).toHaveAttribute('tabindex', '-1');
    fireEvent.click(skipLink);
    expect(document.activeElement).toBe(main);
    expect(activeDesktopLink).toHaveAttribute('aria-current', 'page');
    expect(activeDesktopLink).toHaveClass('focus-visible:ring-2');
    expect(activeMobileLink).toHaveAttribute('aria-current', 'page');
    expect(activeMobileLink).toHaveClass('focus-visible:ring-2');
  });

  it('announces More as the current section for secondary routes', () => {
    renderLayout('/garden/tasks');

    const mobileNav = screen.getByRole('navigation', { name: 'Primary' });
    const mobileMoreButton = within(mobileNav).getByRole('button', {
      name: /more\s*,\s*current section/i,
    });
    const desktopNav = screen.getByRole('navigation', { name: 'Main' });
    const desktopMoreButton = within(desktopNav).getByRole('button', {
      name: /more\s*,\s*current section/i,
    });

    expect(mobileMoreButton).toHaveClass('bg-emerald-800');
    expect(desktopMoreButton).toHaveClass('bg-white/12');

    fireEvent.click(mobileMoreButton);

    expect(within(mobileNav).getByRole('group', { name: 'More navigation' })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('link', { name: /tasks/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
