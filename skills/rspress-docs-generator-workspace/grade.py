#!/usr/bin/env python3
"""Grade rspress-docs-generator eval runs."""

import json
import os
import re
import sys
from pathlib import Path
from typing import Optional


def find_package_json(workspace: Path) -> Optional[Path]:
    """Find the docs site's package.json (website/docs or docs subdir, or root)."""
    candidates = [
        workspace / "website" / "package.json",
        workspace / "docs" / "package.json",
        workspace / "site" / "package.json",
        workspace / "package.json",
    ]
    for c in candidates:
        if c.exists():
            return c
    return None


def find_docs_root(workspace: Path) -> Optional[Path]:
    """Find the directory containing markdown/mdx doc files."""
    candidates = [
        workspace / "website" / "docs",
        workspace / "docs",
        workspace / "site" / "docs",
    ]
    for c in candidates:
        if c.exists() and c.is_dir():
            return c
    return None


def read_text_files(directory: Path) -> str:
    text = []
    for p in directory.rglob("*"):
        if p.is_file() and p.suffix in {".md", ".mdx", ".ts", ".js", ".json"}:
            try:
                text.append(p.read_text(encoding="utf-8"))
            except Exception:
                pass
    return "\n".join(text)


def check_rspress_v2(package_json: Path) -> tuple[bool, str]:
    data = json.loads(package_json.read_text())
    deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
    core_ver = deps.get("@rspress/core", "")
    rspress_ver = deps.get("rspress", "")

    for ver in (core_ver, rspress_ver):
        if ver.startswith("2") or (ver.startswith("^") and ver[1:].startswith("2")):
            return True, f"Found Rspress v2: @rspress/core={core_ver}, rspress={rspress_ver}"

    for ver in (core_ver, rspress_ver):
        if ver.startswith("1") or (ver.startswith("^") and ver[1:].startswith("1")):
            return False, f"Still on Rspress v1: @rspress/core={core_ver}, rspress={rspress_ver}"

    return False, f"No recognized Rspress version: @rspress/core={core_ver}, rspress={rspress_ver}"


def check_build_passed(workspace: Path) -> tuple[bool, str]:
    run_dir = workspace.parent
    build_log = run_dir / "outputs" / "build.log"
    summary = run_dir / "summary.txt"

    # Prefer explicit build log
    if build_log.exists():
        content = build_log.read_text()
        if "error" in content.lower() and "exit code 0" not in content.lower():
            return False, "build.log contains errors"
        if "built in" in content.lower() or "success" in content.lower() or "exit code 0" in content.lower():
            return True, "build.log indicates success"

    # Fall back to summary.txt
    if summary.exists():
        content = summary.read_text().lower()
        if "build passed" in content or "build: yes" in content:
            return True, "summary.txt says build passed"
        if "build failed" in content:
            return False, "summary.txt says build failed"

    # Check for doc_build output directory
    docs_root = find_docs_root(workspace)
    if docs_root:
        build_dir = docs_root.parent / "doc_build"
        if build_dir.exists():
            return True, f"doc_build directory exists at {build_dir}"

    return False, "no build success evidence found"


def grade_create_new_docs(workspace: Path) -> list[dict]:
    expectations = []
    pkg = find_package_json(workspace)

    # 1. Rspress v2
    if pkg:
        passed, evidence = check_rspress_v2(pkg)
    else:
        passed, evidence = False, "package.json not found"
    expectations.append({"text": "The docs site uses Rspress v2", "passed": passed, "evidence": evidence})

    # 2. Docs directory exists
    docs_root = find_docs_root(workspace)
    passed = docs_root is not None and (docs_root / "index.md").exists()
    expectations.append({
        "text": "A docs directory exists with an index/home page",
        "passed": passed,
        "evidence": f"docs_root={docs_root}, index.md exists={passed}",
    })

    # 3. Navigation files or inline config
    nav_files = []
    if docs_root:
        nav_files = list(docs_root.rglob("_nav.json")) + list(docs_root.rglob("_meta.json"))
    valid_nav = False
    evidence_parts = []
    for nf in nav_files:
        try:
            json.loads(nf.read_text())
            valid_nav = True
            evidence_parts.append(f"{nf.name} valid JSON")
        except Exception as e:
            evidence_parts.append(f"{nf.name} invalid JSON: {e}")

    # Also accept inline nav/sidebar in rspress.config.ts
    config_files = list(workspace.rglob("rspress.config.ts")) + list(workspace.rglob("rspress.config.js")) + list(workspace.rglob("rspress.config.mjs"))
    inline_nav = False
    for cf in config_files:
        content = cf.read_text()
        if "nav:" in content or "sidebar:" in content or "themeConfig" in content:
            inline_nav = True
            evidence_parts.append(f"{cf.name} has inline nav/sidebar config")

    nav_ok = valid_nav or inline_nav
    expectations.append({
        "text": "Navigation is configured via _nav/_meta files or inline config",
        "passed": nav_ok,
        "evidence": "; ".join(evidence_parts) if evidence_parts else "no nav evidence found",
    })

    # 4. Docs mention utilities
    text = read_text_files(docs_root) if docs_root else ""
    mentions = all(f in text for f in ["camelCase", "kebabCase", "snakeCase", "truncate", "ellipsis"])
    expectations.append({
        "text": "Docs mention the project's utilities",
        "passed": mentions,
        "evidence": f"all utilities mentioned={mentions}",
    })

    # 5. Build passed
    passed, evidence = check_build_passed(workspace)
    expectations.append({"text": "Docs build passed", "passed": passed, "evidence": evidence})

    return expectations


