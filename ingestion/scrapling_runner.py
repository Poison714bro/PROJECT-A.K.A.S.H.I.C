"""
Scrapling Tactical Web Harvester CLI Bridge for Project Akashic.
Invoked by Next.js API route /api/v1/scraper via stdin/stdout JSON.
"""

import sys
import os
import json
import time
import re
from pathlib import Path

# Add project root and Semantica path
AKASHIC_ROOT = Path(__file__).resolve().parent.parent
SEMANTICA_PATH = AKASHIC_ROOT.parent / "semantica"

for p in [str(AKASHIC_ROOT), str(SEMANTICA_PATH)]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from semantica.ingest.scrapling_fetcher import ScraplingFetcher
except ImportError as exc:
    print(json.dumps({"success": False, "error": f"Failed to import ScraplingFetcher: {exc}"}))
    sys.exit(0)


def extract_threat_entities(text: str) -> dict:
    """Extract OSINT & Cybercrime indicators from scraped text."""
    entities = {
        "btc_wallets": list(set(re.findall(r"\b(?:1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-HJ-NP-Z0-9]{39,59})\b", text))),
        "onion_links": list(set(re.findall(r"\b[a-z2-7]{16,56}\.onion\b", text, re.IGNORECASE))),
        "pgp_keys": list(set(re.findall(r"-----BEGIN PGP PUBLIC KEY BLOCK-----[\s\S]+?-----END PGP PUBLIC KEY BLOCK-----", text))),
        "vendor_handles": list(set(re.findall(r"\b(?:vendor|user|alias|author|seller|handle)\s*[:=]?\s*([a-zA-Z0-9_\-]{3,24})\b", text, re.IGNORECASE))),
        "keywords_detected": list(set(re.findall(r"\b(?:target|corridor|precursor|chemical|logistics|cargo|synthesis|supply|shipment)\b", text, re.IGNORECASE))),
        "emails": list(set(re.findall(r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b", text))),
    }
    return entities


def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            print(json.dumps({"success": False, "error": "No input provided to scraper runner."}))
            return

        payload = json.loads(raw_input)
        url = payload.get("url")
        if not url:
            print(json.dumps({"success": False, "error": "URL is required"}))
            return

        fetcher_type = payload.get("fetcher_type", "static")
        item_selector = payload.get("item_selector")
        field_selectors = payload.get("field_selectors")
        timeout = payload.get("timeout", 20)
        allow_private_ips = payload.get("allow_private_ips", False)

        start_time = time.time()
        fetcher = ScraplingFetcher(
            fetcher_type=fetcher_type,
            timeout=timeout,
            allow_private_ips=allow_private_ips,
        )

        if item_selector:
            res = fetcher.scrape(
                url,
                item_selector=item_selector,
                field_selectors=field_selectors,
            )
        else:
            res = fetcher.fetch(url)

        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        items_data = []
        for it in res.items:
            items_data.append({
                "title": it.title or "",
                "price": it.price or "",
                "price_value": it.price_value,
                "currency": it.currency or "",
                "availability": it.availability or "",
                "in_stock": it.in_stock,
                "description": it.description or "",
                "url": it.url or "",
                "attributes": it.attributes or {},
            })

        threats = extract_threat_entities(res.text + " " + res.html[:50000])

        out = {
            "success": res.success,
            "url": res.url,
            "status_code": res.status_code,
            "fetcher_type": fetcher_type,
            "engine": f"scrapling-{fetcher_type}",
            "title": res.title,
            "text": res.text[:5000],
            "items": items_data,
            "links": res.links[:50],
            "execution_time_ms": elapsed_ms,
            "threat_entities": threats,
            "error": res.error,
        }

        print(json.dumps(out))

    except Exception as exc:
        print(json.dumps({"success": False, "error": str(exc)}))


if __name__ == "__main__":
    main()
