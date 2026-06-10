import type { Payment } from './types';

export interface PointsResult {
    basePoints: number;
    limitName?: string;
    kiriage: boolean;
    payment: Payment;
    totalReceived: number;
}

const YAKUMAN_NAMES = ['역만', '2배역만', '3배역만', '4배역만', '5배역만', '6배역만'];

function roundUp100(n: number): number {
    return Math.ceil(n / 100) * 100;
}

/**
 * 기본점과 지불 분배 계산.
 * 작혼 기준: 키리아게 만관(4판30부, 3판60부 → 만관) 적용, 역만 복합 합산.
 */
export function computePoints(
    han: number,
    fu: number,
    yakumanUnits: number,
    isDealer: boolean,
    tsumo: boolean,
): PointsResult {
    let base: number;
    let limitName: string | undefined;
    let kiriage = false;

    if (yakumanUnits > 0) {
        base = 8000 * yakumanUnits;
        limitName = YAKUMAN_NAMES[Math.min(yakumanUnits, YAKUMAN_NAMES.length) - 1];
    } else if (han >= 13) {
        base = 8000;
        limitName = '헤아림역만';
    } else if (han >= 11) {
        base = 6000;
        limitName = '삼배만';
    } else if (han >= 8) {
        base = 4000;
        limitName = '배만';
    } else if (han >= 6) {
        base = 3000;
        limitName = '하네만';
    } else if (han >= 5) {
        base = 2000;
        limitName = '만관';
    } else {
        base = fu * Math.pow(2, 2 + han);
        if ((han === 4 && fu === 30) || (han === 3 && fu === 60)) {
            base = 2000;
            limitName = '만관';
            kiriage = true;
        } else if (base >= 2000) {
            base = 2000;
            limitName = '만관';
        }
    }

    let payment: Payment;
    let totalReceived: number;
    if (tsumo) {
        if (isDealer) {
            const each = roundUp100(base * 2);
            payment = { kind: 'tsumoDealer', each };
            totalReceived = each * 3;
        } else {
            const dealer = roundUp100(base * 2);
            const others = roundUp100(base);
            payment = { kind: 'tsumoNonDealer', dealer, others };
            totalReceived = dealer + others * 2;
        }
    } else {
        const total = roundUp100(base * (isDealer ? 6 : 4));
        payment = { kind: 'ron', total };
        totalReceived = total;
    }

    return { basePoints: base, limitName, kiriage, payment, totalReceived };
}
