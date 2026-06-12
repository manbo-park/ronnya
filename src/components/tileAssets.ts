import type { Tile } from '../core/types';

/** 파일명(확장자 제외) → 번들된 SVG URL */
export const TILE_URLS: Record<string, string> = Object.fromEntries(
    Object.entries(
        import.meta.glob<string>('../assets/tiles/*.svg', {
            eager: true,
            query: '?url',
            import: 'default',
        }),
    ).map(([path, url]) => [path.replace(/^.*\/|\.svg$/g, ''), url]),
);

const HONOR_FILES = ['Ton', 'Nan', 'Shaa', 'Pei', 'Haku', 'Hatsu', 'Chun'];
const SUIT_FILES: Record<string, string> = { m: 'Man', p: 'Pin', s: 'Sou' };

export function faceUrl(t: Tile): string {
    const name = t.suit === 'z' ? HONOR_FILES[t.rank - 1] : `${SUIT_FILES[t.suit]}${t.rank}`;
    return TILE_URLS[t.red ? `${name}-Dora` : name];
}

/** 패 이미지를 미리 받아, 화면 공개 시 패가 한 장씩 무작위로 나타나는 것을 막는다 (#32) */
export function preloadTileImages(tiles: Tile[]): Promise<void> {
    // SSR·테스트 환경에는 Image가 없다
    if (typeof Image === 'undefined') return Promise.resolve();
    const urls = new Set([TILE_URLS.Front, TILE_URLS.Back, ...tiles.map(faceUrl)]);
    return Promise.allSettled(
        [...urls].map(
            (url) =>
                new Promise<void>((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                    img.src = url;
                }),
        ),
    ).then(() => undefined);
}
