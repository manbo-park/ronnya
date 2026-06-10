/** 14장(멘쯔 환산)의 은닉 부분을 4멘쯔+1또이쯔 등으로 분해 */

export interface DecompGroup {
    kind: 'run' | 'set';
    /** run이면 시작 패 id, set이면 해당 패 id */
    tile: number;
}

export interface Decomposition {
    pair: number;
    groups: DecompGroup[];
}

/** counts: 34칸 패 종류별 매수. 은닉 부분(손패+오름패)만 전달. */
export function decomposeStandard(counts: number[]): Decomposition[] {
    const out: Decomposition[] = [];
    const work = counts.slice();
    for (let pair = 0; pair < 34; pair++) {
        if (work[pair] < 2) continue;
        work[pair] -= 2;
        const groups: DecompGroup[] = [];
        extract(work, 0, groups, (gs) => out.push({ pair, groups: gs.slice() }));
        work[pair] += 2;
    }
    return out;
}

function extract(
    counts: number[],
    idx: number,
    acc: DecompGroup[],
    emit: (groups: DecompGroup[]) => void,
): void {
    while (idx < 34 && counts[idx] === 0) idx++;
    if (idx === 34) {
        emit(acc);
        return;
    }
    // 커쯔 추출
    if (counts[idx] >= 3) {
        counts[idx] -= 3;
        acc.push({ kind: 'set', tile: idx });
        extract(counts, idx, acc, emit);
        acc.pop();
        counts[idx] += 3;
    }
    // 슌쯔 추출 (수패, 7 이하 시작)
    if (idx < 27 && idx % 9 <= 6 && counts[idx + 1] > 0 && counts[idx + 2] > 0) {
        counts[idx]--;
        counts[idx + 1]--;
        counts[idx + 2]--;
        acc.push({ kind: 'run', tile: idx });
        extract(counts, idx, acc, emit);
        acc.pop();
        counts[idx]++;
        counts[idx + 1]++;
        counts[idx + 2]++;
    }
}

/** 치또이츠: 서로 다른 7종 또이쯔 (동일 패 4장을 2또이쯔로 인정하지 않음 — 작혼 기준) */
export function isChiitoi(counts: number[]): boolean {
    let pairs = 0;
    for (let i = 0; i < 34; i++) {
        if (counts[i] === 0) continue;
        if (counts[i] !== 2) return false;
        pairs++;
    }
    return pairs === 7;
}

export const KOKUSHI_IDS = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];

/** 국사무쌍 성립 여부. 성립 시 또이쯔가 된 패 id 반환, 아니면 null */
export function kokushiPair(counts: number[]): number | null {
    let pair: number | null = null;
    let total = 0;
    for (let i = 0; i < 34; i++) {
        if (counts[i] === 0) continue;
        if (!KOKUSHI_IDS.includes(i)) return null;
        if (counts[i] > 2) return null;
        if (counts[i] === 2) {
            if (pair !== null) return null;
            pair = i;
        }
        total += counts[i];
    }
    if (total !== 14 || pair === null) return null;
    for (const id of KOKUSHI_IDS) if (counts[id] === 0) return null;
    return pair;
}
