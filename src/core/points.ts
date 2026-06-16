import type { Payment } from './types';

export interface PointsResult {
    basePoints: number;
    limitName?: string;
    payment: Payment;
    totalReceived: number;
}

const YAKUMAN_NAMES = ['역만', '2배역만', '3배역만', '4배역만', '5배역만', '6배역만'];

function roundUp100(n: number): number {
    return Math.ceil(n / 100) * 100;
}

/**
 * 기본점과 지불 분배 계산.
 * 키리아게 만관 미적용, 역만 복합 합산.
 */
export function computePoints(
    han: number,
    fu: number,
    yakumanUnits: number,
    isDealer: boolean,
    tsumo: boolean,
    honba = 0,
): PointsResult {
    let base: number;
    let limitName: string | undefined;

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
        if (base >= 2000) {
            base = 2000;
            limitName = '만관';
        }
    }

    // 본장: 1본장당 총 300점. 쯔모는 지불자별 +100, 론은 방총자가 +300 부담
    let payment: Payment;
    let totalReceived: number;
    if (tsumo) {
        if (isDealer) {
            const each = roundUp100(base * 2) + honba * 100;
            payment = { kind: 'tsumoDealer', each };
            totalReceived = each * 3;
        } else {
            const dealer = roundUp100(base * 2) + honba * 100;
            const others = roundUp100(base) + honba * 100;
            payment = { kind: 'tsumoNonDealer', dealer, others };
            totalReceived = dealer + others * 2;
        }
    } else {
        const total = roundUp100(base * (isDealer ? 6 : 4)) + honba * 300;
        payment = { kind: 'ron', total };
        totalReceived = total;
    }

    return { basePoints: base, limitName, payment, totalReceived };
}

// 지불 분배를 화면 표기 문자열로. 론은 총액, 친 쯔모는 "x 올", 자 쯔모는 "자 / 친".
export function paymentText(pm: Payment): string {
    const f = (n: number) => n.toLocaleString('ko-KR');
    if (pm.kind === 'ron') return `${f(pm.total)}`;
    if (pm.kind === 'tsumoDealer') return `${f(pm.each)} 올`;
    return `${f(pm.others)} / ${f(pm.dealer)}`;
}
