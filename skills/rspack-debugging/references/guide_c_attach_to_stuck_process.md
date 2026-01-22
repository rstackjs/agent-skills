# Guide C: Attach to Stuck Process

**Scenario**: Unstable Deadlock during Build (happens randomly).

## 1. User Action: Reproduce and Get PID

Run the following script to loop your build command until it hangs. This script prints the PID of each attempt.

```bash
# Loop until you manually stop it (Ctrl+C) when it hangs
while true; do
    echo "Starting build..."
    # Start in background to get PID easily, then wait
    pnpm build &
    PID=$!
    echo ">> Process PID: $PID"
    wait $PID
    echo "Build finished, retrying..."
    sleep 1
done
```

**Instructions**:
1.  Run the script in your terminal.
2.  Watch the output.
3.  When the build **hangs** (stops outputting and doesn't finish for a long time):
    *   Look at the last printed `>> Process PID: <NUMBER>`.
    *   **Do not kill the process**.
    *   Copy that PID.

## 2. Agent Action: Attach and debug

Ask the user for the **PID** of the stuck process. Once obtained, run:

```bash
# Replace <PID> with the actual number provided by the user
lldb -p <PID> --batch -o "thread backtrace all" -o "quit"
```

## 3. Save Output

**Agent Action**: Save the output to `debug_artifacts/backtrace_attached.txt`.
