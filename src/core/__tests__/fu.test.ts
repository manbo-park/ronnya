import { describe, expect, it } from 'vitest';
import { calcFu, kotsuFu, roundUpFu, type FuInput } from '../fu';

const base: FuInput = {
    special: 'none',
    winForm: 'furoRon',
    wait: 'ryanmen',
    pair: 'normal',
    kotsu: [],
};

describe('kotsuFu', () => {
    it('밍커/안커/밍깡/안깡 × 중장/노두 부수표를 재현한다', () => {
        expect(kotsuFu({ concealed: false, quad: false, terminal: false })).toBe(2); // 밍커 중장
        expect(kotsuFu({ concealed: false, quad: false, terminal: true })).toBe(4); // 밍커 노두
        expect(kotsuFu({ concealed: true, quad: false, terminal: false })).toBe(4); // 안커 중장
        expect(kotsuFu({ concealed: true, quad: false, terminal: true })).toBe(8); // 안커 노두
        expect(kotsuFu({ concealed: false, quad: true, terminal: false })).toBe(8); // 밍깡 중장
        expect(kotsuFu({ concealed: false, quad: true, terminal: true })).toBe(16); // 밍깡 노두
        expect(kotsuFu({ concealed: true, quad: true, terminal: false })).toBe(16); // 안깡 중장
        expect(kotsuFu({ concealed: true, quad: true, terminal: true })).toBe(32); // 안깡 노두
    });
});

describe('roundUpFu', () => {
    it('10부 단위로 올린다', () => {
        expect(roundUpFu(20)).toBe(20);
        expect(roundUpFu(22)).toBe(30);
        expect(roundUpFu(32)).toBe(40);
    });
});

describe('calcFu', () => {
    it('핑후 쯔모는 20부', () => {
        const r = calcFu({ ...base, special: 'pinfu', winForm: 'tsumo' });
        expect(r).toMatchObject({ raw: 20, rounded: 20 });
    });

    it('핑후 멘젠 론은 30부 (멘젠 가산)', () => {
        const r = calcFu({ ...base, special: 'pinfu', winForm: 'menzenRon' });
        expect(r).toMatchObject({ raw: 30, rounded: 30 });
    });

    it('치또이는 25부 고정 (절상 없음)', () => {
        const r = calcFu({ ...base, special: 'chiitoi' });
        expect(r).toMatchObject({ raw: 25, rounded: 25 });
    });

    it('후로 론에 가산이 없으면 쿠이핑후형 보정으로 30부', () => {
        const r = calcFu(base);
        expect(r.raw).toBe(30);
        expect(r.rounded).toBe(30);
        expect(r.breakdown.some((b) => b.label.includes('쿠이핑후'))).toBe(true);
    });

    it('멘젠 론 + 간짱 + 노두 안커 = 40부', () => {
        const r = calcFu({
            ...base,
            winForm: 'menzenRon',
            wait: 'kanchan',
            kotsu: [{ kind: 'anko', terminal: true }],
        });
        // 부저20 + 멘젠론10 + 간짱2 + 노두안커8 = 40
        expect(r.raw).toBe(40);
        expect(r.rounded).toBe(40);
    });

    it('쯔모 + 중장 안커 = 26부 → 절상 30부', () => {
        const r = calcFu({ ...base, winForm: 'tsumo', kotsu: [{ kind: 'anko', terminal: false }] });
        // 부저20 + 쯔모2 + 중장안커4 = 26
        expect(r.raw).toBe(26);
        expect(r.rounded).toBe(30);
    });

    it('쯔모 + 노두 안깡 = 54부 → 절상 60부', () => {
        const r = calcFu({ ...base, winForm: 'tsumo', kotsu: [{ kind: 'ankan', terminal: true }] });
        // 부저20 + 쯔모2 + 노두안깡32 = 54
        expect(r.raw).toBe(54);
        expect(r.rounded).toBe(60);
    });

    it('연풍 또이쯔는 4부', () => {
        const r = calcFu({ ...base, winForm: 'menzenRon', pair: 'doubleWind' });
        // 부저20 + 멘젠론10 + 연풍4 = 34
        expect(r.raw).toBe(34);
        expect(r.rounded).toBe(40);
    });
});
