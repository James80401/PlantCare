import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { billingApi } from '../services/api';
import Subscription from './Subscription';

const refreshUser = vi.fn().mockResolvedValue(undefined);

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ refreshUser }),
}));

vi.mock('../components/ui/HelpButton', () => ({
  HelpButton: () => null,
}));

vi.mock('../services/api', () => ({
  billingApi: {
    status: vi.fn(),
    checkout: vi.fn(),
    portal: vi.fn(),
  },
}));

describe('Subscription billing gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the gated beta state without calling billing APIs by default', async () => {
    render(
      <MemoryRouter>
        <Subscription />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(
        'Premium billing is not open yet. Current approved accounts keep full beta access.',
      ),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Beta access is active'),
    ).toBeInTheDocument();
    expect(billingApi.status).not.toHaveBeenCalled();
    expect(billingApi.checkout).not.toHaveBeenCalled();
    expect(billingApi.portal).not.toHaveBeenCalled();
    expect(refreshUser).toHaveBeenCalledTimes(1);
  });
});
