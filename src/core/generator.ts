import type { Meld, MeldFrom, Problem, ScoringResult, Tile } from './types';
import { idToTile, sortTiles, tileId } from './tiles';
import { KOKUSHI_IDS } from './decompose';
import { scoreHand } from './score';

export interface GeneratedProblem {
    problem: Problem;
    result: ScoringResult;
}

type Rng = () => number;

/** 합법성이 검증된 문제 1건 생성. 생성과 채점이 같은 엔진을 공유한다. */
export function generateProblem(rng: Rng = Math.random): GeneratedProblem {
    for (let attempt = 0; attempt < 1000; attempt++) {
        const r = rng();
        let problem: Problem | null;
        if (r < 0.94) problem = buildStandard(rng);
        else if (r < 0.99) problem = buildChiitoi(rng);
        else problem = buildKokushi(rng);
        if (!problem) continue;
        try {
            const result = scoreHand(problem);
            return { problem, result };
        } catch {
            continue; // 역 없음 / 형태 불성립 → 재생성
        }
    }
    throw new Error('문제 생성에 실패했습니다');
}

// ---------- 내부 구현 ----------

interface Group {
    kind: 'pair' | 'run' | 'set';
    tile: number;
    open: boolean;
    kan: 'none' | 'ankan' | 'minkan' | 'kakan';
}

function buildStandard(rng: Rng): Problem | null {
    const used = new Array<number>(34).fill(0);
    const take = (id: number, n: number): boolean => {
        if (used[id] + n > 4) return false;
        used[id] += n;
        return true;
    };

    // 1) 또이쯔 + 4멘쯔 조립
    const groups: Group[] = [];
    const pairId = pickTileId(rng, 0.18);
    if (!take(pairId, 2)) return null;
    groups.push({ kind: 'pair', tile: pairId, open: false, kan: 'none' });

    for (let i = 0; i < 4; i++) {
        let placed = false;
        for (let retry = 0; retry < 30 && !placed; retry++) {
            if (rng() < 0.68) {
                const suit = Math.floor(rng() * 3);
                const start = suit * 9 + Math.floor(rng() * 7);
                if (used[start] < 4 && used[start + 1] < 4 && used[start + 2] < 4) {
                    take(start, 1);
                    take(start + 1, 1);
                    take(start + 2, 1);
                    groups.push({ kind: 'run', tile: start, open: false, kan: 'none' });
                    placed = true;
                }
            } else {
                const id = pickTileId(rng, 0.16);
                if (take(id, 3)) {
                    groups.push({ kind: 'set', tile: id, open: false, kan: 'none' });
                    placed = true;
                }
            }
        }
        if (!placed) return null;
    }

    // 2) 후로 결정
    const openCount = weighted(rng, [0.55, 0.25, 0.13, 0.07]);
    const setIndices = shuffle(rng, [1, 2, 3, 4]); // groups[0]은 또이쯔
    for (let i = 0; i < openCount; i++) {
        groups[setIndices[i]].open = true;
    }

    // 3) 깡 승격 (커쯔만, 4번째 패 가용 시)
    for (const g of groups) {
        if (g.kind !== 'set') continue;
        if (rng() < 0.07 && take(g.tile, 1)) {
            if (!g.open) g.kan = 'ankan';
            else g.kan = rng() < 0.5 ? 'minkan' : 'kakan';
        }
    }

    // 4) 오름패: 은닉 그룹(또이쯔 + 후로/깡이 아닌 멘쯔)에서 선택
    const concealedGroups = groups.filter((g) => !g.open && g.kan === 'none');
    const winGroup = concealedGroups[Math.floor(rng() * concealedGroups.length)];
    let winId: number;
    if (winGroup.kind === 'run') winId = winGroup.tile + Math.floor(rng() * 3);
    else winId = winGroup.tile;

    // 5) 패 인스턴스 생성
    const concealedTiles: Tile[] = [];
    for (const g of concealedGroups) {
        if (g.kind === 'run') {
            concealedTiles.push(idToTile(g.tile), idToTile(g.tile + 1), idToTile(g.tile + 2));
        } else {
            const n = g.kind === 'pair' ? 2 : 3;
            for (let i = 0; i < n; i++) concealedTiles.push(idToTile(g.tile));
        }
    }
    const winIdx = concealedTiles.findIndex((t) => tileId(t) === winId);
    const winningTile = concealedTiles.splice(winIdx, 1)[0];

    const randomFrom = (): MeldFrom =>
        (['left', 'across', 'right'] as const)[Math.floor(rng() * 3)];
    const melds: Meld[] = groups
        .filter((g) => g.open || g.kan !== 'none')
        .map((g) => {
            if (g.kind === 'run') {
                return {
                    type: 'chi' as const,
                    tiles: [idToTile(g.tile), idToTile(g.tile + 1), idToTile(g.tile + 2)],
                    from: 'left' as const, // 치는 상가에서만 가능
                    calledIndex: Math.floor(rng() * 3),
                };
            }
            if (g.kan === 'ankan')
                return { type: 'ankan' as const, tiles: [0, 1, 2, 3].map(() => idToTile(g.tile)) };
            if (g.kan === 'minkan' || g.kan === 'kakan')
                return {
                    type: g.kan,
                    tiles: [0, 1, 2, 3].map(() => idToTile(g.tile)),
                    from: randomFrom(),
                };
            return {
                type: 'pon' as const,
                tiles: [0, 1, 2].map(() => idToTile(g.tile)),
                from: randomFrom(),
            };
        });

    const kanCount = groups.filter((g) => g.kan !== 'none').length;
    const hasOpenMeld = melds.some((m) => m.type !== 'ankan');

    return finishProblem(rng, used, concealedTiles, melds, winningTile, {
        closed: !hasOpenMeld,
        kanCount,
        riichiP: 0.5,
    });
}

