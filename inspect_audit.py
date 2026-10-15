import json

with open('deep_audit_report.json', encoding='utf-8') as f:
    d = json.load(f)

print("=== 1. JS BUNDLES ===")
for s in d['all_js_bundles']:
    print(s)

print("\n=== 2. MODALS AND OVERLAYS ===")
for m in d['modals_and_overlays']:
    print(f"[{m['tag']}] {m['class']} -> {m['text'][:100]}")

print("\n=== 3. HIDDEN TAGS WITH TEXT ===")
seen = set()
for h in d['hidden_tags']:
    txt = h['text'].strip()
    if txt and txt not in seen:
        seen.add(txt)
        print(f"[{h['tag']}] {h['class']} (Reasons: {h['reasons']}) -> {txt[:100]}")
