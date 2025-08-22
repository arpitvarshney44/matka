// Server-side helper for gamerates
function computeRateMetrics(min, max) {
  if (typeof min !== 'number' || typeof max !== 'number' || min <= 0 || max <= 0) {
    return { multiplier: 0, roiPercent: 0 };
  }
  const multiplier = max / min;
  const roiPercent = ((max - min) / min) * 100;
  return { multiplier, roiPercent };
}

function payoutFromRate(min, max, stake) {
  if (!min || !max || !stake) return 0;
  return (Number(stake) / Number(min)) * Number(max);
}

module.exports = { computeRateMetrics, payoutFromRate };

