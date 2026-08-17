# Guide D: Coredump Analysis (Dev)

**Scenario**: Unstable Crash during DevServer HMR (hard to catch interactively).

1.  **Enable Core Dumps**:
    Run this in the terminal where you will start the dev server:
    ```bash
    ulimit -c unlimited
    ```
    _Note: On macOS, core dumps might be written to `/cores/`. On Linux, usually current dir or `/var/lib/systemd/coredump`._
2.  **Start Dev Server**:
    ```bash
    pnpm dev
    ```
3.  **Torture Test**:
    Repeatedly modify files to trigger HMR until the server crashes. You can write a script to append a comment to a file every second.
4.  **Locate Core File**:
    Find the generated core file (e.g., `/cores/core.12345` or `./core`).
5.  **Debug Post-Mortem**:
    ```bash
    # You need the exact node binary that ran the process
    lldb --batch -o "thread backtrace all" -o "quit" --core /path/to/core_file $(which node)
    ```
6.  **Get Backtrace**:
    The backtrace will be printed to stdout.
7.  **Save Output**:
    **Agent Action**: Save the output from step 6 to `debug_artifacts/backtrace_core_dump.txt`.
