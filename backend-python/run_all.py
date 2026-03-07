import os
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent

PROCESS_SPECS = [
    ("haber", [sys.executable, str(BASE_DIR / "haber.py")]),
    ("chicago", [sys.executable, "-m", "chicago.chicagogov"]),
    ("dallas", [sys.executable, "-m", "chicago.dallasgov"]),
    ("nyc", [sys.executable, "-m", "chicago.nycgov"]),
    ("losangeles", [sys.executable, "-m", "chicago.losangelesgov"]),
]


def _stream_output(name: str, stream) -> None:
    for line in iter(stream.readline, ""):
        print(f"[{name}] {line.rstrip()}", flush=True)
    stream.close()


def _terminate_process(proc: subprocess.Popen[str], name: str) -> None:
    if proc.poll() is not None:
        return
    print(f"INFO [STOP] Stopping {name}...", flush=True)
    proc.terminate()
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        print(f"INFO [KILL] Force killing {name}...", flush=True)
        proc.kill()
        proc.wait(timeout=5)


def main() -> int:
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"

    processes: list[tuple[str, subprocess.Popen[str]]] = []
    stop_requested = False

    def request_stop(signum, frame) -> None:
        nonlocal stop_requested
        stop_requested = True
        print(f"INFO [SIGNAL] Received signal {signum}, shutting down all processes...", flush=True)

    signal.signal(signal.SIGINT, request_stop)
    signal.signal(signal.SIGTERM, request_stop)

    for name, command in PROCESS_SPECS:
        print(f"INFO [START] Launching {name}: {' '.join(command)}", flush=True)
        proc = subprocess.Popen(
            command,
            cwd=BASE_DIR,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )
        processes.append((name, proc))
        assert proc.stdout is not None
        threading.Thread(target=_stream_output, args=(name, proc.stdout), daemon=True).start()

    exit_code = 0
    try:
        while not stop_requested:
            for name, proc in processes:
                code = proc.poll()
                if code is None:
                    continue
                print(f"ERROR [EXIT] {name} exited with code {code}", flush=True)
                stop_requested = True
                exit_code = code or 1
                break
            time.sleep(1)
    finally:
        for name, proc in processes:
            _terminate_process(proc, name)

    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
