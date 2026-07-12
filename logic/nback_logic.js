/**
 * nback_logic.js
 * Pure, testable logic for the N-Back working memory task.
 * No DOM/timing dependencies -- safe to unit test with Node
 * and to inline directly into the browser game.
 */

/**
 * Generate a stimulus sequence for an N-Back task.
 * @param {number} length - total number of trials
 * @param {number} n - the "N" in N-back (how many steps back to compare)
 * @param {string[]} alphabet - pool of possible stimuli (e.g. letters)
 * @param {number} targetRate - approx fraction of trials (after position n) that should be matches
 * @returns {Array<{stimulus: string, isMatch: boolean}>}
 */
function generateSequence(length, n, alphabet, targetRate) {
  if (length <= n) {
    throw new Error("Sequence length must be greater than n");
  }
  const sequence = [];
  for (let i = 0; i < length; i++) {
    let stimulus;
    let isMatch = false;
    if (i >= n && Math.random() < targetRate) {
      stimulus = sequence[i - n].stimulus;
      isMatch = true;
    } else {
      do {
        stimulus = alphabet[Math.floor(Math.random() * alphabet.length)];
      } while (i >= n && stimulus === sequence[i - n].stimulus);
      isMatch = i >= n && stimulus === sequence[i - n].stimulus; // stays false by construction
    }
    sequence.push({ stimulus, isMatch });
  }
  return sequence;
}

/**
 * Score a completed N-Back run.
 * @param {Array<{isMatch: boolean}>} sequence - ground truth sequence
 * @param {boolean[]} responses - whether the user pressed "match" on each trial
 * @param {number[]} reactionTimesMs - RT in ms for trials where user responded (NaN/undefined if no response)
 * @returns {object} scoring summary
 */
function scoreResponses(sequence, responses, reactionTimesMs) {
  if (sequence.length !== responses.length) {
    throw new Error("sequence and responses length mismatch");
  }
  let hits = 0, misses = 0, falseAlarms = 0, correctRejections = 0;
  const hitRTs = [];

  for (let i = 0; i < sequence.length; i++) {
    const truth = sequence[i].isMatch;
    const responded = responses[i];
    if (truth && responded) {
      hits++;
      if (reactionTimesMs && !isNaN(reactionTimesMs[i])) hitRTs.push(reactionTimesMs[i]);
    } else if (truth && !responded) {
      misses++;
    } else if (!truth && responded) {
      falseAlarms++;
    } else {
      correctRejections++;
    }
  }

  const totalTargets = hits + misses;
  const totalNonTargets = falseAlarms + correctRejections;
  const accuracy = sequence.length > 0
    ? (hits + correctRejections) / sequence.length
    : 0;
  const avgHitRT = hitRTs.length > 0
    ? hitRTs.reduce((a, b) => a + b, 0) / hitRTs.length
    : null;

  return {
    hits, misses, falseAlarms, correctRejections,
    totalTargets, totalNonTargets,
    accuracy, avgHitRT,
    hitRate: totalTargets > 0 ? hits / totalTargets : null,
    falseAlarmRate: totalNonTargets > 0 ? falseAlarms / totalNonTargets : null,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { generateSequence, scoreResponses };
}
