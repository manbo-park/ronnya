import type { FuItem, Problem, ScoringResult, Tile, YakuItem } from './types';
import {
    idToTile,
    isHonorId,
    isSimpleId,
    isTerminalId,
    isTerminalOrHonorId,
    nextDoraId,
    tileId,
    tileLabel,
    WIND_NAMES,
} from './tiles';
import { decomposeStandard, isChiitoi, kokushiPair } from './decompose';
import { computePoints } from './points';
import { FU, kotsuFu, roundUpFu } from './fu';

type WaitType = 'ryanmen' | 'kanchan' | 'penchan' | 'shanpon' | 'tanki';

const WAIT_NAMES: Record<WaitType, string> = {
    ryanmen: '양면 대기',
    kanchan: '간짱 대기',
    penchan: '변짱 대기',
    shanpon: '샤보 대기',
    tanki: '단기 대기',
};

/** 분해·후로를 통합한 멘쯔 표현 */
interface SetInfo {
    kind: 'run' | 'set';
    tile: number; // run: 시작 id, set: 패 id
    open: boolean;
    quad: boolean;
    /** 안커/안깡/쯔모 완성 커쯔 (산안커·스안커·부수 판정용) */
    concealed: boolean;
}

interface Interp {
    pattern: 'standard' | 'chiitoi' | 'kokushi';
    sets: SetInfo[]; // standard에서만 사용
    pairId: number; // chiitoi/kokushi에선 -1 또는 또이쯔 id
    wait: WaitType;
}

interface Evaluated {
    yaku: YakuItem[];
    han: number;
    yakumanUnits: number;
    fu: number;
    fuDetails: FuItem[];
}

/** 화료 문제 채점 진입점. 화료형이 아니면 예외 발생. */
export function scoreHand(p: Problem): ScoringResult {
    assertTileCounts(p);

    const concealedTiles = [...p.hand, p.winningTile];
    const counts = new Array<number>(34).fill(0);
    for (const t of concealedTiles) counts[tileId(t)]++;

    const allTiles: Tile[] = [...concealedTiles];
    for (const m of p.melds) allTiles.push(...m.tiles);

    const menzen = p.melds.every((m) => m.type === 'ankan');
    const w = tileId(p.winningTile);
    const interps: Interp[] = [];

    // 국사무쌍
    if (p.melds.length === 0) {
        const pair = kokushiPair(counts);
        if (pair !== null) {
            interps.push({ pattern: 'kokushi', sets: [], pairId: pair, wait: 'tanki' });
        }
        if (isChiitoi(counts)) {
            interps.push({ pattern: 'chiitoi', sets: [], pairId: -1, wait: 'tanki' });
        }
    }

    // 일반형: 모든 분해 × 오름패 위치 해석을 열거 (고점법)
    const meldSets: SetInfo[] = p.melds.map((m) => {
        if (m.type === 'chi') {
            const ids = m.tiles.map(tileId).sort((a, b) => a - b);
            return { kind: 'run', tile: ids[0], open: true, quad: false, concealed: false };
        }
        const id = tileId(m.tiles[0]);
        if (m.type === 'pon')
            return { kind: 'set', tile: id, open: true, quad: false, concealed: false };
        if (m.type === 'minkan' || m.type === 'kakan')
            return { kind: 'set', tile: id, open: true, quad: true, concealed: false };
        return { kind: 'set', tile: id, open: false, quad: true, concealed: true }; // ankan
    });

    for (const d of decomposeStandard(counts)) {
        // 오름패가 들어갈 수 있는 모든 자리를 별개 해석으로
        if (d.pair === w) {
            interps.push(makeStandard(d, meldSets, -1, 'tanki', p));
        }
        d.groups.forEach((g, i) => {
            if (g.kind === 'set' && g.tile === w) {
                interps.push(makeStandard(d, meldSets, i, 'shanpon', p));
            }
            if (
                g.kind === 'run' &&
                w >= g.tile &&
                w <= g.tile + 2 &&
                Math.floor(w / 9) === Math.floor(g.tile / 9)
            ) {
                const pos = w - g.tile;
                let wait: WaitType = 'ryanmen';
                if (pos === 1) wait = 'kanchan';
                else if (pos === 2 && g.tile % 9 === 0)
                    wait = 'penchan'; // 12 대기 3
                else if (pos === 0 && g.tile % 9 === 6) wait = 'penchan'; // 89 대기 7
                interps.push(makeStandard(d, meldSets, i, wait, p));
            }
        });
    }

    if (interps.length === 0) {
        throw new Error('화료형이 아닙니다');
    }

    // 각 해석을 채점하고 최고점 채택
    let best: { ev: Evaluated; pts: ReturnType<typeof computePoints> } | null = null;
    const isDealer = p.seatWind === 1;
    const tsumo = p.winType === 'tsumo';

    for (const it of interps) {
        const ev = evaluate(it, p, counts, allTiles, menzen, w);
        if (ev.yakumanUnits === 0 && ev.yaku.filter((y) => !y.isDora).length === 0) continue; // 역 없음
        const pts = computePoints(ev.han, ev.fu, ev.yakumanUnits, isDealer, tsumo);
        if (
            best === null ||
            pts.totalReceived > best.pts.totalReceived ||
            (pts.totalReceived === best.pts.totalReceived && ev.han > best.ev.han) ||
            (pts.totalReceived === best.pts.totalReceived &&
                ev.han === best.ev.han &&
                ev.fu > best.ev.fu)
        ) {
            best = { ev, pts };
        }
    }

    if (best === null) {
        throw new Error('역이 없는 화료입니다');
    }

    return {
        yaku: best.ev.yaku,
        han: best.ev.yakumanUnits > 0 ? 0 : best.ev.han,
        fu: best.ev.yakumanUnits > 0 ? 0 : best.ev.fu,
        fuDetails: best.ev.yakumanUnits > 0 ? [] : best.ev.fuDetails,
        yakumanUnits: best.ev.yakumanUnits,
        limitName: best.pts.limitName,
        basePoints: best.pts.basePoints,
        payment: best.pts.payment,
        totalReceived: best.pts.totalReceived,
    };
}

