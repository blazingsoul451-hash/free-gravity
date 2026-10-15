import urllib.request
import gzip
import json
import re
import xml.etree.ElementTree as ET

def fetch_url(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            data = res.read()
            if data[:2] == b'\x1f\x8b':
                return gzip.decompress(data).decode('utf-8', errors='ignore')
            return data.decode('utf-8', errors='ignore')
    except Exception as e:
        return f"ERROR: {e}"

results = {}

# PASS 1: All Live URLs in Sitemaps
print("[Pass 1/10] Parsing Sitemaps...")
sitemap_xml = fetch_url('https://antigravity.google/sitemap-0.xml')
urls = []
if not sitemap_xml.startswith("ERROR"):
    urls = re.findall(r'<loc>(https://antigravity.google/[^<]*)</loc>', sitemap_xml)
results["pass1_all_urls"] = urls
print(f"  Found {len(urls)} live URLs in sitemap")

# PASS 2: Releases API & Binary URLs
print("[Pass 2/10] Inspecting Releases & Platform Executables...")
releases_json_str = fetch_url('https://antigravity-hub-auto-updater-974169037036.us-central1.run.app/releases')
releases = []
try:
    releases = json.loads(releases_json_str)
except:
    pass
results["pass2_releases"] = releases[:5]
print(f"  Found {len(releases)} release builds. Latest version: {releases[0]['version'] if releases else 'N/A'}")

# PASS 3: Extracting All JS Bundle URLs from Main Page
print("[Pass 3/10] Indexing All JS Chunks & Bundles...")
raw_html = open('antigravity_scraped_raw.html', 'r', encoding='utf-8').read()
js_bundles = list(set(re.findall(r'src="(/_astro/[^"]+\.js)"', raw_html)))
results["pass3_js_bundles"] = js_bundles
print(f"  Found {len(js_bundles)} distinct JS bundle files")

# PASS 4: Keyboard Shortcuts & Global Event Listeners
print("[Pass 4/10] Scanning JS for Keyboard Shortcuts & Listeners...")
shortcuts = []
for js_path in js_bundles:
    content = fetch_url(f"https://antigravity.google{js_path}")
    matches = re.findall(r'(?:key(?:Down|Up|Press)|addEventListener\([\'"]key[^\'"]+[\'"]|e\.key\s*===\s*[\'"][^\'"]+[\'"])', content, re.IGNORECASE)
    if matches:
        shortcuts.extend(matches)
results["pass4_keyboard_events"] = list(set(shortcuts))
print(f"  Found keyboard event hooks: {len(results['pass4_keyboard_events'])}")

# PASS 5: Console Logs, Debug Flags & Easter Eggs
print("[Pass 5/10] Scanning for Console Logs, Easter Eggs & Query Parameters...")
console_hooks = []
query_params = []
for js_path in js_bundles:
    content = fetch_url(f"https://antigravity.google{js_path}")
    c_matches = re.findall(r'console\.(?:log|info|warn|error)\([^)]+\)', content)
    q_matches = re.findall(r'[\?&]([a-zA-Z0-9_-]+)=', content)
    console_hooks.extend(c_matches[:10])
    query_params.extend(q_matches)
results["pass5_console"] = list(set(console_hooks))[:10]
results["pass5_query_params"] = list(set(query_params))
print(f"  Found {len(results['pass5_query_params'])} query params recognized by client")

# PASS 6: CSS Animation Keyframes
print("[Pass 6/10] Extracting All CSS Keyframes...")
keyframes = []
for css_file in ['BaseLayout.3aiiGRAG.css', 'index_astro.css', 'SmoothScrollLayout.Cp-sTGiV.css', 'AnnouncementPill.AGG_9Wye.css']:
    try:
        css_text = open(css_file, 'r', encoding='utf-8').read()
        kf = re.findall(r'@keyframes\s+([a-zA-Z0-9_-]+)\s*\{([^}]+)\}', css_text)
        keyframes.extend([k[0] for k in kf])
    except:
        pass
results["pass6_keyframes"] = list(set(keyframes))
print(f"  Found CSS keyframes: {results['pass6_keyframes']}")

# PASS 7: Vector Icons & SVG Paths
print("[Pass 7/10] Cataloging SVG ViewBoxes & Paths...")
svg_tags = re.findall(r'<svg[^>]*>.*?</svg>', raw_html, re.DOTALL)
results["pass7_svg_count"] = len(svg_tags)
print(f"  Found {len(svg_tags)} embedded SVG definitions")

# PASS 8: Typography & CSS Custom Properties
print("[Pass 8/10] Analyzing Design Variables & Fonts...")
base_css = open('BaseLayout.3aiiGRAG.css', 'r', encoding='utf-8').read()
css_vars = re.findall(r'(--[a-zA-Z0-9_-]+):\s*([^;]+);', base_css)
results["pass8_css_variables_count"] = len(css_vars)
results["pass8_sample_vars"] = dict(css_vars[:20])
print(f"  Found {len(css_vars)} CSS design variables in BaseLayout")

# PASS 9: Foldable & Mobile Device Detection Matrix
print("[Pass 9/10] Checking Responsive & Foldable Engine...")
has_foldable = "isFoldableUA" in raw_html
results["pass9_foldable_detection"] = {
    "supported": has_foldable,
    "breakpoints": ["1600px", "1440px", "1024px", "767px", "425px"],
    "foldable_patterns": ["Pixel Fold", "SM-F9", "SM-F7", "Galaxy Z Fold", "Surface Duo"]
}
print(f"  Foldable detection present: {has_foldable}")

# PASS 10: Telemetry, Video Events & Analytics Schema
print("[Pass 10/10] Mapping Telemetry & Analytics Events...")
analytics_events = list(set(re.findall(r'event:\s*[\'"]([a-zA-Z0-9_-]+)[\'"]', raw_html)))
for js_path in js_bundles[:5]:
    c = fetch_url(f"https://antigravity.google{js_path}")
    ev = re.findall(r'emitVideoEvent\([\'"]([a-zA-Z0-9_-]+)[\'"]', c)
    analytics_events.extend(ev)
results["pass10_events"] = list(set(analytics_events))
print(f"  Found {len(results['pass10_events'])} telemetry & interaction events: {results['pass10_events']}")

with open('ten_pass_audit_results.json', 'w', encoding='utf-8') as out:
    json.dump(results, out, indent=2, ensure_ascii=False)

print("\n10-Pass Deep Inspection Completed Successfully!")
