import urllib.request
import re
from bs4 import BeautifulSoup

url = 'https://www.facebook.com/share/v/19YRMgJkoe/'
req = urllib.request.Request(url, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
})

try:
    with urllib.request.urlopen(req, timeout=10) as response:
        final_url = response.geturl()
        print('Final URL:', final_url)
        content = response.read().decode('utf-8', errors='ignore')
        print('Length:', len(content))
        with open('fb_page.html', 'w', encoding='utf-8') as f:
            f.write(content)
        
        soup = BeautifulSoup(content, 'html.parser')
        print('Title:', soup.title.string if soup.title else None)
        for meta in soup.find_all('meta'):
            prop = meta.get('property') or meta.get('name')
            if prop in ['og:title', 'og:description', 'description', 'twitter:title', 'twitter:description', 'og:video:url', 'og:url']:
                print(f'{prop}: {meta.get("content")}')
except Exception as e:
    print('Error:', e)