function makeStandard(
    d: { pair: number; groups: { kind: 'run' | 'set'; tile: number }[] },
    meldSets: SetInfo[],
    ronGroupIndex: number,
    wait: WaitType,
    p: Problem,
): Interp {
    const ron = p.winType === 'ron';
    const sets: SetInfo[] = d.groups.map((g, i) => ({
        kind: g.kind,
        tile: g.tile,
        open: false,
        quad: false,
        // 론으로 완성된 커쯔는 밍커 취급
        concealed: g.kind === 'set' && !(ron && i === ronGroupIndex && wait === 'shanpon'),
    }));
    return { pattern: 'standard', sets: [...sets, ...meldSets], pairId: d.pair, wait };
}

function evaluate(
    it: Interp,
    p: Problem,
    counts: number[],
    allTiles: Tile[],
    menzen: boolean,
    w: number,
): Evaluated {
    const yaku: YakuItem[] = [];
    const tsumo = p.winType === 'tsumo';
    const roundWindId = 27 + (p.roundWind - 1);
    const seatWindId = 27 + (p.seatWind - 1);

    // ----- 역만 판정 -----
    if (it.pattern === 'kokushi') {
        const junsei = counts[w] === 2; // 오름패 제거 시 13종이 모두 1장 → 13면 대기
        yaku.push(
            junsei
                ? { name: '국사무쌍 13면 대기', han: 26, yakuman: 2 }
                : { name: '국사무쌍', han: 13, yakuman: 1 },
        );
        return finalizeYakuman(yaku);
    }

    const allIds = allTiles.map(tileId);
    const allHonor = allIds.every(isHonorId);
    const allTerminal = allIds.every(isTerminalId);

    if (it.pattern === 'chiitoi') {
        if (allHonor) {
            yaku.push({ name: '자일색', han: 13, yakuman: 1 });
            return finalizeYakuman(yaku);
        }
    } else {
        const sets = it.sets;
        const triplets = sets.filter((s) => s.kind === 'set');
        const runs = sets.filter((s) => s.kind === 'run');
        const concealedTriplets = triplets.filter((s) => s.concealed);
        const kans = sets.filter((s) => s.quad);

        if (concealedTriplets.length === 4) {
            yaku.push(
                it.wait === 'tanki'
                    ? { name: '스안커 단기', han: 26, yakuman: 2 }
                    : { name: '스안커', han: 13, yakuman: 1 },
            );
        }
        const dragonTriplets = triplets.filter((s) => s.tile >= 31).length;
        if (dragonTriplets === 3) yaku.push({ name: '대삼원', han: 13, yakuman: 1 });
        const windTriplets = triplets.filter((s) => s.tile >= 27 && s.tile <= 30).length;
        if (windTriplets === 4) yaku.push({ name: '대사희', han: 26, yakuman: 2 });
        else if (windTriplets === 3 && it.pairId >= 27 && it.pairId <= 30)
            yaku.push({ name: '소사희', han: 13, yakuman: 1 });
        if (allHonor) yaku.push({ name: '자일색', han: 13, yakuman: 1 });
        if (allTerminal) yaku.push({ name: '청노두', han: 13, yakuman: 1 });
        const GREEN = new Set([19, 20, 21, 23, 25, 32]); // 2,3,4,6,8삭 + 발
        if (allIds.every((id) => GREEN.has(id))) yaku.push({ name: '녹일색', han: 13, yakuman: 1 });
        if (kans.length === 4) yaku.push({ name: '스깡쯔', han: 13, yakuman: 1 });

        // 구련보등 (멘젠, 깡 없음 — counts가 14장일 때만 성립 가능)
        if (menzen && p.melds.length === 0) {
            const suit = Math.floor(allIds[0] / 9);
            if (suit < 3 && allIds.every((id) => Math.floor(id / 9) === suit)) {
                const pattern = [3, 1, 1, 1, 1, 1, 1, 1, 3];
                const base = suit * 9;
                const ok = pattern.every((n, i) => counts[base + i] >= n);
                if (ok) {
                    const junsei = counts[w] - 1 === pattern[w - base];
                    yaku.push(
                        junsei
                            ? { name: '순정구련보등', han: 26, yakuman: 2 }
                            : { name: '구련보등', han: 13, yakuman: 1 },
                    );
                }
            }
        }

        const yakumanOnly = yaku.filter((y) => y.yakuman);
        if (yakumanOnly.length > 0) return finalizeYakuman(yakumanOnly);

        // ----- 일반 역 -----
        if (p.riichi === 2) yaku.push({ name: '더블리치', han: 2 });
        else if (p.riichi === 1) yaku.push({ name: '리치', han: 1 });
        if (p.ippatsu) yaku.push({ name: '일발', han: 1 });
        if (menzen && tsumo) yaku.push({ name: '멘젠쯔모', han: 1 });

        const pairIsYakuhai =
            it.pairId >= 31 || it.pairId === roundWindId || it.pairId === seatWindId;
        const pinfu =
            p.melds.length === 0 && runs.length === 4 && !pairIsYakuhai && it.wait === 'ryanmen';
        if (pinfu) yaku.push({ name: '핑후', han: 1 });

        if (allIds.every(isSimpleId)) yaku.push({ name: '탕야오', han: 1 });

        // 이페코/량페코 (멘젠 한정)
        if (menzen) {
            const runCount = new Map<number, number>();
            for (const r of runs.filter((s) => !s.open)) {
                runCount.set(r.tile, (runCount.get(r.tile) ?? 0) + 1);
            }
            let peikou = 0;
            for (const c of runCount.values()) peikou += Math.floor(c / 2);
            if (peikou === 2) yaku.push({ name: '량페코', han: 3 });
            else if (peikou === 1) yaku.push({ name: '이페코', han: 1 });
        }

        // 역패
        for (const s of triplets) {
            if (s.tile === 31) yaku.push({ name: '역패: 백', han: 1 });
            if (s.tile === 32) yaku.push({ name: '역패: 발', han: 1 });
            if (s.tile === 33) yaku.push({ name: '역패: 중', han: 1 });
            if (s.tile === roundWindId)
                yaku.push({ name: `장풍: ${WIND_NAMES[p.roundWind - 1]}`, han: 1 });
            if (s.tile === seatWindId)
                yaku.push({ name: `자풍: ${WIND_NAMES[p.seatWind - 1]}`, han: 1 });
        }

        // 삼색동순 / 일기통관 / 삼색동각
        const runStarts = new Set(runs.map((r) => r.tile));
        for (let b = 0; b <= 6; b++) {
            if (runStarts.has(b) && runStarts.has(9 + b) && runStarts.has(18 + b)) {
                yaku.push({ name: '삼색동순', han: menzen ? 2 : 1 });
                break;
            }
        }
        for (let suit = 0; suit < 3; suit++) {
            const base = suit * 9;
            if (runStarts.has(base) && runStarts.has(base + 3) && runStarts.has(base + 6)) {
                yaku.push({ name: '일기통관', han: menzen ? 2 : 1 });
                break;
            }
        }
        const tripIds = new Set(triplets.map((s) => s.tile));
        for (let r = 0; r < 9; r++) {
            if (tripIds.has(r) && tripIds.has(9 + r) && tripIds.has(18 + r)) {
                yaku.push({ name: '삼색동각', han: 2 });
                break;
            }
        }

        // 찬타/준찬타/혼노두
        const allTerminalOrHonor = allIds.every(isTerminalOrHonorId);
        if (allTerminalOrHonor) {
            yaku.push({ name: '혼노두', han: 2 });
        } else if (runs.length >= 1) {
            const groupsOk =
                sets.every((s) =>
                    s.kind === 'run'
                        ? s.tile % 9 === 0 || s.tile % 9 === 6
                        : isTerminalOrHonorId(s.tile),
                ) && isTerminalOrHonorId(it.pairId);
            if (groupsOk) {
                const hasHonor = allIds.some(isHonorId);
                if (hasHonor) yaku.push({ name: '찬타', han: menzen ? 2 : 1 });
                else yaku.push({ name: '준찬타', han: menzen ? 3 : 2 });
            }
        }

        if (runs.length === 0) yaku.push({ name: '또이또이', han: 2 });
        if (concealedTriplets.length === 3) yaku.push({ name: '산안커', han: 2 });
        if (kans.length === 3) yaku.push({ name: '산깡쯔', han: 2 });
        if (dragonTriplets === 2 && it.pairId >= 31) yaku.push({ name: '소삼원', han: 2 });
    }

    // 치또이/일반 공통 역
    if (it.pattern === 'chiitoi') {
        if (p.riichi === 2) yaku.push({ name: '더블리치', han: 2 });
        else if (p.riichi === 1) yaku.push({ name: '리치', han: 1 });
        if (p.ippatsu) yaku.push({ name: '일발', han: 1 });
        if (tsumo) yaku.push({ name: '멘젠쯔모', han: 1 });
        yaku.push({ name: '치또이', han: 2 });
        if (allIds_(allTiles).every(isSimpleId)) yaku.push({ name: '탕야오', han: 1 });
        if (allIds_(allTiles).every(isTerminalOrHonorId)) yaku.push({ name: '혼노두', han: 2 });
    }

    // 혼일색/청일색
    {
        const suitsUsed = new Set(
            allTiles
                .map(tileId)
                .filter((id) => id < 27)
                .map((id) => Math.floor(id / 9)),
        );
        const hasHonor = allTiles.some((t) => t.suit === 'z');
        if (suitsUsed.size === 1) {
            if (hasHonor) yaku.push({ name: '혼일색', han: menzen ? 3 : 2 });
            else yaku.push({ name: '청일색', han: menzen ? 6 : 5 });
        }
    }

    // 도라/적도라
    let dora = 0;
    for (const ind of p.doraIndicators) {
        const d = nextDoraId(tileId(ind));
        dora += allTiles.filter((t) => tileId(t) === d).length;
    }
    if (dora > 0) yaku.push({ name: '도라', han: dora, isDora: true });
    const aka = allTiles.filter((t) => t.red).length;
    if (aka > 0) yaku.push({ name: '적도라', han: aka, isDora: true });

    const han = yaku.reduce((s, y) => s + y.han, 0);
    const { fu, fuDetails } = computeFu(it, p, menzen);
    return { yaku, han, yakumanUnits: 0, fu, fuDetails };
}

