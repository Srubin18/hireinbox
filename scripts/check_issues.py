#!/usr/bin/env python3
"""
HireInbox Issue Scanner
Scans codebase for TODOs, FIXMEs, incomplete features, and potential issues
"""

import os
import re
import json
from pathlib import Path
from collections import defaultdict

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
SRC_DIR = PROJECT_ROOT / "src"
EXCLUDE_DIRS = {".next", "node_modules", ".git", "__pycache__", ".vercel"}
EXTENSIONS = {".ts", ".tsx", ".js", ".jsx"}

# Issue patterns
PATTERNS = {
    "TODO": re.compile(r"//\s*TODO[:\s](.+?)(?:\n|$)", re.IGNORECASE),
    "FIXME": re.compile(r"//\s*FIXME[:\s](.+?)(?:\n|$)", re.IGNORECASE),
    "HACK": re.compile(r"//\s*HACK[:\s](.+?)(?:\n|$)", re.IGNORECASE),
    "XXX": re.compile(r"//\s*XXX[:\s](.+?)(?:\n|$)", re.IGNORECASE),
    "STUB": re.compile(r"stub|placeholder|mock data|fake|dummy", re.IGNORECASE),
    "CONSOLE_LOG": re.compile(r"console\.log\(", re.IGNORECASE),
    "HARDCODED": re.compile(r"(?:localhost|127\.0\.0\.1|test@|password\s*=|'password'|apikey\s*=)", re.IGNORECASE),
    "EMPTY_CATCH": re.compile(r"catch\s*\([^)]*\)\s*\{\s*\}", re.IGNORECASE),
    "MISSING_ERROR": re.compile(r"\.catch\(\(\)\s*=>\s*\{\s*\}\)", re.IGNORECASE),
}

# Critical checks
CRITICAL_PATTERNS = {
    "MISSING_AUTH": re.compile(r"\/api\/.*route\.ts", re.IGNORECASE),
    "EXPOSED_KEY": re.compile(r"sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}", re.IGNORECASE),
}


def should_skip(path: Path) -> bool:
    """Check if path should be skipped"""
    for part in path.parts:
        if part in EXCLUDE_DIRS:
            return True
    return False


def scan_file(filepath: Path) -> dict:
    """Scan a single file for issues"""
    issues = defaultdict(list)

    try:
        content = filepath.read_text(encoding="utf-8", errors="ignore")
        lines = content.split("\n")

        for line_num, line in enumerate(lines, 1):
            for issue_type, pattern in PATTERNS.items():
                matches = pattern.findall(line)
                if matches:
                    for match in matches:
                        issues[issue_type].append({
                            "file": str(filepath.relative_to(PROJECT_ROOT)),
                            "line": line_num,
                            "content": match if isinstance(match, str) else line.strip()[:100]
                        })

    except Exception as e:
        issues["SCAN_ERROR"].append({
            "file": str(filepath),
            "error": str(e)
        })

    return dict(issues)


def check_api_routes(src_dir: Path) -> list:
    """Check API routes for missing auth"""
    issues = []
    api_dir = src_dir / "app" / "api"

    if not api_dir.exists():
        return issues

    # Public routes that don't need auth
    PUBLIC_ROUTES = {
        "analyze-cv", "analyze-video", "rewrite-cv", "health",
        "payments/notify", "auth"
    }

    for route_file in api_dir.rglob("route.ts"):
        route_name = str(route_file.parent.relative_to(api_dir))

        # Skip public routes
        is_public = any(pub in route_name for pub in PUBLIC_ROUTES)
        if is_public:
            continue

        content = route_file.read_text(encoding="utf-8", errors="ignore")

        # Check if route has auth
        has_auth = any([
            "getServerSession" in content,
            "verifyAuth" in content,
            "checkAuth" in content,
            "requireAuth" in content,
            "auth_context" in content.lower(),
            "user_id" in content.lower() and "supabase" in content.lower()
        ])

        if not has_auth:
            issues.append({
                "route": route_name,
                "file": str(route_file.relative_to(PROJECT_ROOT)),
                "issue": "May be missing authentication check"
            })

    return issues


def check_env_usage(src_dir: Path) -> list:
    """Check for missing env var handling"""
    issues = []

    for filepath in src_dir.rglob("*.ts"):
        if should_skip(filepath):
            continue

        content = filepath.read_text(encoding="utf-8", errors="ignore")

        # Find env var accesses without fallback
        env_pattern = re.compile(r"process\.env\.(\w+)(?!\s*\|\||\s*\?\?|\!)")
        matches = env_pattern.findall(content)

        for match in set(matches):
            # Check if it's used with ! (assertion) which means no fallback
            if f"process.env.{match}!" in content:
                continue  # This is intentional assertion
            issues.append({
                "file": str(filepath.relative_to(PROJECT_ROOT)),
                "env_var": match,
                "issue": "Env var used without fallback (may fail if not set)"
            })

    return issues


