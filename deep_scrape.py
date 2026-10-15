import urllib.request
import gzip
import json
import re
from bs4 import BeautifulSoup

with open('antigravity_scraped_raw.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

report = {
    "hidden_tags": [],
    "scripts": [],
    "astro_islands": [],
    "interactive_components": [],
    "modals_and_overlays": [],
    "svg_icons": [],
    "all_js_bundles": [],
    "dynamic_json": []
}

# 1. Hidden Elements (aria-hidden, display:none, hidden, visually-hidden)
for el in soup.find_all(True):
    is_hidden = False
    reasons = []
    if el.has_attr('hidden'):
        is_hidden = True
        reasons.append('has hidden attr')
    if el.get('aria-hidden') == 'true':
        is_hidden = True
        reasons.append('aria-hidden=true')
    if el.has_attr('class'):
        classes = el.get('class')
        if any('hidden' in c.lower() or 'modal' in c.lower() or 'drawer' in c.lower() or 'dropdown' in c.lower() for c in classes):
            is_hidden = True
            reasons.append(f"class contains hidden/modal: {classes}")
    style = el.get('style', '')
    if 'display:none' in style.replace(' ', '') or 'visibility:hidden' in style.replace(' ', ''):
        is_hidden = True
        reasons.append(f"inline style: {style}")

    if is_hidden:
        report["hidden_tags"].append({
            "tag": el.name,
            "id": el.get('id', ''),
            "class": el.get('class', []),
            "reasons": reasons,
            "text": ' '.join(el.get_text().split())[:120]
        })

# 2. Astro Islands / Custom Web Components / Templates
for el in soup.find_all(re.compile(r'^(astro-|template)')):
    report["astro_islands"].append({
        "tag": el.name,
        "attrs": {k: str(v) for k, v in el.attrs.items()}
    })

# 3. Scripts and JS bundles
for s in soup.find_all('script'):
    src = s.get('src')
    stype = s.get('type')
    content = s.string.strip() if s.string else ""
    if src:
        report["all_js_bundles"].append(src)
    else:
        report["scripts"].append({"type": stype, "snippet": content[:150]})

# 4. Modals and Overlays
for el in soup.find_all(lambda e: any(k in ' '.join(e.get('class', [])).lower() for k in ['modal', 'dialog', 'overlay', 'backdrop', 'popup', 'context-menu', 'drawer', 'tooltip'])):
    report["modals_and_overlays"].append({
        "tag": el.name,
        "class": el.get('class', []),
        "text": ' '.join(el.get_text().split())[:120]
    })

# 5. SVGs
for svg in soup.find_all('svg'):
    cls = svg.get('class', [])
    viewbox = svg.get('viewbox') or svg.get('viewBox')
    report["svg_icons"].append({
        "class": cls,
        "viewBox": viewbox,
        "width": svg.get('width'),
        "height": svg.get('height')
    })

with open('deep_audit_report.json', 'w', encoding='utf-8') as out:
    json.dump(report, out, indent=2, ensure_ascii=False)

print(f"Deep audit done!")
print(f"Hidden tags detected: {len(report['hidden_tags'])}")
print(f"Modals/overlays detected: {len(report['modals_and_overlays'])}")
print(f"JS bundles: {len(report['all_js_bundles'])}")
print(f"SVGs count: {len(report['svg_icons'])}")
