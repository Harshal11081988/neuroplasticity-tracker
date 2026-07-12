/**
 * test_logic.js
 * Run with: node test_logic.js
 * Validates the pure game-logic modules before they're embedded
 * into the browser-facing HTML games.
 */

const nback = require("./logic/nback_logic.js");
const corsi = require("./logic/corsi_logic.js");
const reaction = require("./logic/reaction_logic.js");

let passed = 0, failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${message}`);
  }
}

function assertClose(actual, expected, tolerance, message) {
  assert(Math.abs(actual - expected) <= tolerance, `${message} (got ${actual}, expected ~${expected})`);
}

// ---- N-Back tests ----
console.log("Testing nback_logic.js...");

const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H"];
const seq = nback.generateSequence(200, 2, alphabet, 0.3);
assert(seq.length === 200, "sequence has correct length");

// Verify isMatch flags are actually correct against the raw stimuli
let flagsCorrect = true;
for (let i = 2; i < seq.length; i++) {
  const shouldMatch = seq[i].stimulus === seq[i - 2].stimulus;
  if (shouldMatch !== seq[i].isMatch) flagsCorrect = false;
}
assert(flagsCorrect, "isMatch flags match actual stimulus repetition at n=2");

const matchCount = seq.filter((s) => s.isMatch).length;
const matchRate = matchCount / (seq.length - 2);
assertClose(matchRate, 0.3, 0.15, "match rate is roughly on target (200 trials, some variance expected)");

// Perfect responder: presses match exactly when isMatch is true
const perfectResponses = seq.map((s) => s.isMatch);
const perfectRTs = seq.map((s) => (s.isMatch ? 450 : NaN));
const perfectScore = nback.scoreResponses(seq, perfectResponses, perfectRTs);
assert(perfectScore.misses === 0, "perfect responder has zero misses");
assert(perfectScore.falseAlarms === 0, "perfect responder has zero false alarms");
assertClose(perfectScore.accuracy, 1.0, 0.001, "perfect responder has 100% accuracy");
assertClose(perfectScore.avgHitRT, 450, 0.001, "perfect responder avg RT matches input");

// Responder who never presses: all misses, correct rejections only for non-targets
const noResponses = seq.map(() => false);
const noScore = nback.scoreResponses(seq, noResponses, seq.map(() => NaN));
assert(noScore.hits === 0, "non-responder has zero hits");
assert(noScore.falseAlarms === 0, "non-responder has zero false alarms");
assert(noScore.misses === matchCount, "non-responder misses equal total actual targets");

try {
  nback.generateSequence(2, 2, alphabet, 0.3);
  assert(false, "should throw when length <= n");
} catch (e) {
  assert(true, "correctly throws when sequence length <= n");
}

// ---- Corsi tests ----
console.log("Testing corsi_logic.js...");

const corsiSeq = corsi.generateSequence(6, 9);
assert(corsiSeq.length === 6, "corsi sequence has correct length");
assert(corsiSeq.every((b) => b >= 0 && b < 9), "all block indices in valid range");
let noImmediateRepeats = true;
for (let i = 1; i < corsiSeq.length; i++) {
  if (corsiSeq[i] === corsiSeq[i - 1]) noImmediateRepeats = false;
}
assert(noImmediateRepeats, "no immediate repeated blocks in sequence");

const exactMatch = corsi.checkSequence([1, 2, 3], [1, 2, 3]);
assert(exactMatch.correct === true, "identical sequences are marked correct");

const wrongAtIndex1 = corsi.checkSequence([1, 5, 3], [1, 2, 3]);
assert(wrongAtIndex1.correct === false, "divergent sequence marked incorrect");
assert(wrongAtIndex1.firstErrorIndex === 1, "first error index correctly identified");

const shortInput = corsi.checkSequence([1, 2], [1, 2, 3]);
assert(shortInput.correct === false, "incomplete sequence marked incorrect");

const history = [
  { span: 3, correct: true },
  { span: 4, correct: true },
  { span: 5, correct: false },
  { span: 5, correct: false },
];
assert(corsi.computeFinalSpan(history) === 4, "final span is the longest span with a correct trial");

// ---- Reaction time tests ----
console.log("Testing reaction_logic.js...");

const rts = [999, 500, 520, 480, 510, 495]; // first is warmup (excluded by default)
const stats = reaction.computeStats(rts, 1);
assert(stats.n === 5, "warmup trial correctly excluded from stats");
assertClose(stats.mean, 501, 1, "mean computed correctly excluding warmup");
assert(stats.min === 480, "min computed correctly");
assert(stats.max === 520, "max computed correctly");

const emptyStats = reaction.computeStats([999], 1);
assert(emptyStats.n === 0, "returns n=0 when only warmup trial exists");
assert(emptyStats.mean === null, "returns null mean with insufficient data");

assert(reaction.isFalseStart(50) === true, "flags implausibly fast RT as false start");
assert(reaction.isFalseStart(350) === false, "does not flag normal RT as false start");

// ---- Summary ----
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL LOGIC TESTS PASSED");
}
