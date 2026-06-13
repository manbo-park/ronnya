// 작혼 기준 부수 산식의 공통 원자. score.ts computeFu와 부수 계산기가 함께 쓴다.

export const FU = {
    base: 20,
    menzenRon: 10,
    tsumo: 2,
    wait: 2,
    yakuhaiPair: 2,
    doubleWindPair: 4,
} as const;

// 커쯔·깡 한 개의 부수. 닫힐수록(안커·안깡), 노두·자패일수록 2배씩 커진다.
// 밍커 2 / 안커 4 / 밍깡 8 / 안깡 16 (중장패), 노두·자패는 각 ×2.
export function kotsuFu(o: { concealed: boolean; quad: boolean; terminal: boolean }): number {
    let fu = 2;
    if (o.terminal) fu *= 2;
    if (o.concealed) fu *= 2;
    if (o.quad) fu *= 4;
    return fu;
}

// 10부 단위 절상.
export function roundUpFu(raw: number): number {
    return Math.ceil(raw / 10) * 10;
}
