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

// ---- 부수 계산기 ----
// 사용자가 화료/대기/또이쯔/커쯔를 직접 골라 부수를 조립하는 입력 모델.

export type Special = 'none' | 'pinfu' | 'chiitoi';
export type WinForm = 'menzenRon' | 'tsumo' | 'furoRon';
export type Wait = 'ryanmen' | 'shanpon' | 'kanchan' | 'penchan' | 'tanki';
export type PairType = 'normal' | 'yakuhai' | 'roundWind' | 'seatWind' | 'doubleWind';
export type KotsuKind = 'minko' | 'anko' | 'minkan' | 'ankan';

export interface Kotsu {
    kind: KotsuKind;
    terminal: boolean; // 노두·자패 여부
}

export interface FuInput {
    special: Special;
    winForm: WinForm;
    wait: Wait;
    pair: PairType;
    kotsu: Kotsu[];
}

export interface FuBreakdownRow {
    label: string;
    fu: number;
    dim?: boolean; // 절상 등 보조 표기 행
}

export interface FuResult {
    raw: number; // 절상 전 합계 (고정값은 그대로)
    rounded: number; // 10부 절상 또는 고정값
    breakdown: FuBreakdownRow[];
}

export const KOTSU_KINDS: { kind: KotsuKind; label: string; concealed: boolean; quad: boolean }[] =
    [
        { kind: 'minko', label: '밍커', concealed: false, quad: false },
        { kind: 'anko', label: '안커', concealed: true, quad: false },
        { kind: 'minkan', label: '밍깡', concealed: false, quad: true },
        { kind: 'ankan', label: '안깡', concealed: true, quad: true },
    ];

const WIN_FORM: Record<WinForm, { label: string; fu: number }> = {
    menzenRon: { label: '멘젠 론', fu: FU.menzenRon },
    tsumo: { label: '쯔모', fu: FU.tsumo },
    furoRon: { label: '후로 론', fu: 0 },
};

const WAIT: Record<Wait, { label: string; fu: number }> = {
    ryanmen: { label: '양면 대기', fu: 0 },
    shanpon: { label: '샤보 대기', fu: 0 },
    kanchan: { label: '간짱 대기', fu: FU.wait },
    penchan: { label: '변짱 대기', fu: FU.wait },
    tanki: { label: '단기 대기', fu: FU.wait },
};

const PAIR: Record<PairType, { label: string; fu: number }> = {
    normal: { label: '수패 · 객풍 또이쯔', fu: 0 },
    yakuhai: { label: '역패 또이쯔', fu: FU.yakuhaiPair },
    roundWind: { label: '장풍 또이쯔', fu: FU.yakuhaiPair },
    seatWind: { label: '자풍 또이쯔', fu: FU.yakuhaiPair },
    doubleWind: { label: '연풍 또이쯔', fu: FU.doubleWindPair },
};

export function calcFu(input: FuInput): FuResult {
    if (input.special === 'pinfu') {
        // 핑후 쯔모는 20부, 핑후 (멘젠) 론은 멘젠 가산으로 30부 (핑후는 멘젠 한정)
        const isTsumo = input.winForm === 'tsumo';
        const fu = isTsumo ? 20 : 30;
        const label = isTsumo ? '핑후 쯔모' : '핑후 론';
        return { raw: fu, rounded: fu, breakdown: [{ label, fu }] };
    }
    if (input.special === 'chiitoi') {
        return { raw: 25, rounded: 25, breakdown: [{ label: '치또이', fu: 25 }] };
    }

    const breakdown: FuBreakdownRow[] = [{ label: '부저', fu: FU.base }];

    const win = WIN_FORM[input.winForm];
    if (win.fu > 0) breakdown.push({ label: win.label, fu: win.fu });

    const wait = WAIT[input.wait];
    if (wait.fu > 0) breakdown.push({ label: wait.label, fu: wait.fu });

    const pair = PAIR[input.pair];
    if (pair.fu > 0) breakdown.push({ label: pair.label, fu: pair.fu });

    for (const k of input.kotsu) {
        const def = KOTSU_KINDS.find((d) => d.kind === k.kind)!;
        const fu = kotsuFu({ concealed: def.concealed, quad: def.quad, terminal: k.terminal });
        breakdown.push({ label: `${k.terminal ? '노두·자패' : '중장패'} ${def.label}`, fu });
    }

    let raw = breakdown.reduce((s, r) => s + r.fu, 0);

    // 쿠이핑후형: 후로 손에서 가산이 없어 20부면 30부로 처리
    if (input.winForm === 'furoRon' && raw === 20) {
        breakdown.push({ label: '쿠이핑후형 보정', fu: 10 });
        raw = 30;
    }

    const rounded = roundUpFu(raw);
    if (rounded !== raw) {
        breakdown.push({ label: '10부 단위 절상', fu: rounded - raw, dim: true });
    }

    return { raw, rounded, breakdown };
}
