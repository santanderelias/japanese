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

def parse_cache_exclude(env_value):
    """Parse comma-separated exclusion patterns from .env."""
    if not env_value:
        return ['old', 'scripts', '*.md', '*.py', 'CNAME']
    return [pattern.strip() for pattern in env_value.split(',') if pattern.strip()]

def is_ignored(path, root, exclude_patterns):
    """Check if a path matches hidden system files or user-defined blacklist rules."""
    rel_path = path.relative_to(root)
    rel_str = str(rel_path).replace('\\', '/')
    
    # 1. Hardcoded safety: Always ignore hidden files/directories (like .git, .github)
    if any(part.startswith('.') for part in rel_path.parts):
        return True

    # 2. Core build files that should never be cached
    hard_ignore_files = {'.env', 'setup.py', 'manifest.json', 'sw.js'}
    if path.name in hard_ignore_files:
        return True

    # 3. Apply custom blacklist patterns from CACHE_EXCLUDE
    for pattern in exclude_patterns:
        cleaned_pattern = pattern.rstrip('/')
        
        # Match directory name segments (e.g., 'old')
        if any(part == cleaned_pattern for part in rel_path.parts):
            return True
            
        # Match wildcards or exact filenames (e.g., '*.py', 'CNAME')
        if fnmatch.fnmatch(rel_str, pattern) or fnmatch.fnmatch(path.name, pattern):
            return True
            
        # Match parent directories against patterns
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
    
    # Load exclusion rules from environment
    exclude_patterns = parse_cache_exclude(env.get('CACHE_EXCLUDE', ''))
    
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

    # 2. Scan files for Service Worker asset list (respecting blacklist & hidden dirs)
    assets = ['/']
    if offline_page and offline_page not in assets:
        assets.append(offline_page)
    
    for path in root.rglob('*'):
        if path.is_file():
            if is_ignored(path, root, exclude_patterns):
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
          __NAV_FALLBACK__
        }
        return Response.error();
      });
    })
  );""".replace('__NAV_FALLBACK__', navigate_fallback)
        else:
            fetch_logic = """  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );"""

    # 4. Generate sw.js using clean string formatting with escaped braces ({{ and }})
    sw_template = """// Auto-generated Service Worker - Version {app_version}
// Target URL: {app_url} | Strategy: {cache_strategy}
const CACHE_NAME = '{app_version}';
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
    }}).then(() => {{
      self.clients.claim();
      cacheAudioInBatches();
    }})
  );
}});

async function cacheAudioInBatches() {{
  try {{
    const response = await fetch('/content/audio_map.json');
    if (!response.ok) return;
    const audioMap = await response.json();
    const filenames = Array.from(new Set(Object.values(audioMap)));
    const audioUrls = filenames.map(f => `/content/audio/${{f}}`);

    const cache = await caches.open(CACHE_NAME);
    const BATCH_SIZE = 10;
    const BATCH_DELAY = 1000;

    for (let i = 0; i < audioUrls.length; i += BATCH_SIZE) {{
      const batch = audioUrls.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (url) => {{
          const match = await cache.match(url);
          if (!match) {{
            try {{
              const res = await fetch(url);
              if (res.ok) {{
                await cache.put(url, res);
              }}
            }} catch {{
              // Ignore background fetch error
            }}
          }}
        }})
      );
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
    }}
  }} catch {{
    // Ignore background cache error
  }}
}}

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
