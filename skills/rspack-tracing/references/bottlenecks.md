# Understanding Rspack Performance Bottlenecks

This reference maps internal Rspack tracing spans to high-level concepts to help you identify performance issues.

## Core Compilation Phases

| Span Name               | Description                                                    | Potential Bottlenecks                                                             |
| :---------------------- | :------------------------------------------------------------- | :-------------------------------------------------------------------------------- |
| `tracing::profiling`    | The entire build process.                                      | Overall slowness.                                                                 |
| `compiler::make`        | **Make Phase**: Resolving, loading, and parsing modules.       | Heavy loaders (babel/swc with complex configs), too many files, slow file system. |
| `compiler::seal`        | **Seal Phase**: Optimizing, splitting chunks, generating code. | Complex code splitting, heavy minification, many modules.                         |
| `compiler::emit_assets` | **Emit Phase**: Writing files to disk.                         | Slow disk I/O, huge output files.                                                 |

## Detailed Spans

### Make Phase (Module Processing)

- `resolver::resolve`: Resolving import paths.
  - **High Time?**: Check for complex `resolve.alias` or `resolve.modules`, or too many standard fallbacks.
- `loader::run_loaders`: Executing loaders (JavaScript/Rust).
  - **High Time?**: Identify which loader is slow. If `sass-loader` or `babel-loader` is slow, consider caching (`cache: true` in config) or using `swc-loader`.
- `parser::parse`: Parsing source code into AST.
  - **High Time?**: Large files?

### Seal Phase (Optimization)

- `compilation::code_generation`: Generating final code from AST.
- `compilation::optimize_chunks`: Splitting chunks (SplitChunksPlugin).
  - `k_means_splitter`: If you see this, complex splitting logic is running.
- `js_minimizer`: Minification (SwcJsMinimizer).
  - **High Time?**: Disable minimization in dev (`optimization.minimize: false`) for speed.

### General

- `read_file`: Reading files from disk.
- `write_file`: Writing artifacts to disk.

## Common Fixes

1.  **Slow `make` phase**:
    - Use `experiments.cache` (Persistent Cache).
    - Exclude `node_modules` from expensive loaders.
    - Switch to lighter loaders (e.g. `swc-loader` vs `babel-loader`).
2.  **Slow `seal` phase**:
    - Reduce `splitChunks` complexity.
    - Disable `sourcemap` in production if acceptable cost.
    - Upgrade to latest Rspack (performance improvements are frequent).