def check_incomplete_features(src_dir: Path) -> list:
    """Check for incomplete feature implementations"""
    issues = []

    incomplete_indicators = [
        (r"Coming\s+Soon", "Feature marked as coming soon"),
        (r"Not\s+implemented", "Feature not implemented"),
        (r"TODO:\s*implement", "TODO to implement"),
        (r"placeholder", "Placeholder content"),
        (r"return\s+null\s*;?\s*//", "Returns null with comment"),
        (r"throw\s+new\s+Error\(['\"]not\s+implemented", "Throws not implemented"),
    ]

    for filepath in src_dir.rglob("*.tsx"):
        if should_skip(filepath):
            continue

        content = filepath.read_text(encoding="utf-8", errors="ignore")

        for pattern, description in incomplete_indicators:
            if re.search(pattern, content, re.IGNORECASE):
                issues.append({
                    "file": str(filepath.relative_to(PROJECT_ROOT)),
                    "issue": description
                })

    return issues


def main():
    print("=" * 60)
    print("HIREINBOX ISSUE SCANNER")
    print("=" * 60)

    all_issues = defaultdict(list)

    # Scan source files
    print("\n[1/4] Scanning source files for TODOs/FIXMEs...")
    file_count = 0
    for filepath in SRC_DIR.rglob("*"):
        if filepath.is_file() and filepath.suffix in EXTENSIONS and not should_skip(filepath):
            file_issues = scan_file(filepath)
            for issue_type, items in file_issues.items():
                all_issues[issue_type].extend(items)
            file_count += 1
    print(f"      Scanned {file_count} files")

    # Check API routes
    print("\n[2/4] Checking API routes for auth...")
    auth_issues = check_api_routes(SRC_DIR)
    if auth_issues:
        all_issues["MISSING_AUTH"] = auth_issues

    # Check env vars
    print("\n[3/4] Checking environment variable usage...")
    env_issues = check_env_usage(SRC_DIR)
    if env_issues:
        all_issues["ENV_ISSUES"] = env_issues[:10]  # Limit to top 10

    # Check incomplete features
    print("\n[4/4] Checking for incomplete features...")
    incomplete = check_incomplete_features(SRC_DIR)
    if incomplete:
        all_issues["INCOMPLETE"] = incomplete

    # Summary
    print("\n" + "=" * 60)
    print("ISSUE SUMMARY")
    print("=" * 60)

    total = 0
    priority_order = ["TODO", "FIXME", "MISSING_AUTH", "INCOMPLETE", "HACK", "STUB", "ENV_ISSUES"]

    for issue_type in priority_order:
        if issue_type in all_issues:
            count = len(all_issues[issue_type])
            total += count
            print(f"\n{issue_type}: {count} issues")
            for item in all_issues[issue_type][:5]:  # Show top 5
                if "file" in item:
                    line = f" (line {item['line']})" if "line" in item else ""
                    content = item.get("content", item.get("issue", ""))[:60]
                    print(f"  - {item['file']}{line}: {content}")
                else:
                    print(f"  - {item}")

    # Show remaining types
    for issue_type, items in all_issues.items():
        if issue_type not in priority_order and items:
            print(f"\n{issue_type}: {len(items)} occurrences")
            total += len(items)

    print("\n" + "=" * 60)
    print(f"TOTAL ISSUES FOUND: {total}")
    print("=" * 60)

    # Quick fixes needed
    print("\n[CRITICAL FIXES NEEDED FOR SHIP]")
    critical = []

    if all_issues.get("TODO"):
        critical.append(f"- {len(all_issues['TODO'])} TODOs to resolve")
    if all_issues.get("FIXME"):
        critical.append(f"- {len(all_issues['FIXME'])} FIXMEs to fix")
    if all_issues.get("MISSING_AUTH"):
        critical.append(f"- {len(all_issues['MISSING_AUTH'])} API routes may need auth")
    if all_issues.get("INCOMPLETE"):
        critical.append(f"- {len(all_issues['INCOMPLETE'])} incomplete features")

    for item in critical:
        print(item)

    if not critical:
        print("No critical issues found!")

    return all_issues


if __name__ == "__main__":
    main()
