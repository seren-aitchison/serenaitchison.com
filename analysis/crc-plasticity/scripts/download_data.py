#!/usr/bin/env python3
"""Fetch and verify the input matrices from GEO.

Downloads into crc.config.DATA_DIR (override with CRC_DATA_DIR), verifies SHA-256
against data/manifest.json, and records the checksum of anything not yet listed so
the manifest can be committed. Re-running skips files that already verify.
"""
import hashlib, json, sys, urllib.request
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from crc.config import DATA_DIR
from crc.io import FILES

BASE = "https://ftp.ncbi.nlm.nih.gov/geo/series"
SERIES = {"GSE144735": ["kul3", "kul3_ann"], "GSE132465": ["smc", "smc_ann"],
          "GSE200997": ["gse200997", "gse200997_ann"],
          "GSE178341": ["pelka", "pelka_meta", "pelka_clu"]}
MANIFEST = Path(__file__).resolve().parent.parent / "data" / "manifest.json"

def sha256(path, chunk=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        while (b := fh.read(chunk)): h.update(b)
    return h.hexdigest()

def main(which=None):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    wanted = [which] if which else list(SERIES)
    for gse in wanted:
        stub = gse[:-3] + "nnn"
        for key in SERIES[gse]:
            fn = FILES[key]; dest = DATA_DIR / fn
            if dest.exists() and manifest.get(fn) and sha256(dest) == manifest[fn]["sha256"]:
                print(f"  ok       {fn}"); continue
            url = f"{BASE}/{stub}/{gse}/suppl/{fn}"
            print(f"  fetching {fn} …", flush=True)
            urllib.request.urlretrieve(url, dest)
            digest, size = sha256(dest), dest.stat().st_size
            if fn in manifest and manifest[fn]["sha256"] != digest:
                raise SystemExit(f"CHECKSUM MISMATCH for {fn}\n  expected {manifest[fn]['sha256']}\n  got      {digest}")
            manifest[fn] = dict(sha256=digest, bytes=size, accession=gse, url=url)
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(dict(sorted(manifest.items())), indent=2))
    print(f"manifest: {MANIFEST}")

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else None)
