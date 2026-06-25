"""
FinansAsistan — Foundry Local SDK Connectivity Check

Run this BEFORE starting the backend to verify:
  1. Foundry Local service is reachable
  2. SDK can connect to the local service
  3. SDK can resolve phi-3.5-mini from the LOCAL registry
  4. SDK can resolve qwen3-embedding-0.6b from the LOCAL registry

Usage:
    python -m backend.startup_check
"""

import sys
import urllib.request


def check_service() -> bool:
    print("\n[1] Checking Foundry Local service at http://127.0.0.1:61122 …")
    try:
        with urllib.request.urlopen(
            "http://127.0.0.1:61122/openai/status", timeout=5
        ) as r:
            body = r.read().decode()
            if '"endpoints"' in body:
                print("    ✅ Service is running.")
                return True
            else:
                print("    ⚠️  Service responded but output unexpected.")
                return False
    except Exception as e:
        print(f"    ❌ Service not reachable: {e}")
        print("    → Run: foundry service start")
        return False


def check_sdk() -> bool:
    print("\n[2] Importing foundry_local_sdk …")
    try:
        from backend.services.foundry_client import ensure_sdk
        print("    ✅ foundry_local_sdk imported successfully.")
    except ImportError as e:
        print(f"    ❌ Import failed: {e}")
        print("    → Run: pip install foundry-local-sdk")
        return False

    print("\n[3] Initialising Foundry Local Manager (connects to local service) …")
    try:
        manager = ensure_sdk()
        print("    ✅ Manager initialised.")
    except Exception as e:
        print(f"    ❌ Manager init failed: {e}")
        return False

    catalog = manager.catalog

    for alias, kind in [
        ("phi-3.5-mini",          "Chat model"),
        ("qwen3-embedding-0.6b",  "Embedding model"),
    ]:
        print(f"\n[4] Resolving {kind} '{alias}' from local service registry …")
        try:
            model = catalog.get_model(alias)
            cached = model.is_cached
            print(f"    ✅ Resolved '{alias}'.")
            print(f"       Cached locally: {'YES — download will be skipped' if cached else 'NO — will download on first query'}")
        except Exception as e:
            print(f"    ❌ Failed to resolve '{alias}': {e}")
            print("    → The local service registry may not know this alias.")
            print("      Check: https://learn.microsoft.com/azure/foundry-local")
            return False

    return True


def main() -> None:
    print("=" * 60)
    print("  FinansAsistan — Foundry Local SDK Startup Check")
    print("=" * 60)

    ok = check_service()
    if not ok:
        sys.exit(1)

    ok = check_sdk()
    if not ok:
        sys.exit(1)

    print("\n" + "=" * 60)
    print("  ✅ ALL CHECKS PASSED — safe to start the backend.")
    print("=" * 60)
    print("\nCommand to start backend:")
    print("  python -m uvicorn backend.main:app --reload --port 8000\n")


if __name__ == "__main__":
    main()
