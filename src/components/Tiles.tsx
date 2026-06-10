import type { Meld, Tile } from '../core/types';

const HONOR_CHARS = ['東', '南', '西', '北', '白', '發', '中'];
const SUIT_CHARS: Record<string, string> = { m: '萬', p: '筒', s: '索' };

export function TileView({
    tile,
    win = false,
    back = false,
}: {
    tile?: Tile;
    win?: boolean;
    back?: boolean;
}) {
    if (back || !tile) return <div className="tile tile-back" aria-hidden="true" />;
    if (tile.suit === 'z') {
        const ch = HONOR_CHARS[tile.rank - 1];
        const cls =
            tile.rank === 6
                ? 'h-green'
                : tile.rank === 7
                  ? 'h-red'
                  : tile.rank === 5
                    ? 'h-white'
                    : 'h-ink';
        return (
            <div className={`tile ${win ? 'tile-win' : ''}`}>
                <span className={`honor ${cls}`}>{ch}</span>
            </div>
        );
    }
    return (
        <div className={`tile ${win ? 'tile-win' : ''}`}>
            <span className={`num suit-${tile.suit} ${tile.red ? 'red5' : ''}`}>{tile.rank}</span>
            <span className={`suit suit-${tile.suit}`}>{SUIT_CHARS[tile.suit]}</span>
            {tile.red && <span className="red-dot" aria-label="적도라" />}
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
