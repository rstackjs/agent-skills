# Guide A: Crash during HMR

**Scenario**: Stable Crash/Deadlock during DevServer HMR.

1.  **Launch LLDB (Non-Interactive)**:
    Run the following command to start the dev server under LLDB. It will automatically run, and if it crashes, it will print the backtrace and exit.

    ```bash
    # Adjust the path to rspack.js if needed
    lldb --batch -o "run" -k "thread backtrace all" -k "quit" -- node node_modules/@rspack/cli/bin/rspack.js dev
    ```

2.  **Trigger the Issue**:
    - Wait for the Dev Server to start.
    - Modify a source file to trigger HMR.

3.  **Get Backtrace**:
    - **If it Crashes**: The backtrace will be printed to stdout automatically.
    - **If it Hangs (Deadlock)**: Press `Ctrl + C` in the running terminal. LLDB should catch the signal and might need manual intervention if not configured to catch SIGINT.
      - _Better approach for Hangs_: Use `Guide C` or `Guide F`.

4.  **Save Output**:
    **Agent Action**: Save the printed backtrace to `debug_artifacts/backtrace_hmr_crash.txt`.
