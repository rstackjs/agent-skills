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

- `accesses` approximates total work.
- `estimated_cycles` approximates total work plus cache penalties.

## How to Read Deltas

### `accesses` up, cache misses roughly flat

Usually a direct work increase: more instructions, traversal, hashing, parsing, cloning, formatting, or graph work.

### `estimated_cycles` up more than `accesses`

Usually a cache or memory-hierarchy issue: worse locality, more pointer chasing, more branchy traversal, or more allocation and table growth.

## How to Interpret L1 Growth

Always decompose L1 growth:

```text
delta_l1 = delta(I1mr) + delta(D1mr) + delta(D1mw)
```

### If `I1mr` dominates

Usually an indirect effect: binary layout changed, hot code moved across I-cache sets, inlining or code-size expanded the instruction footprint, or the benchmark now executes a broader helper path.

### If `D1mr` or `D1mw` dominate

Usually a data-layout issue: shared structs grew, metadata got larger, containers reallocated more, traversal order got worse, or pointer-heavy structures entered the path.

## Strong Evidence for an Indirect Regression

Treat an explanation as strong when most of these are true:

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
