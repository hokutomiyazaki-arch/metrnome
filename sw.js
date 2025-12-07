const CACHE_NAME = 'fnt-metronome-v1';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './FNT512.png',
    './FNT512-transparent.png'
];

// インストール時にキャッシュ
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching assets');
                return cache.addAll(ASSETS);
            })
            .then(() => {
                // 即座にアクティブ化
                return self.skipWaiting();
            })
    );
});

// アクティブ化時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                // 全クライアントを即座に制御
                return self.clients.claim();
            })
    );
});

// フェッチリクエストの処理
self.addEventListener('fetch', (event) => {
    // ナビゲーションリクエストの場合
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // 新しいレスポンスをキャッシュに保存
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // オフライン時はキャッシュから
                    return caches.match(event.request);
                })
        );
        return;
    }

    // その他のリクエスト - Network First戦略
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // 有効なレスポンスのみキャッシュ
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // オフライン時はキャッシュから
                return caches.match(event.request);
            })
    );
});

// バックグラウンド同期（将来の拡張用）
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-settings') {
        console.log('Background sync triggered');
    }
});

// プッシュ通知（将来の拡張用）
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: './FNT512.png'
        });
    }
});
