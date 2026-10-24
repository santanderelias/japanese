import os
import json
import fnmatch
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

def parse_gitignore(gitignore_path='.gitignore'):
    """Extract patterns from .gitignore to filter out untracked files."""
    patterns = []
    if os.path.exists(gitignore_path):
        with open(gitignore_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    patterns.append(line)
    return patterns

def is_ignored(path, root, patterns):
    """Check if a given path matches any .gitignore pattern."""
    rel_path = path.relative_to(root)
    rel_str = str(rel_path).replace('\\', '/')
    
    for pattern in patterns:
        cleaned_pattern = pattern.rstrip('/')
        
        # Check if any parent directory or part matches directory-style patterns
        if any(part == cleaned_pattern for part in rel_path.parts):
            return True
            
        # Match using fnmatch for wildcards and exact names
        if fnmatch.fnmatch(rel_str, pattern) or fnmatch.fnmatch(path.name, pattern):
            return True
            
        # Check against parent paths
        if any(fnmatch.fnmatch(str(p).replace('\\', '/'), pattern) for p in rel_path.parents):
            return True
            
    return False

def main():
    root = Path('.').resolve()
    env_path = root / '.env'
    
    # Load configuration from .env
    env = parse_env(env_path)
    
    # --- Extract All Environment Variables ---
    app_name = env.get('APP_NAME', 'Web App')
    app_short_name = env.get('APP_SHORT_NAME', 'App')
    app_description = env.get('APP_DESCRIPTION', '')
    app_version = env.get('APP_VERSION', '1.0.0')
    app_url = env.get('APP_URL', '')
    
    app_lang = env.get('LANG', 'en')
    app_dir = env.get('DIR', 'ltr')
    raw_categories = env.get('CATEGORIES', '')
    categories = [cat.strip() for cat in raw_categories.split(',')] if raw_categories else []
    
    start_url = env.get('START_URL', '/')
    scope = env.get('SCOPE', '/')
    
    display_mode = env.get('DISPLAY_MODE', 'standalone')
    orientation = env.get('ORIENTATION', 'any')
    background_color = env.get('BACKGROUND_COLOR', '#ffffff')
    theme_color = env.get('THEME_COLOR', '#ffffff')
    
    icon_192 = env.get('ICON_192_PATH', '/src/icon-192.png')
    icon_512 = env.get('ICON_512_PATH', '/src/icon-512.png')
    icon_purpose = env.get('ICON_PURPOSE', 'any maskable')
    
    cache_strategy = env.get('CACHE_STRATEGY', 'cache-first')
    offline_page = env.get('OFFLINE_PAGE', '').strip()
    
    print(f"-> Building complete PWA suite for {app_name} (v{app_version})...")

    # 1. Generate full manifest.json
    manifest = {
        "name": app_name,
        "short_name": app_short_name,
        "description": app_description,
        "start_url": start_url,
        "scope": scope,
        "display": display_mode,
        "orientation": orientation,
        "background_color": background_color,
        "theme_color": theme_color,
        "lang": app_lang,
        "dir": app_dir,
        "categories": categories,
        "icons": [
            {
                "src": icon_192,
                "sizes": "192x192",
                "type": "image/png",
                "purpose": icon_purpose
            },
            {
                "src": icon_512,
                "sizes": "512x512",
                "type": "image/png",
                "purpose": icon_purpose
            }
        ]
    }
    
    manifest_path = root / 'manifest.json'
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(f"   [+] Generated: {manifest_path.name}")

    # 2. Scan files for Service Worker asset list (respecting .gitignore & hard exclusions)
    hard_ignore_files = {'.env', 'setup.py', 'manifest.json', 'sw.js'}
    gitignore_patterns = parse_gitignore(root / '.gitignore')

    assets = ['/']
    if offline_page and offline_page not in assets:
        assets.append(offline_page)
    
    for path in root.rglob('*'):
        if path.is_file():
            if path.name in hard_ignore_files:
                continue
            if is_ignored(path, root, gitignore_patterns):
                continue
            
            rel_path = '/' + str(path.relative_to(root)).replace('\\', '/')
            if rel_path not in assets:
                assets.append(rel_path)

    # 3. Build fetch handler logic safely using standard strings & replace
    if offline_page:
        offline_fallback_code = f"return caches.match('{offline_page}') || Response.error();"
        navigate_fallback = f"return caches.match('{offline_page}');"
    else:
        offline_fallback_code = "return Response.error();"
        navigate_fallback = "return Response.error();"

    if cache_strategy == 'network-first':
        fetch_logic = """  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || __OFFLINE_FALLBACK__;
        });
      })
  );""".replace('__OFFLINE_FALLBACK__', offline_fallback_code)

    elif cache_strategy == 'stale-while-revalidate':
        fetch_logic = """  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Network failed, rely on cache or offline page
      });

      return cachedResponse || fetchPromise.catch(() => { __OFFLINE_FALLBACK__ });
    })
  );""".replace('__OFFLINE_FALLBACK__', offline_fallback_code)

    else:  # cache-first
        if offline_page:
            fetch_logic = """  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          __NAVIGATE_FALLBACK__
        }
        return Response.error();
      });
    })
  );""".replace('__NAVIGATE_FALLBACK__', navigate_fallback)
        else:
            fetch_logic = """  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );"""

    # 4. Generate sw.js using clean string formatting with escaped braces ({{ and }})
    sw_template = """// Auto-generated Service Worker - Version {app_version}
// Target URL: {app_url} | Strategy: {cache_strategy}
const CACHE_NAME = 'app-cache-v{app_version}';
const PRECACHE_ASSETS = {precache_assets};

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
{fetch_logic}
}});
"""

    sw_content = sw_template.format(
        app_version=app_version,
        app_url=app_url,
        cache_strategy=cache_strategy,
        precache_assets=json.dumps(assets, indent=2),
        fetch_logic=fetch_logic
    )

    sw_path = root / 'sw.js'
    sw_path.write_text(sw_content, encoding='utf-8')
    print(f"   [+] Generated: {sw_path.name} with {len(assets)} pre-cached files.")
    print("-> PWA complete setup & generation successful!")

if __name__ == '__main__':
    main()
