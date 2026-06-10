import { describe, expect, it } from 'vitest';
import { generateProblem } from '../generator';
import { tileId } from '../tiles';
import type { Tile } from '../types';

/** 결정적 시드 RNG (mulberry32) */
function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

describe('문제 생성기 합법성 (계획 5.2)', () => {
    const rng = mulberry32(20260610);
    const N = 500;

    it(`${N}건 생성: 모든 제약 충족`, () => {
        const limitCount: Record<string, number> = {};
        for (let i = 0; i < N; i++) {
            const { problem: p, result: r } = generateProblem(rng);

            // 패 매수 ≤ 4 (손패+후로+오름패+표시패), 적5는 수트당 ≤ 1
            const used = new Array<number>(34).fill(0);
            const red: Record<string, number> = { m: 0, p: 0, s: 0, z: 0 };
            const all: Tile[] = [
                ...p.hand,
                p.winningTile,
                ...p.melds.flatMap((m) => m.tiles),
                ...p.doraIndicators,
            ];
            for (const t of all) {
                used[tileId(t)]++;
                if (t.red) red[t.suit]++;
            }
            expect(Math.max(...used)).toBeLessThanOrEqual(4);
            expect(Math.max(red.m, red.p, red.s)).toBeLessThanOrEqual(1);
            expect(red.z).toBe(0);

            // 손패 매수 = 13 - 3×후로 수
            expect(p.hand.length).toBe(13 - 3 * p.melds.length);

            // 표시패 수 = 1 + 깡 수
            const kans = p.melds.filter(
                (m) => m.type === 'ankan' || m.type === 'minkan' || m.type === 'kakan',
            ).length;
            expect(p.doraIndicators.length).toBe(1 + kans);
            expect(p.doraIndicators.every((t) => !t.red)).toBe(true);

            // 리치 ⇒ 후로(치/퐁/밍깡) 없음, 일발 ⇒ 리치
            const hasOpen = p.melds.some((m) => m.type !== 'ankan');
            if (p.riichi > 0) expect(hasOpen).toBe(false);
            if (p.ippatsu) expect(p.riichi).toBeGreaterThan(0);

            // 역(도라 제외) 1개 이상
            const realYaku = r.yaku.filter((y) => !y.isDora);
            expect(realYaku.length).toBeGreaterThan(0);

            // 멘젠 한정 역이 후로 손에서 나오지 않음
            if (hasOpen) {
                const names = r.yaku.map((y) => y.name);
                for (const banned of [
                    '리치',
                    '더블리치',
                    '일발',
                    '멘젠쯔모',
                    '핑후',
                    '이페코',
                    '량페코',
                ]) {
                    expect(names).not.toContain(banned);
                }
            }

            // 정렬 검증
            for (let j = 1; j < p.hand.length; j++) {
                expect(tileId(p.hand[j - 1])).toBeLessThanOrEqual(tileId(p.hand[j]));
            }

            limitCount[r.limitName ?? '일반'] = (limitCount[r.limitName ?? '일반'] ?? 0) + 1;
        }
        // 분포 리포트 (실패 조건 아님)
        // eslint-disable-next-line no-console
        console.log('출제 분포:', limitCount);
    });
});