function allIds_(tiles: Tile[]): number[] {
    return tiles.map(tileId);
}

function finalizeYakuman(yaku: YakuItem[]): Evaluated {
    const units = yaku.reduce((s, y) => s + (y.yakuman ?? 0), 0);
    return { yaku, han: 0, yakumanUnits: units, fu: 0, fuDetails: [] };
}

function computeFu(it: Interp, p: Problem, menzen: boolean): { fu: number; fuDetails: FuItem[] } {
    const tsumo = p.winType === 'tsumo';

    if (it.pattern === 'chiitoi') {
        return { fu: 25, fuDetails: [{ reason: '치또이', fu: 25 }] };
    }

    const details: FuItem[] = [{ reason: '부저', fu: FU.base }];
    const pinfu =
        p.melds.length === 0 &&
        it.sets.every((s) => s.kind === 'run') &&
        !(
            it.pairId >= 31 ||
            it.pairId === 27 + (p.roundWind - 1) ||
            it.pairId === 27 + (p.seatWind - 1)
        ) &&
        it.wait === 'ryanmen';

    if (menzen && !tsumo) details.push({ reason: '멘젠 론', fu: FU.menzenRon });
    if (tsumo && !pinfu) details.push({ reason: '쯔모', fu: FU.tsumo });

    // 멘쯔 부수
    for (const s of it.sets) {
        if (s.kind === 'run') continue;
        const fu = kotsuFu({
            concealed: s.concealed,
            quad: s.quad,
            terminal: isTerminalOrHonorId(s.tile),
        });
        details.push({ reason: describeSet(s), fu });
    }

    // 또이쯔 부수 (작혼: 연풍 또이쯔 4부)
    let pairFu = 0;
    const reasons: string[] = [];
    if (it.pairId >= 31) {
        pairFu += FU.yakuhaiPair;
        reasons.push('역패');
    }
    if (it.pairId === 27 + (p.roundWind - 1)) {
        pairFu += FU.yakuhaiPair;
        reasons.push('장풍');
    }
    if (it.pairId === 27 + (p.seatWind - 1)) {
        pairFu += FU.yakuhaiPair;
        reasons.push('자풍');
    }
    if (pairFu > 0) {
        details.push({
            reason: `또이쯔: ${tileLabel(idToTile(it.pairId))} (${reasons.join('+')})`,
            fu: pairFu,
        });
    }

    // 대기 부수
    if (it.wait === 'kanchan' || it.wait === 'penchan' || it.wait === 'tanki') {
        details.push({ reason: WAIT_NAMES[it.wait], fu: FU.wait });
    }

    let raw = details.reduce((s, d) => s + d.fu, 0);

    // 쿠이핑후형: 후로 손에서 합계 20부 → 30부 처리
    if (!menzen && raw === 20) {
        details.push({ reason: '쿠이핑후형 보정', fu: 10 });
        raw = 30;
    }

    const fu = roundUpFu(raw);
    if (fu !== raw) details.push({ reason: '10부 단위 절상', fu: fu - raw, dim: true });
    return { fu, fuDetails: details };
}

function describeSet(s: SetInfo): string {
    const label = tileLabel(idToTile(s.tile));
    const kind = s.quad ? (s.concealed ? '안깡' : '밍깡') : s.concealed ? '안커' : '밍커';
    const cls = isTerminalOrHonorId(s.tile) ? '노두·자패' : '중장패';
    return `${label} ${kind} (${cls})`;
}

function assertTileCounts(p: Problem): void {
    const used = new Array<number>(34).fill(0);
    const redUsed: Record<string, number> = { m: 0, p: 0, s: 0 };
    const add = (t: Tile) => {
        used[tileId(t)]++;
        if (t.red) redUsed[t.suit]++;
    };
    for (const t of p.hand) add(t);
    add(p.winningTile);
    for (const m of p.melds) for (const t of m.tiles) add(t);
    for (const t of p.doraIndicators) add(t);
    for (let i = 0; i < 34; i++) {
        if (used[i] > 4) throw new Error(`패 매수 초과: id=${i}`);
    }
    for (const s of ['m', 'p', 's'] as const) {
        if (redUsed[s] > 1) throw new Error(`적도라 매수 초과: ${s}`);
    }
}
