import { describe, expect, it } from 'vitest';
import { scoreHand } from '../score';
import { parseTiles } from '../tiles';
import type { Problem } from '../types';

function base(over: Partial<Problem>): Problem {
    return {
        hand: [],
        melds: [],
        winningTile: parseTiles('1m')[0],
        winType: 'ron',
        roundWind: 1,
        seatWind: 2,
        riichi: 0,
        ippatsu: false,
        doraIndicators: parseTiles('1z'), // 도라 = 남 (대부분의 케이스에서 0개)
        ...over,
    };
}

describe('채점 엔진 골든 케이스', () => {
    it('핑후 쯔모 = 2판 20부, 400/700', () => {
        const p = base({
            hand: parseTiles('234m567m23p567s99p'),
            winningTile: parseTiles('4p')[0],
            winType: 'tsumo',
        });
        const r = scoreHand(p);
        expect(r.yaku.map((y) => y.name).sort()).toEqual(['멘젠쯔모', '핑후']);
        expect(r.han).toBe(2);
        expect(r.fu).toBe(20);
        expect(r.payment).toEqual({ kind: 'tsumoNonDealer', dealer: 700, others: 400 });
    });

    it('치또이 론 = 2판 25부, 1600', () => {
        const p = base({
            hand: parseTiles('1m1m3m3m5p5p7p7p9s9s1z1z4z'),
            winningTile: parseTiles('4z')[0],
        });
        const r = scoreHand(p);
        expect(r.yaku.map((y) => y.name)).toContain('치또이');
        expect(r.fu).toBe(25);
        expect(r.payment).toEqual({ kind: 'ron', total: 1600 });
    });

    it('연풍 또이쯔 4부 (작혼): 친 리치 론 간짱 = 1판 40부', () => {
        const p = base({
            hand: parseTiles('2m4m456p345s678s1z1z'),
            winningTile: parseTiles('3m')[0],
            seatWind: 1,
            riichi: 1,
            doraIndicators: parseTiles('9p'), // 도라 = 1통 (0개)
        });
        const r = scoreHand(p);
        expect(r.han).toBe(1);
        expect(r.fu).toBe(40); // 20 + 멘젠론10 + 연풍4 + 간짱2 = 36 → 40
        const pairFu = r.fuDetails.find((d) => d.reason.includes('또이쯔'));
        expect(pairFu?.fu).toBe(4);
        expect(r.payment).toEqual({ kind: 'ron', total: 2000 });
    });

    it('쿠이핑후형 = 30부 보정', () => {
        const p = base({
            hand: parseTiles('345p678s56m8s8s'),
            melds: [{ type: 'chi', tiles: parseTiles('234m') }],
            winningTile: parseTiles('7m')[0],
        });
        const r = scoreHand(p);
        expect(r.yaku.map((y) => y.name)).toContain('탕야오');
        expect(r.han).toBe(1);
        expect(r.fu).toBe(30);
        expect(r.payment).toEqual({ kind: 'ron', total: 1000 });
    });

    it('스안커 단기 = 더블역만, 자 쯔모 16000/32000', () => {
        const p = base({
            hand: parseTiles('1m1m1m9m9m9m3p3p3p7s7s7s4z'),
            winningTile: parseTiles('4z')[0],
            winType: 'tsumo',
            seatWind: 3,
        });
        const r = scoreHand(p);
        expect(r.yaku.map((y) => y.name)).toContain('스안커 단기');
        expect(r.yakumanUnits).toBe(2);
        expect(r.payment).toEqual({ kind: 'tsumoNonDealer', dealer: 32000, others: 16000 });
    });

    it('스안커 샤보 론은 산안커+또이또이로 강등', () => {
        const p = base({
            hand: parseTiles('1m1m1m9m9m9m3p3p3p7s7s4z4z'),
            winningTile: parseTiles('7s')[0],
            winType: 'ron',
        });
        const r = scoreHand(p);
        expect(r.yakumanUnits).toBe(0);
        const names = r.yaku.map((y) => y.name);
        expect(names).toContain('산안커');
        expect(names).toContain('또이또이');
    });

    it('국사무쌍 13면 대기 = 더블역만 64000 (자 론)', () => {
        const p = base({
            hand: parseTiles('1m9m1p9p1s9s1z2z3z4z5z6z7z'),
            winningTile: parseTiles('9s')[0],
        });
        const r = scoreHand(p);
        expect(r.yaku[0].name).toBe('국사무쌍 13면 대기');
        expect(r.payment).toEqual({ kind: 'ron', total: 64000 });
    });

    it('도라 + 적도라 합산', () => {
        const p = base({
            hand: parseTiles('34m0p67p567s88s2z2z2z'),
            winningTile: parseTiles('2m')[0],
            doraIndicators: parseTiles('4p'), // 도라 = 5통
            roundWind: 2,
            seatWind: 2, // 2z = 남 → 장풍+자풍 2판
        });
        const r = scoreHand(p);
        const names = r.yaku.map((y) => y.name);
        expect(names).toContain('장풍: 남');
        expect(names).toContain('자풍: 남');
        const dora = r.yaku.find((y) => y.name === '도라');
        const aka = r.yaku.find((y) => y.name === '적도라');
        expect(dora?.han).toBe(1);
        expect(aka?.han).toBe(1);
        expect(r.han).toBe(4);
    });

    it('역 없는 화료는 예외 발생', () => {
        const p = base({
            hand: parseTiles('234m567m24p567s1z1z'),
            winningTile: parseTiles('3p')[0],
            winType: 'ron',
            roundWind: 2,
            seatWind: 2, // 1z(동)는 역패 아님 → 역 없음
        });
        expect(() => scoreHand(p)).toThrow();
    });

    it('량페코 > 치또이 (고점법)', () => {
        const p = base({
            hand: parseTiles('22334m667788p5s5s'),
            winningTile: parseTiles('4m')[0],
            riichi: 1,
        });
        const r = scoreHand(p);
        expect(r.yaku.map((y) => y.name)).toContain('량페코');
        expect(r.yaku.map((y) => y.name)).toContain('핑후');
        // 리치1 + 핑후1 + 탕야오1 + 량페코3 = 6판 하네만
        expect(r.han).toBe(6);
        expect(r.payment).toEqual({ kind: 'ron', total: 12000 });
    });

    it('청일색 + 일기통관 (멘젠) = 8판 배만', () => {
        const p = base({
            hand: parseTiles('123456789m99m22m'),
            winningTile: parseTiles('2m')[0],
            winType: 'tsumo',
        });
        const r = scoreHand(p);
        const names = r.yaku.map((y) => y.name);
        expect(names).toContain('청일색');
        expect(names).toContain('일기통관');
        expect(names).toContain('멘젠쯔모');
        expect(r.han).toBe(9); // 청일6 + 일기2 + 쯔모1
    });

    it('안깡은 멘젠 유지: 리치 + 멘젠쯔모 인정, 산깡쯔 아님', () => {
        const p = base({
            hand: parseTiles('234m567p8s2z2z2z'),
            melds: [{ type: 'ankan', tiles: parseTiles('5z5z5z5z') }],
            winningTile: parseTiles('8s')[0],
            winType: 'tsumo',
            riichi: 1,
            roundWind: 1,
            seatWind: 2,
            doraIndicators: parseTiles('9p6z'), // 깡 1개 → 표시패 2장, 도라 0개
        });
        const r = scoreHand(p);
        const names = r.yaku.map((y) => y.name);
        expect(names).toContain('리치');
        expect(names).toContain('멘젠쯔모');
        expect(names).toContain('역패: 백');
        // 20 + 쯔모2 + 백 안깡32 + 남 안커8 + 단기2 = 64 → 70
        expect(r.fu).toBe(70);
    });
});
