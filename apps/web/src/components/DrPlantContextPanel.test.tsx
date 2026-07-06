import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DrPlantContextPanel from './DrPlantContextPanel';
import { diagnosisApi } from '../services/api';

vi.mock('../services/api', () => ({
  diagnosisApi: { getContextSummary: vi.fn() },
}));

const getContextSummary = vi.mocked(diagnosisApi.getContextSummary);

describe('DrPlantContextPanel', () => {
  beforeEach(() => {
    getContextSummary.mockReset();
  });

  it('renders the intro and context chips when the summary loads', async () => {
    getContextSummary.mockResolvedValue({
      data: {
        intro: 'Dr. Plant tailors answers using your recent care:',
        items: [
          { category: 'care', label: 'Care baseline', detail: 'Living room - medium pot' },
          { category: 'health', label: 'Open issue: Overwatering', detail: 'Noted Jun 2' },
        ],
      },
    } as never);

    render(<DrPlantContextPanel plantId="plant-1" />);

    expect(await screen.findByText('Care baseline')).toBeInTheDocument();
    expect(screen.getByText('Open issue: Overwatering')).toBeInTheDocument();
    expect(screen.getByText(/What Dr\. Plant sees/)).toBeInTheDocument();
    expect(screen.getByText('2 signals')).toBeInTheDocument();
    expect(screen.getByText(/Plant Check-Ins/)).toBeInTheDocument();
    expect(getContextSummary).toHaveBeenCalledWith('plant-1');
  });

  it('renders nothing when the summary has no items', async () => {
    getContextSummary.mockResolvedValue({
      data: { intro: 'x', items: [] },
    } as never);

    const { container } = render(<DrPlantContextPanel plantId="plant-1" />);

    await waitFor(() => expect(getContextSummary).toHaveBeenCalled());
    expect(screen.queryByText(/What Dr\. Plant sees/)).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the request fails', async () => {
    getContextSummary.mockRejectedValue(new Error('network'));

    const { container } = render(<DrPlantContextPanel plantId="plant-1" />);

    await waitFor(() => expect(getContextSummary).toHaveBeenCalled());
    expect(screen.queryByText(/What Dr\. Plant sees/)).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
