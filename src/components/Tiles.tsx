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
}: {
    tile?: Tile;
    win?: boolean;
    back?: boolean;
}) {
    if (back || !tile) {
        return (
            <div className="tile" aria-hidden="true">
                <img className="tile-img" src={TILE_URLS.Back} alt="" />
            </div>
        );
    }
    return (
        <div className={`tile ${win ? 'tile-win' : ''}`}>
            <img className="tile-img" src={TILE_URLS.Front} alt="" />
            <img className="tile-img" src={faceUrl(tile)} alt={tileLabel(tile)} />
        </div>
    );
}

const MELD_LABEL: Record<Meld['type'], string> = {
    chi: '치',
    pon: '퐁',
    minkan: '밍깡',
    ankan: '안깡',
};

export function MeldView({ meld }: { meld: Meld }) {
    return (
        <div className="meld">
            <span className="meld-label">{MELD_LABEL[meld.type]}</span>
            <div className="meld-tiles">
                {meld.type === 'ankan' ? (
                    <>
                        <TileView back />
                        <TileView tile={meld.tiles[1]} />
                        <TileView tile={meld.tiles[2]} />
                        <TileView back />
                    </>
                ) : (
                    meld.tiles.map((t, i) => <TileView key={i} tile={t} />)
                )}
            </div>
        </div>
    );
}
