#!/usr/bin/env python3
"""Aggregate grading results and timing into benchmark.json and benchmark.md."""

import json
from pathlib import Path
from statistics import mean, stdev


def load_grading(path: Path):
    data = json.loads(path.read_text())
    expectations = data.get("expectations", [])
    passed = sum(1 for e in expectations if e.get("passed"))
    total = len(expectations)
    return {"run_id": data["run_id"], "passed": passed, "total": total, "rate": passed / total if total else 0}


def load_timing(path: Path):
    data = json.loads(path.read_text())
    return {
        "tokens": data.get("total_tokens", 0),
        "duration_seconds": data.get("total_duration_seconds", data.get("duration_ms", 0) / 1000),
    }


def main():
    iteration_dir = Path(__file__).parent / "iteration-1"
    evals = ["create-new-docs", "maintain-docs-for-pr", "migrate-rspress-v1"]
    configs = ["with_skill", "without_skill"]

    rows = []
    for eval_name in evals:
        for config in configs:
            run_dir = iteration_dir / eval_name / config
            grading_path = run_dir / "grading.json"
            timing_path = run_dir / "timing.json"
            if not grading_path.exists() or not timing_path.exists():
                continue
            grade = load_grading(grading_path)
            timing = load_timing(timing_path)
            rows.append({
                "eval": eval_name,
                "config": config,
                **grade,
                **timing,
            })

    # Overall stats
    def stats(values):
        if not values:
            return {"mean": 0, "std": 0}
        if len(values) == 1:
            return {"mean": values[0], "std": 0}
        return {"mean": mean(values), "std": stdev(values)}

    with_skill_rows = [r for r in rows if r["config"] == "with_skill"]
    without_skill_rows = [r for r in rows if r["config"] == "without_skill"]

    benchmark = {
        "skill_name": "rspress-docs-generator",
        "iteration": 1,
        "runs": rows,
        "summary": {
            "with_skill": {
                "pass_rate": stats([r["rate"] for r in with_skill_rows]),
                "duration_seconds": stats([r["duration_seconds"] for r in with_skill_rows]),
                "tokens": stats([r["tokens"] for r in with_skill_rows]),
            },
            "without_skill": {
                "pass_rate": stats([r["rate"] for r in without_skill_rows]),
                "duration_seconds": stats([r["duration_seconds"] for r in without_skill_rows]),
                "tokens": stats([r["tokens"] for r in without_skill_rows]),
            },
        },
    }

    out_json = iteration_dir / "benchmark.json"
    out_json.write_text(json.dumps(benchmark, indent=2))

    # Markdown report
    lines = ["# Benchmark Report\n", "## Per-run results\n"]
    lines.append("| Eval | Config | Passed | Total | Rate | Tokens | Duration (s) |\n")
    lines.append("|------|--------|--------|-------|------|--------|-------------|\n")
    for r in rows:
        lines.append(
            f"| {r['eval']} | {r['config']} | {r['passed']} | {r['total']} | "
            f"{r['rate']:.0%} | {r['tokens']} | {r['duration_seconds']:.1f} |\n"
        )

    lines.append("\n## Summary\n")
    for config in ("with_skill", "without_skill"):
        s = benchmark["summary"][config]
        lines.append(f"\n### {config}\n")
        lines.append(f"- Pass rate: {s['pass_rate']['mean']:.1%} (std: {s['pass_rate']['std']:.1%})\n")
        lines.append(f"- Duration: {s['duration_seconds']['mean']:.1f}s (std: {s['duration_seconds']['std']:.1f}s)\n")
        lines.append(f"- Tokens: {s['tokens']['mean']:.0f} (std: {s['tokens']['std']:.0f})\n")

    out_md = iteration_dir / "benchmark.md"
    out_md.write_text("".join(lines))
    print(f"Wrote {out_json} and {out_md}")


if __name__ == "__main__":
    main()
