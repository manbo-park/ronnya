import type { Meld, Tile } from '../core/types';
import { tileLabel } from '../core/tiles';

/** 파일명(확장자 제외) → 번들된 SVG URL */
const TILE_URLS: Record<string, string> = Object.fromEntries(
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

function faceUrl(t: Tile): string {
    const name = t.suit === 'z' ? HONOR_FILES[t.rank - 1] : `${SUIT_FILES[t.suit]}${t.rank}`;
    return TILE_URLS[t.red ? `${name}-Dora` : name];
}

export function TileView({
    tile,
    win = false,
    back = false,
    dora = false,
}: {
    tile?: Tile;
    win?: boolean;
    back?: boolean;
    /** 도라 (적도라는 tile.red로 자동 판정) */
    dora?: boolean;
}) {
    if (back || !tile) {
        return (
            <div className="tile" aria-hidden="true">
                <img className="tile-img" src={TILE_URLS.Back} alt="" />
            </div>
        );
    }
    const shine = dora || tile.red;
    return (
        <div className={`tile ${win ? 'tile-win' : ''} ${shine ? 'tile-dora' : ''}`}>
            <img className="tile-img" src={TILE_URLS.Front} alt="" />
            <img className="tile-img tile-face" src={faceUrl(tile)} alt={tileLabel(tile)} />
        </div>
    );
}

const MELD_LABEL: Record<Meld['type'], string> = {
    chi: '치',
    pon: '퐁',
    minkan: '밍깡',
    kakan: '가깡',
    ankan: '안깡',
};

type DoraPredicate = (t: Tile) => boolean;

/** 눕힌(가로) 패. 받은 패임을 나타낸다. */
function LaidTile({ tile, dora = false }: { tile: Tile; dora?: boolean }) {
    return (
        <div className="tile-laid">
            <TileView tile={tile} dora={dora} />
        </div>
    );
}

export function MeldView({ meld, isDora }: { meld: Meld; isDora?: DoraPredicate }) {
    return (
        <div className="meld">
            <span className="meld-label">{MELD_LABEL[meld.type]}</span>
            <div className="meld-tiles">{meldTiles(meld, isDora ?? (() => false))}</div>
        </div>
    );
}

function meldTiles(meld: Meld, isDora: DoraPredicate) {
    if (meld.type === 'ankan') {
        return (
            <>
                <TileView back />
                <TileView tile={meld.tiles[1]} dora={isDora(meld.tiles[1])} />
                <TileView tile={meld.tiles[2]} dora={isDora(meld.tiles[2])} />
                <TileView back />
            </>
        );
    }

    // 치: 받은 패를 눕혀 맨 왼쪽(상가)에, 나머지를 이어서 표시
    if (meld.type === 'chi') {
        const called = meld.calledIndex ?? 0;
        const rest = meld.tiles.filter((_, i) => i !== called);
        return (
            <>
                <LaidTile tile={meld.tiles[called]} dora={isDora(meld.tiles[called])} />
                <TileView tile={rest[0]} dora={isDora(rest[0])} />
                <TileView tile={rest[1]} dora={isDora(rest[1])} />
            </>
        );
    }

    // 퐁/밍깡/가깡: 출처 위치의 패를 눕힘 (가깡은 그 위에 한 장 더 쌓음)
    const columns = meld.type === 'kakan' ? meld.tiles.slice(0, 3) : meld.tiles;
    const laidCol = meld.from === 'across' ? 1 : meld.from === 'right' ? columns.length - 1 : 0;
    return columns.map((t, i) => {
        if (i !== laidCol) return <TileView key={i} tile={t} dora={isDora(t)} />;
        if (meld.type !== 'kakan') return <LaidTile key={i} tile={t} dora={isDora(t)} />;
        return (
            <div key={i} className="laid-stack">
                <LaidTile tile={meld.tiles[3]} dora={isDora(meld.tiles[3])} />
                <LaidTile tile={t} dora={isDora(t)} />
            </div>
        );
    });
}
