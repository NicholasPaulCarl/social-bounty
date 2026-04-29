/**
 * Unit tests for RewardCalculator — the sticky KPI sidebar on Step 4.
 * Tests focus on the rendered values (totals, breakdown lines, edge cases).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { RewardCalculator } from '../RewardCalculator';
import { Currency, RewardType } from '@social-bounty/shared';

describe('RewardCalculator', () => {
  it('renders the total bounty value prominently', () => {
    render(
      <RewardCalculator
        currency={Currency.ZAR}
        perClaimRewardValue={100}
        totalRewardValue={1000}
        maxSubmissions={10}
        rewardType={RewardType.CASH}
      />,
    );

    // The total is the largest number on screen
    expect(screen.getByText('1000.00')).toBeInTheDocument();
  });

  it('renders the per-claim and claim count in the meta line', () => {
    render(
      <RewardCalculator
        currency={Currency.ZAR}
        perClaimRewardValue={250}
        totalRewardValue={2500}
        maxSubmissions={10}
        rewardType={RewardType.CASH}
      />,
    );

    // Meta line: "10 claims × R250.00"
    expect(screen.getByText(/10/)).toBeInTheDocument();
    expect(screen.getByText(/claims/)).toBeInTheDocument();
    expect(screen.getByText(/250\.00/)).toBeInTheDocument();
  });

  it('uses singular "claim" when maxSubmissions is 1', () => {
    render(
      <RewardCalculator
        currency={Currency.USD}
        perClaimRewardValue={50}
        totalRewardValue={50}
        maxSubmissions={1}
        rewardType={RewardType.CASH}
      />,
    );

    // Both the meta line and the Claims breakdown row reflect 1 claim
    const claimEls = screen.getAllByText(/^1$/);
    expect(claimEls.length).toBeGreaterThan(0);
    // No "claims" plural text — only "claim"
    expect(screen.queryByText(/claims/)).not.toBeInTheDocument();
    expect(screen.getByText(/claim/)).toBeInTheDocument();
  });

  it('falls back to ×1 when maxSubmissions is null', () => {
    render(
      <RewardCalculator
        currency={Currency.USD}
        perClaimRewardValue={75}
        totalRewardValue={75}
        maxSubmissions={null}
        rewardType={RewardType.PRODUCT}
      />,
    );

    // Total = perClaim × 1 = 75.00
    expect(screen.getAllByText('75.00').length).toBeGreaterThan(0);
  });

  it('renders the reward type breakdown row with a human-readable label', () => {
    render(
      <RewardCalculator
        currency={Currency.ZAR}
        perClaimRewardValue={200}
        totalRewardValue={400}
        maxSubmissions={2}
        rewardType={RewardType.PRODUCT}
      />,
    );

    // "Product" label in the Reward type row
    expect(screen.getByText('Product')).toBeInTheDocument();
  });

  it('renders the correct currency symbol', () => {
    const { container } = render(
      <RewardCalculator
        currency={Currency.USD}
        perClaimRewardValue={100}
        totalRewardValue={300}
        maxSubmissions={3}
        rewardType={RewardType.CASH}
      />,
    );

    // At least one $ symbol should appear in the rendered output
    expect(container.textContent).toContain('$');
  });

  it('renders breakdown rows: Per claim and Total', () => {
    render(
      <RewardCalculator
        currency={Currency.ZAR}
        perClaimRewardValue={500}
        totalRewardValue={5000}
        maxSubmissions={10}
        rewardType={RewardType.SERVICE}
      />,
    );

    expect(screen.getByText('Per claim')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Claims')).toBeInTheDocument();
    expect(screen.getByText('Reward type')).toBeInTheDocument();
  });

  it('shows Service as a human-readable label', () => {
    render(
      <RewardCalculator
        currency={Currency.EUR}
        perClaimRewardValue={50}
        totalRewardValue={150}
        maxSubmissions={3}
        rewardType={RewardType.SERVICE}
      />,
    );

    expect(screen.getByText('Service')).toBeInTheDocument();
  });
});
