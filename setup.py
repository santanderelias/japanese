import os
import json
from pathlib import Path

def parse_env(env_path='.env'):
    """Simple parser for the .env configuration file."""
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip().strip('"\'')
    return env_vars

def generate_pwa_files(root_dir='.'):
    root = Path(root_dir).resolve()
    env_path = root / '.env'
    
    # Load configuration from .env
    env = parse_env(env_path)
    
    app_name = env.get('APP_NAME', 'Web App')
    app_short_name = env.get('APP_SHORT_NAME', 'App')
    app_version = env.get('APP_VERSION', '1.0.0')
    theme_color = env.get('THEME_COLOR', '#ffffff')
    background_color = env.get('BACKGROUND_COLOR', '#ffffff')
    start_url = env.get('START_URL', '/')
    
    print(f"-> Building PWA assets for {app_name} (v{app_version})...")

    # 1. Generate manifest.json
    manifest = {
        "name": app_name,
        "short_name": app_short_name,
        "start_url": start_url,
        "display": "standalone",
        "background_color": background_color,
        "theme_color": theme_color,
        "icons": [
            {
                "src": "/assets/icon-192.png",
                "sizes": "192x192",
                "type": "image/png"
            },
            {
                "src": "/assets/icon-512.png",
                "sizes": "512x512",
                "type": "image/png"
            }
        ]
    }
    
    manifest_path = root / 'manifest.json'
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(f"   [+] Generated: {manifest_path.name}")

    # 2. Scan files for Service Worker asset list with strict exclusions
    ignore_dirs = {'.git', 'old', '__pycache__', '.vscode'}
    ignore_files = {'.env', 'CNAME', 'manifest.json', 'sw.js', 'setup.py'}
    ignore_extensions = {'.map', '.py'}

    assets = ['/']
    
    for path in root.rglob('*'):
        # Skip if any parent folder matches an ignored directory name
        if any(part in ignore_dirs for part in path.parts):
            continue
            
        if path.is_file():
            if path.name in ignore_files or path.suffix in ignore_extensions:
                continue
            
            # Create a clean, web-safe relative path
            rel_path = '/' + str(path.relative_to(root)).replace('\\', '/')
            if rel_path not in assets:
                assets.append(rel_path)

    # 3. Generate sw.js (Service Worker)
    sw_content = f"""// Auto-generated Service Worker - Version {app_version}
const CACHE_NAME = 'app-cache-v{app_version}';

const PRECACHE_ASSETS = {json.dumps(assets, indent=2)};

self.addEventListener('install', (event) => {{
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {{
      console.log('[Service Worker] Pre-caching application assets...');
      return cache.addAll(PRECACHE_ASSETS);
    }})
  );
  self.skipWaiting();
}});

self.addEventListener('activate', (event) => {{
  event.waitUntil(
    caches.keys().then((cacheNames) => {{
      return Promise.all(
        cacheNames.map((cacheName) => {{
          if (cacheName !== CACHE_NAME) {{
            console.log('[Service Worker] Deleting obsolete cache:', cacheName);
            return caches.delete(cacheName);
          }}
        }})
      );
    }})
  );
  self.clients.claim();
}});

self.addEventListener('fetch', (event) => {{
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {{
      return cachedResponse || fetch(event.request);
    }})
  );
}});
"""

    sw_path = root / 'sw.js'
    sw_path.write_text(sw_content, encoding='utf-8')
    print(f"   [+] Generated: {sw_path.name} with {len(assets)} pre-cached files.")
    print("-> PWA setup complete!")

if __name__ == '__main__':
    generate_pwa_files()