function buildChiitoi(rng: Rng): Problem | null {
    const used = new Array<number>(34).fill(0);
    const ids = shuffle(
        rng,
        Array.from({ length: 34 }, (_, i) => i),
    ).slice(0, 7);
    const tiles: Tile[] = [];
    for (const id of ids) {
        used[id] += 2;
        tiles.push(idToTile(id), idToTile(id));
    }
    const winId = ids[Math.floor(rng() * 7)];
    const winIdx = tiles.findIndex((t) => tileId(t) === winId);
    const winningTile = tiles.splice(winIdx, 1)[0];
    return finishProblem(rng, used, tiles, [], winningTile, {
        closed: true,
        kanCount: 0,
        riichiP: 0.55,
    });
}

function buildKokushi(rng: Rng): Problem | null {
    const used = new Array<number>(34).fill(0);
    const dup = KOKUSHI_IDS[Math.floor(rng() * KOKUSHI_IDS.length)];
    const tiles: Tile[] = [];
    for (const id of KOKUSHI_IDS) {
        used[id] += id === dup ? 2 : 1;
        tiles.push(idToTile(id));
        if (id === dup) tiles.push(idToTile(id));
    }
    // 35%: 13면 대기 (오름패 = 중복패), 그 외: 단면 대기
    let winId: number;
    if (rng() < 0.35) winId = dup;
    else {
        const others = KOKUSHI_IDS.filter((id) => id !== dup);
        winId = others[Math.floor(rng() * others.length)];
    }
    const winIdx = tiles.findIndex((t) => tileId(t) === winId);
    const winningTile = tiles.splice(winIdx, 1)[0];
    return finishProblem(rng, used, tiles, [], winningTile, {
        closed: true,
        kanCount: 0,
        riichiP: 0.25,
    });
}

function finishProblem(
    rng: Rng,
    used: number[],
    hand: Tile[],
    melds: Meld[],
    winningTile: Tile,
    opts: { closed: boolean; kanCount: number; riichiP: number },
): Problem {
    // 적도라 치환 (수트당 1장, 표시패 제외)
    const allInstances: Tile[] = [hand, [winningTile], ...melds.map((m) => m.tiles)].flat();
    for (const suit of ['m', 'p', 's'] as const) {
        const fives = allInstances.filter((t) => t.suit === suit && t.rank === 5);
        if (fives.length > 0 && rng() < 0.35) {
            fives[Math.floor(rng() * fives.length)].red = true;
        }
    }

    // 상황 부여
    const tsumo = rng() < 0.45;
    let riichi: 0 | 1 | 2 = 0;
    let ippatsu = false;
    if (opts.closed && rng() < opts.riichiP) {
        riichi = rng() < 0.06 ? 2 : 1;
        if (opts.kanCount === 0 && rng() < 0.25) ippatsu = true;
    }

    // 도라표시패 (1 + 깡 수, 적도라 아님)
    const doraIndicators: Tile[] = [];
    for (let i = 0; i < 1 + opts.kanCount; i++) {
        const candidates: number[] = [];
        for (let id = 0; id < 34; id++) if (used[id] < 4) candidates.push(id);
        const id = candidates[Math.floor(rng() * candidates.length)];
        used[id]++;
        doraIndicators.push(idToTile(id));
    }

    return {
        hand: sortTiles(hand),
        melds: melds.map((m) => ({ ...m, tiles: sortTiles(m.tiles) })),
        winningTile,
        winType: tsumo ? 'tsumo' : 'ron',
        roundWind: (1 + Math.floor(rng() * 2)) as 1 | 2,
        seatWind: (1 + Math.floor(rng() * 4)) as 1 | 2 | 3 | 4,
        riichi,
        ippatsu,
        doraIndicators,
    };
}

// ---------- 유틸 ----------

/** 자패 가중치를 적용한 패 종류 선택 */
function pickTileId(rng: Rng, honorP: number): number {
    if (rng() < honorP) return 27 + Math.floor(rng() * 7);
    return Math.floor(rng() * 3) * 9 + Math.floor(rng() * 9);
}

function weighted(rng: Rng, weights: number[]): number {
    let r = rng();
    for (let i = 0; i < weights.length; i++) {
        if (r < weights[i]) return i;
        r -= weights[i];
    }
    return weights.length - 1;
}

function shuffle<T>(rng: Rng, arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
