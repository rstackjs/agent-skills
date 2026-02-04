# Agent Skills

A collection of Agent Skills for [Rstack](https://rspack.rs/guide/start/ecosystem#rstack).

## Available Skills

### rspack-debugging

```bash
npx skills add rstackjs/agent-skills --skill rspack-debugging
```

Helps Rspack users and developers debug crashes or deadlocks/hangs in the Rspack build process using LLDB.

Use when:

- Rspack builds crash with errors like "Segmentation fault"
- The build process is stuck or deadlocked
- You need a reproducible backtrace for upstream debugging

### rspack-tracing

```bash
npx skills add rstackjs/agent-skills --skill rspack-tracing
```

Comprehensive guide and toolkit for diagnosing Rspack build issues and profiling performance.

Use when:

- Rspack builds are slow and you need a bottleneck breakdown
- You want to identify which plugin or loader is slow
- You need to capture or interpret a Rspack trace file
