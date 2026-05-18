# CodSpeed Metrics and Regression Heuristics

## Core Formulas

CodSpeed simulation mode derives summary metrics from Callgrind totals:

```text
accesses = Ir + Dr + Dw
l1_misses = I1mr + D1mr + D1mw
ll_misses = ILmr + DLmr + DLmw
estimated_cycles = accesses + 5 * l1_misses + 100 * ll_misses
```

Field meanings:

- `Ir`: instruction reads
- `Dr`: data reads
- `Dw`: data writes
- `I1mr`: L1 instruction-cache misses
- `D1mr`: L1 data-read misses
- `D1mw`: L1 data-write misses
- `ILmr`: last-level instruction-cache misses
- `DLmr`: last-level data-read misses
- `DLmw`: last-level data-write misses

Interpretation:

- `accesses` approximates total work done.
- `estimated_cycles` approximates total work plus cache penalties.

## How to Read Deltas

### `accesses` up, cache misses roughly flat

Likely explanations:

- More instructions executed
- More data traversed
- More hashing, parsing, cloning, formatting, or graph work

This usually points to a direct algorithmic or control-flow expansion.

### `estimated_cycles` up more than `accesses`

Likely explanations:

- Worse cache locality
- More branchy traversal patterns
- More pointer chasing
- Extra allocations or table growth

Treat this as a memory hierarchy problem until proven otherwise.

## How to Interpret L1 Growth

Always decompose L1 growth:

```text
delta_l1 = delta(I1mr) + delta(D1mr) + delta(D1mw)
```

### If `I1mr` dominates

Likely explanations:

- Binary code layout changed
- Hot functions moved across instruction-cache sets
- More inlining or code-size growth expanded the hot instruction footprint
- A benchmark started executing a broader set of helper functions than before

This is often an indirect effect. The changed source file may not appear on the hot path.

### If `D1mr` or `D1mw` dominate

Likely explanations:

- Widely carried structs grew
- Shared metadata became larger
- Hash maps or vectors reallocated more often
- Traversal order reduced locality
- More pointer-heavy structures entered the path

This is where layout-size checks and allocation-path inspection matter.

## Strong Evidence for an Indirect Regression

Treat an explanation as strongly supported when most of these are true:

1. The benchmark does not execute the new feature path directly.
2. The hot functions are old paths in unchanged files.
3. The regression is concentrated in `I1mr`, or in `D1` misses with a measurable shared-struct size increase.
4. Benchmark parity is confirmed, so the delta is not caused by tool or target mismatch.

## Common False Positives

### Invalid baseline

- Different merge base
- Different benchmark list
- Different target triple
- Different CodSpeed mode or tool version

Do not interpret deltas until this is ruled out.

### Broad noise misread as a feature regression

If total accesses and cycles stay nearly flat while only one or two benchmarks move, do not claim a broad project regression.

### New code blamed without execution evidence

If new symbols or files do not appear in the extracted profile, do not present the regression as direct execution of the new feature. Explain the indirect mechanism instead.

## Suggested Root-Cause Language

Use language with the right confidence level:

- “Direct regression”: only when the changed code is on the hot path and materially contributes to the regressed event.
- “Indirect regression via binary layout”: when `I1mr` dominates and old hotspots worsen without new code executing directly.
- “Indirect regression via shared-structure growth”: when `D1mr`/`D1mw` dominate and a widely used struct or metadata object measurably grows.
- “Not enough evidence”: when the comparison is noisy or the baseline is not valid.
