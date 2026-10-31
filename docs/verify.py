from html.parser import HTMLParser
from pathlib import Path
import re

root = Path(__file__).resolve().parent

class Tags(HTMLParser):
    def __init__(self):
        super().__init__()
        self.attrs = []
    def handle_starttag(self, tag, attrs):
        self.attrs.append((tag, dict(attrs)))

html = (root / 'index.html').read_text(encoding='utf-8')
js = (root / 'app.js').read_text(encoding='utf-8')
parser = Tags()
parser.feed(html)
assert sum(tag == 'article' and d.get('class', '').startswith('project-card') for tag, d in parser.attrs) == 3
assert 'https://github.com/sialock/DonorShift-Bench' in html
assert 'https://github.com/sialock/protein-folding-' in html
assert all((root / f).is_file() for f in ['styles.css', 'app.js', 'favicon.svg', '.nojekyll'])
ids = {d.get('id') for _, d in parser.attrs if d.get('id')}
assert all(d['data-scroll-target'] in ids for _, d in parser.attrs if d.get('data-scroll-target'))
assert 'cdn.jsdelivr.net/npm/three@0.169.0' in js
assert 'prefers-reduced-motion' in js
assert 'fallback-universe' in html
assert not re.search(r'api[_-]?key|private[_-]?token', js, flags=re.I)
print('Molecular Universe static checks passed')