def grade_maintain_docs_for_pr(workspace: Path) -> list[dict]:
    expectations = []
    docs_root = find_docs_root(workspace)
    text = read_text_files(docs_root) if docs_root else ""

    # 1. formatBytes documented
    has_format_bytes = "formatBytes" in text
    expectations.append({
        "text": "formatBytes is documented",
        "passed": has_format_bytes,
        "evidence": f"formatBytes mentioned={has_format_bytes}",
    })

    # 2. Usage example
    has_example = "formatBytes(" in text and "```" in text
    expectations.append({
        "text": "formatBytes documentation includes a usage example",
        "passed": has_example,
        "evidence": f"code example with formatBytes={has_example}",
    })

    # 3. Nav updated if new page added
    nav_files = list(docs_root.rglob("_nav.json")) + list(docs_root.rglob("_meta.json")) if docs_root else []
    nav_updated = False
    for nf in nav_files:
        try:
            content = nf.read_text()
            if "formatBytes" in content:
                nav_updated = True
        except Exception:
            pass
    # If formatBytes only added to existing page, nav update may not be needed
    expectations.append({
        "text": "Navigation updated if a new page was added",
        "passed": nav_updated or not has_format_bytes,
        "evidence": f"formatBytes in nav/meta files={nav_updated}",
    })

    # 4. Build passed
    passed, evidence = check_build_passed(workspace)
    expectations.append({"text": "Docs build passed", "passed": passed, "evidence": evidence})

    return expectations


def grade_migrate_rspress_v1(workspace: Path) -> list[dict]:
    expectations = []
    pkg = find_package_json(workspace)

    # 1. Rspress v2 dependency
    if pkg:
        passed, evidence = check_rspress_v2(pkg)
    else:
        passed, evidence = False, "package.json not found"
    expectations.append({"text": "Docs site depends on Rspress v2", "passed": passed, "evidence": evidence})

    # 2. Config follows v2 conventions
    config_files = list(workspace.rglob("rspress.config.ts"))
    config_ok = False
    evidence = "no rspress.config.ts found"
    if config_files:
        content = config_files[0].read_text()
        if "@rspress/core" in content:
            config_ok = True
            evidence = "config imports from @rspress/core"
        elif "rspress" in content:
            evidence = "config still references rspress package"
        else:
            evidence = "config does not reference Rspress imports"
    expectations.append({"text": "rspress.config.ts follows v2 conventions", "passed": config_ok, "evidence": evidence})

    # 3. Build passed
    passed, evidence = check_build_passed(workspace)
    expectations.append({"text": "Docs build passed", "passed": passed, "evidence": evidence})

    return expectations


GRADERS = {
    "create-new-docs": grade_create_new_docs,
    "maintain-docs-for-pr": grade_maintain_docs_for_pr,
    "migrate-rspress-v1": grade_migrate_rspress_v1,
}


def main():
    iteration_dir = Path(sys.argv[1])
    for eval_dir in iteration_dir.iterdir():
        if not eval_dir.is_dir():
            continue
        eval_name = eval_dir.name
        grader = GRADERS.get(eval_name)
        if not grader:
            continue
        for run_dir in ("with_skill", "without_skill"):
            workspace = eval_dir / run_dir / "workspace"
            if not workspace.exists():
                continue
            expectations = grader(workspace)
            grading = {"run_id": f"{eval_name}-{run_dir}", "expectations": expectations}
            out_path = eval_dir / run_dir / "grading.json"
            out_path.write_text(json.dumps(grading, indent=2))
            print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
