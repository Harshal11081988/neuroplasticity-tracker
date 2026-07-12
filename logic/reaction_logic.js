/**
 * reaction_logic.js
 * Pure, testable logic for simple reaction time measurement.
 */

/**
 * Compute summary statistics for a set of reaction times, excluding
 * a configurable number of warmup trials (the first attempt is
 * typically slower/anticipatory and not representative).
 * @param {number[]} rtArrayMs - raw reaction times in milliseconds, in trial order
 * @param {number} warmupTrials - number of leading trials to discard
 * @returns {object} summary stats, or nulls if insufficient data
 */
function computeStats(rtArrayMs, warmupTrials = 1) {
  const valid = rtArrayMs.slice(warmupTrials).filter((v) => typeof v === "number" && !isNaN(v) && v > 0);

  if (valid.length === 0) {
    return { mean: null, median: null, sd: null, min: null, max: null, n: 0 };
  }

  const sorted = [...valid].sort((a, b) => a - b);
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
  const variance = valid.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / valid.length;
  const sd = Math.sqrt(variance);

  return {
    mean: Math.round(mean),
    median: Math.round(median),
    sd: Math.round(sd),
    min: Math.round(sorted[0]),
    max: Math.round(sorted[sorted.length - 1]),
    n: valid.length,
  };
}

/**
 * Flag a trial as a likely false start (anticipatory click before
 * the stimulus actually appeared) -- reaction times below ~100ms
 * are physiologically implausible for simple visual RT.
 * @param {number} rtMs
 * @returns {boolean}
 */
function isFalseStart(rtMs) {
  return typeof rtMs === "number" && rtMs < 100;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { computeStats, isFalseStart };
}
