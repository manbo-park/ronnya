import type { Suit, Tile } from './types';

export const SUITS: Suit[] = ['m', 'p', 's', 'z'];

/** 패 종류 id: 만 0~8, 통 9~17, 삭 18~26, 자 27~33 (동남서북백발중) */
export function tileId(t: Tile): number {
    return SUITS.indexOf(t.suit) * 9 + (t.rank - 1);
}

export function idToTile(id: number, red = false): Tile {
    const suit = SUITS[Math.floor(id / 9)];
    return { suit, rank: (id % 9) + 1, ...(red ? { red: true } : {}) };
}

export function isHonorId(id: number): boolean {
    return id >= 27;
}

export function isTerminalId(id: number): boolean {
    return id < 27 && (id % 9 === 0 || id % 9 === 8);
}

export function isTerminalOrHonorId(id: number): boolean {
    return isHonorId(id) || isTerminalId(id);
}

export function isSimpleId(id: number): boolean {
    return !isTerminalOrHonorId(id);
}

/** 만 → 통 → 삭 → 자(동남서북백발중), 수패 오름차순 */
export function sortTiles(tiles: Tile[]): Tile[] {
    return [...tiles].sort((a, b) => tileId(a) - tileId(b));
}

/** 왕패 → 도라 (작혼/일반 룰: 9→1, 북→동, 중→백) */
export function nextDoraId(indicatorId: number): number {
    if (indicatorId < 27) {
        const suitBase = Math.floor(indicatorId / 9) * 9;
        return suitBase + ((indicatorId - suitBase + 1) % 9);
    }
    if (indicatorId < 31) {
        // 동남서북 순환
        return 27 + ((indicatorId - 27 + 1) % 4);
    }
    // 백발중 순환
    return 31 + ((indicatorId - 31 + 1) % 3);
}

const HONOR_NAMES = ['동', '남', '서', '북', '백', '발', '중'];
const SUIT_NAMES: Record<Suit, string> = { m: '만', p: '통', s: '삭', z: '' };

/** 텍스트 표기 (테스트/로그용): 5만, 적5통, 동 등 */
export function tileLabel(t: Tile): string {
    if (t.suit === 'z') return HONOR_NAMES[t.rank - 1];
    return `${t.red ? '적' : ''}${t.rank}${SUIT_NAMES[t.suit]}`;
}

export function honorName(rank: number): string {
    return HONOR_NAMES[rank - 1];
}

export const WIND_NAMES = ['동', '남', '서', '북'];

/** 문자열 표기로 패 생성 (테스트 편의): "123m" → [1만,2만,3만], "5z" → 백 */
export function parseTiles(notation: string): Tile[] {
    const out: Tile[] = [];
    const re = /([0-9r]+)([mpsz])/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(notation)) !== null) {
        const [, digits, suit] = match;
        let red = false;
        for (const ch of digits) {
            if (ch === 'r') {
                red = true;
                continue;
            }
            const rank = ch === '0' ? 5 : Number(ch);
            out.push({ suit: suit as Suit, rank, ...(red || ch === '0' ? { red: true } : {}) });
            red = false;
        }
    }
    return out;
}
