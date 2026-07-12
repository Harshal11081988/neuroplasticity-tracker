/**
 * corsi_logic.js
 * Pure, testable logic for the Corsi Block-Tapping Span task
 * (visuospatial working memory: reproduce an increasingly long
 * sequence of flashed block positions in order).
 */

/**
 * Generate a random sequence of block indices, avoiding immediate repeats.
 * @param {number} length
 * @param {number} numBlocks
 * @returns {number[]} sequence of block indices (0-indexed)
 */
function generateSequence(length, numBlocks) {
  if (numBlocks < 2) throw new Error("numBlocks must be at least 2");
  const sequence = [];
  for (let i = 0; i < length; i++) {
    let block;
    do {
      block = Math.floor(Math.random() * numBlocks);
    } while (i > 0 && block === sequence[i - 1]);
    sequence.push(block);
  }
  return sequence;
}

/**
 * Compare a user's click sequence against the correct sequence.
 * @param {number[]} userClicks
 * @param {number[]} correctSequence
 * @returns {{correct: boolean, firstErrorIndex: number|null}}
 */
function checkSequence(userClicks, correctSequence) {
  if (userClicks.length !== correctSequence.length) {
    // Compare only up to the shorter length to find divergence point
    const minLen = Math.min(userClicks.length, correctSequence.length);
    for (let i = 0; i < minLen; i++) {
      if (userClicks[i] !== correctSequence[i]) {
        return { correct: false, firstErrorIndex: i };
      }
    }
    return { correct: false, firstErrorIndex: minLen };
  }
  for (let i = 0; i < correctSequence.length; i++) {
    if (userClicks[i] !== correctSequence[i]) {
      return { correct: false, firstErrorIndex: i };
    }
  }
  return { correct: true, firstErrorIndex: null };
}

/**
 * Run the adaptive span-staircase logic: given a history of pass/fail
 * results per span length, determine the final "Corsi span" score
 * using the standard convention (longest span with at least one
 * correct trial, following two consecutive failures at the next level
 * to terminate).
 * @param {Array<{span: number, correct: boolean}>} trialHistory
 * @returns {number} final span score
 */
function computeFinalSpan(trialHistory) {
  let maxCorrectSpan = 0;
  for (const trial of trialHistory) {
    if (trial.correct && trial.span > maxCorrectSpan) {
      maxCorrectSpan = trial.span;
    }
  }
  return maxCorrectSpan;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { generateSequence, checkSequence, computeFinalSpan };
}
