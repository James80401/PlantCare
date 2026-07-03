import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HelpButton } from './HelpButton';
import { HELP_TOPICS } from '../../content/helpTopics';

describe('HelpButton', () => {
  it('does not render the panel until clicked', () => {
    render(<HelpButton topic="dashboard" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the panel with the topic title and every tip on click', () => {
    render(<HelpButton topic="dashboard" />);
    fireEvent.click(screen.getByRole('button', { name: /help: your garden at a glance/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(HELP_TOPICS.dashboard.title)).toBeInTheDocument();
    for (const tip of HELP_TOPICS.dashboard.tips) {
      expect(screen.getByText(tip)).toBeInTheDocument();
    }
  });

  it('closes on Escape', () => {
    render(<HelpButton topic="settings" />);
    fireEvent.click(screen.getByRole('button', { name: /help/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on backdrop click and on the close button', () => {
    render(<HelpButton topic="tasks" />);

    fireEvent.click(screen.getByRole('button', { name: /help/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /help/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Close help' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
