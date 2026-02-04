# Rspack Tracing Guide

Tracing allows you to visualize exactly what Rspack is doing during a build.

## Enabling Tracing

Rspack uses several environment variables to control tracing.

**Command:**

```bash
RSPACK_PROFILE=TRACE RSPACK_TRACE_LAYER=logger RSPACK_TRACE_OUTPUT=./trace.json rspack build
```

### Variables

**`RSPACK_PROFILE`**: Controls the granularity of the trace.

- `TRACE`: Captures all spans. (Recommended for deep analysis)
- `DEBUG`, `INFO`, `WARN`, `ERROR`, `CRITICAL`
- `OFF`: Disables tracing.

**`RSPACK_TRACE_LAYER`**: Controls the output format.

- `logger`: Outputs standard JSON logging (required for the analysis script).

## Output

After running the command, Rspack will generate the file specified in `RSPACK_TRACE_OUTPUT`.

## Using the Skill's Analysis Tool

This skill includes a script to summarize the trace file.

```bash
# Run the included script
node scripts/analyze_trace.js <path-to-trace-file>
```
