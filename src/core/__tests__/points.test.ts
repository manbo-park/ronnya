import { describe, expect, it } from 'vitest';
import { computePoints } from '../points';

describe('점수 테이블', () => {
    it('자 론 1판 30부 = 1000점', () => {
        const r = computePoints(1, 30, 0, false, false);
        expect(r.payment).toEqual({ kind: 'ron', total: 1000 });
    });

    it('자 론 2판 25부 (치또이) = 1600점', () => {
        const r = computePoints(2, 25, 0, false, false);
        expect(r.payment).toEqual({ kind: 'ron', total: 1600 });
    });

    it('친 론 3판 30부 = 5800점', () => {
        const r = computePoints(3, 30, 0, true, false);
        expect(r.payment).toEqual({ kind: 'ron', total: 5800 });
    });

    it('키리아게 미적용: 자 론 4판 30부 = 7700점', () => {
        const r = computePoints(4, 30, 0, false, false);
        expect(r.limitName).toBeUndefined();
        expect(r.payment).toEqual({ kind: 'ron', total: 7700 });
    });

    it('키리아게 미적용: 친 쯔모 3판 60부 = 3900올', () => {
        const r = computePoints(3, 60, 0, true, true);
        expect(r.limitName).toBeUndefined();
        expect(r.payment).toEqual({ kind: 'tsumoDealer', each: 3900 });
    });

    it('자 쯔모 3판 30부 = 1000/2000', () => {
        const r = computePoints(3, 30, 0, false, true);
        expect(r.payment).toEqual({ kind: 'tsumoNonDealer', dealer: 2000, others: 1000 });
    });

    it('친 쯔모 1판 30부 = 500올', () => {
        const r = computePoints(1, 30, 0, true, true);
        expect(r.payment).toEqual({ kind: 'tsumoDealer', each: 500 });
    });

    it('자연 만관: 4판 40부 자 론 = 8000점', () => {
        const r = computePoints(4, 40, 0, false, false);
        expect(r.limitName).toBe('만관');
        expect(r.payment).toEqual({ kind: 'ron', total: 8000 });
    });

    it('하네만/배만/삼배만/헤아림역만 경계', () => {
        expect(computePoints(6, 30, 0, false, false).payment).toEqual({
            kind: 'ron',
            total: 12000,
        });
        expect(computePoints(8, 30, 0, false, false).payment).toEqual({
            kind: 'ron',
            total: 16000,
        });
        expect(computePoints(11, 30, 0, false, false).payment).toEqual({
            kind: 'ron',
            total: 24000,
        });
        const kazoe = computePoints(13, 30, 0, false, false);
        expect(kazoe.limitName).toBe('헤아림역만');
        expect(kazoe.payment).toEqual({ kind: 'ron', total: 32000 });
    });

    it('역만/더블역만 지불', () => {
        expect(computePoints(0, 0, 1, false, false).payment).toEqual({ kind: 'ron', total: 32000 });
        expect(computePoints(0, 0, 1, true, false).payment).toEqual({ kind: 'ron', total: 48000 });
        expect(computePoints(0, 0, 2, false, true).payment).toEqual({
            kind: 'tsumoNonDealer',
            dealer: 32000,
            others: 16000,
        });
    });
});
