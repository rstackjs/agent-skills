# Guide F: Async Deadlock Identification

**Scenario**: Unstable Async Deadlock. Main thread stuck in `uv_run`.

## 1. Identification

Use **Guide C** (Attach to Stuck Process) to get a backtrace from the stuck process. Then check if it matches the following pattern:

**Main Thread**
Stuck in the event loop waiting (`uv_run` / `kevent` / `epoll_wait`), usually with no active JavaScript or Rust tasks.

```
frame #0: kevent (libsystem_kernel.dylib)
frame #1: uv__io_poll (node)
frame #2: uv_run (node)
frame #3: node::SpinEventLoopInternal (node)
```

**Tokio Worker Threads**
All in an idle waiting state (`Condvar::wait`).

```
frame #0: __psynch_cvwait
frame #1: _pthread_cond_wait
frame #2: parking_lot::condvar::Condvar::wait_until_internal
frame #3: tokio::runtime::scheduler::multi_thread::park::Parker::park
```

## 2. Next Steps

If the backtrace matches the above pattern, it is a classic **Async Deadlock**. LLDB cannot help further because the threads are simply waiting for a Future that never completes.

**Recommendation**:
Please use the **Tracing Skill** to diagnose this issue. Tracing logs can reveal which Future was last active or dropped.
