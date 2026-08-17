# Guide E: Coredump Analysis (Build)

**Scenario**: Unstable Crash during Build.

1.  **Enable Core Dumps**:
    ```bash
    ulimit -c unlimited
    ```
2.  **Loop until Crash**:
    ```bash
    # Simple shell loop
    while pnpm build; do echo "Build success, retrying..."; done
    ```
    Wait for the loop to exit with an error (Segmentation fault).
3.  **Debug Post-Mortem**:
    ```bash
    lldb --batch -o "thread backtrace all" -o "quit" --core /path/to/core_file $(which node)
    ```
4.  **Get Backtrace**:
    The backtrace will be printed to stdout.
5.  **Save Output**:
    **Agent Action**: Save the output from step 4 to `debug_artifacts/backtrace_core_dump.txt`.
