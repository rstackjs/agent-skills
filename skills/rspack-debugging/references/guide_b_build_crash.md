# Guide B: Crash during Build

**Scenario**: Stable Crash during Build.

1.  **Launch LLDB (Non-Interactive)**:
    Run the build command under LLDB in batch mode.
    
    ```bash
    lldb --batch -o "run" -k "thread backtrace all" -k "quit" -- node node_modules/@rspack/cli/bin/rspack.js build
    ```

2.  **Wait for Result**:
    *   The command will run until it crashes or finishes.
    *   On crash, it prints the stack trace of all threads.

3.  **Save Output**:
    **Agent Action**: Save the output to `debug_artifacts/backtrace_build_crash.txt`.
