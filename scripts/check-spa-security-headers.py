#!/usr/bin/env python3
"""Regression: SPA/edge nginx must re-declare Django-parity security headers
on every location that uses add_header (nginx clears inherited add_header)."""
from __future__ import annotations

import os
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = (
    "Strict-Transport-Security",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Cross-Origin-Opener-Policy",
)


def location_blocks(text: str) -> list[tuple[str, str]]:
    blocks: list[tuple[str, str]] = []
    for m in re.finditer(r"(location\s+[^{]+)\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}", text):
        blocks.append((m.group(1).strip(), m.group(0)))
    return blocks


def check_conf(path: Path) -> list[str]:
    errors: list[str] = []
    text = path.read_text()
    for h in REQUIRED:
        if h not in text:
            errors.append(f"{path.name}: missing {h}")
    for header, block in location_blocks(text):
        if "Cache-Control" not in block:
            continue
        for h in REQUIRED:
            if h not in block:
                errors.append(f"{path.name}: {header} missing re-declared {h}")
    return errors


def check_live(base: str) -> list[str]:
    errors: list[str] = []
    base = base.rstrip("/")
    for path in ("/", "/admin/login", "/api/health/"):
        req = urllib.request.Request(base + path, method="HEAD")
        with urllib.request.urlopen(req, timeout=20) as resp:
            headers = {k.lower(): v for k, v in resp.headers.items()}
        for h in REQUIRED:
            if h.lower() not in headers:
                errors.append(f"live {path}: missing {h}")
    html = urllib.request.urlopen(base + "/", timeout=20).read().decode()
    m = re.search(r"/assets/[^\"']+\.js", html)
    if m:
        req = urllib.request.Request(base + m.group(0), method="HEAD")
        with urllib.request.urlopen(req, timeout=20) as resp:
            headers = {k.lower(): v for k, v in resp.headers.items()}
        for h in ("Strict-Transport-Security", "X-Content-Type-Options"):
            if h.lower() not in headers:
                errors.append(f"live asset {m.group(0)}: missing {h}")
    return errors


def main() -> int:
    errors = check_conf(ROOT / "nginx" / "nginx.conf")
    errors += check_conf(ROOT / "frontend" / "nginx.conf")
    live = os.environ.get("CHECK_URL", "").strip()
    if live:
        errors += check_live(live)
    if errors:
        print("SPA security header regression FAILED")
        for e in errors:
            print(" -", e)
        return 1
    print("SPA security header regression OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
