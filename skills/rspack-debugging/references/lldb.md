# LLDB References

# Install 

LLDB is the debugger for the LLVM project. Since Rspack is written in Rust, LLDB can be used for debugging.

## macOS

On macOS, LLDB usually comes installed with Xcode or Command Line Tools.

1.  Check if it is already installed:
    ```bash
    lldb --version
    ```
2.  If not installed, run the following command to install Command Line Tools:
    ```bash
    xcode-select --install
    ```

## Linux

### Ubuntu / Debian

```bash
sudo apt-get update
sudo apt-get install lldb
```

### Arch Linux

```bash
sudo pacman -S lldb
```

## Windows

Windows users are recommended to use WSL2 (Ubuntu) and follow the Linux steps for installation, or use the C++ extension in VS Code with LLDB.
If you are in a native Windows environment, you can use the Windows installer provided by the LLVM official website, but debugging Rspack is generally recommended in a Unix-like environment for better support.

## LLDB in Batch Mode

For automation and non-interactive debugging, we use LLDB in batch mode:

```bash
lldb --batch -o "run" -k "thread backtrace all" -k "quit" -- node script.js
```

*   `--batch`: Run in batch mode.
*   `-o`: Execute command after loading.
*   `-k`: Execute command upon crash (if the process crashes).
*   `--`: Separate LLDB arguments from the target program arguments.

## Common Checks

### `thread backtrace all` (or `bt all`)
This is the most critical command. It prints the stack traces of **all** threads.

### `frame variable` (or `fr v`)
Prints variables in the current stack frame. Can be used with `-o` to inspect specific states if needed.