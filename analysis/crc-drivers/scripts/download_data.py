#!/usr/bin/env python3
"""Fetch TCGA COAD and READ matrices from the UCSC Xena GDC hub, verified by SHA-256."""
import hashlib, json, sys, urllib.request
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from crcd.config import DATA_DIR
from crcd.io import FILES

BASE = "https://gdc.xenahubs.net/download"
MANIFEST = Path(__file__).resolve().parent.parent / "data" / "manifest.json"

def sha256(p, chunk=1 << 20):
    h = hashlib.sha256()
    with open(p, "rb") as fh:
        while (b := fh.read(chunk)): h.update(b)
    return h.hexdigest()

def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    for cohort, kinds in FILES.items():
        for kind, fn in kinds.items():
            dest = DATA_DIR / fn
            if dest.exists() and manifest.get(fn) and sha256(dest) == manifest[fn]["sha256"]:
                print(f"  ok       {fn}"); continue
            print(f"  fetching {fn} …", flush=True)
            urllib.request.urlretrieve(f"{BASE}/{fn}", dest)
            digest = sha256(dest)
            if fn in manifest and manifest[fn]["sha256"] != digest:
                raise SystemExit(f"CHECKSUM MISMATCH for {fn}")
            manifest[fn] = dict(sha256=digest, bytes=dest.stat().st_size, cohort=cohort, kind=kind)
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(dict(sorted(manifest.items())), indent=2))
    print(f"manifest: {MANIFEST}")

if __name__ == "__main__": main()
