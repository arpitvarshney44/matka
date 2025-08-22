// Admin client helpers mirroring user client to keep parity
export function computeRateMetrics(min, max) {
  if (typeof min !== 'number' || typeof max !== 'number' || min <= 0 || max <= 0) {
    return { multiplier: 0, roiPercent: 0, payoutForStake: () => 0 };
  }
  const multiplier = max / min;
  const roiPercent = ((max - min) / min) * 100;
  const payoutForStake = (stake) => {
    const s = Number(stake) || 0;
    if (s <= 0) return 0;
    return (s / min) * max;
  };
  return { multiplier, roiPercent, payoutForStake };
}

export function payoutFromRate(min, max, stake) {
  if (!min || !max || !stake) return 0;
  return (Number(stake) / Number(min)) * Number(max);
}

