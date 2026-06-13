import { useState } from 'react';
import {
    calcFu,
    kotsuFu,
    KOTSU_KINDS,
    type FuInput,
    type KotsuKind,
    type PairType,
    type Special,
    type Wait,
    type WinForm,
} from '../core/fu';

const DEFAULT: FuInput = {
    special: 'none',
    winForm: 'furoRon',
    wait: 'ryanmen',
    pair: 'normal',
    kotsu: [],
};

const WIN_FORM_OPTS: { value: WinForm; label: string }[] = [
    { value: 'menzenRon', label: '멘젠 론' },
    { value: 'tsumo', label: '쯔모' },
    { value: 'furoRon', label: '후로 론' },
];

const WAIT_OPTS: { value: Wait; label: string }[] = [
    { value: 'ryanmen', label: '양면' },
    { value: 'kanchan', label: '간짱' },
    { value: 'penchan', label: '변짱' },
    { value: 'tanki', label: '단기' },
    { value: 'shanpon', label: '샤보' },
];

const PAIR_OPTS: { value: PairType; label: string }[] = [
    { value: 'normal', label: '수패·객풍' },
    { value: 'yakuhai', label: '역패' },
    { value: 'roundWind', label: '장풍' },
    { value: 'seatWind', label: '자풍' },
    { value: 'doubleWind', label: '연풍' },
];

function Segmented<T extends string>({
    label,
    value,
    options,
    onChange,
    disabled,
}: {
    label: string;
    value: T;
    options: { value: T; label: string }[];
    onChange: (v: T) => void;
    disabled?: boolean;
}) {
    return (
        <div className="fc-field">
            <span className="fc-field-label">{label}</span>
            <div className="seg-group" role="group" aria-label={label}>
                {options.map((o) => (
                    <button
                        key={o.value}
                        type="button"
                        className={`seg-btn ${value === o.value ? 'on' : ''}`}
                        aria-pressed={value === o.value}
                        disabled={disabled}
                        onClick={() => onChange(o.value)}
                    >
                        {o.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

export function FuCalculator() {
    const [input, setInput] = useState<FuInput>(DEFAULT);
    const [pendingTerminal, setPendingTerminal] = useState(false);
    const [pendingKind, setPendingKind] = useState<KotsuKind>('minko');

    const result = calcFu(input);
    const locked = input.special !== 'none';

    const toggleSpecial = (s: Special) =>
        setInput((p) => ({ ...p, special: p.special === s ? 'none' : s }));

    const addKotsu = () =>
        setInput((p) => ({
            ...p,
            kotsu: [...p.kotsu, { kind: pendingKind, terminal: pendingTerminal }],
        }));

    const removeKotsu = (i: number) =>
        setInput((p) => ({ ...p, kotsu: p.kotsu.filter((_, idx) => idx !== i) }));

    const reset = () => {
        setInput(DEFAULT);
        setPendingTerminal(false);
        setPendingKind('minko');
    };

    return (
        <div className="fu-calc">
            <div className="fc-special">
                <button
                    type="button"
                    className={`fc-special-btn ${input.special === 'pinfu' ? 'on' : ''}`}
                    aria-pressed={input.special === 'pinfu'}
                    onClick={() => toggleSpecial('pinfu')}
                >
                    핑후 (20부)
                </button>
                <button
                    type="button"
                    className={`fc-special-btn ${input.special === 'chiitoi' ? 'on' : ''}`}
                    aria-pressed={input.special === 'chiitoi'}
                    onClick={() => toggleSpecial('chiitoi')}
                >
                    치또이 (25부)
                </button>
            </div>

            <div className={`fc-body ${locked ? 'locked' : ''}`}>
                <Segmented
                    label="화료 형태"
                    value={input.winForm}
                    options={WIN_FORM_OPTS}
                    onChange={(v) => setInput((p) => ({ ...p, winForm: v }))}
                    disabled={locked}
                />
                <Segmented
                    label="대기 형태"
                    value={input.wait}
                    options={WAIT_OPTS}
                    onChange={(v) => setInput((p) => ({ ...p, wait: v }))}
                    disabled={locked}
                />
                <Segmented
                    label="또이쯔 (머리)"
                    value={input.pair}
                    options={PAIR_OPTS}
                    onChange={(v) => setInput((p) => ({ ...p, pair: v }))}
                    disabled={locked}
                />

                <div className="fc-field">
                    <span className="fc-field-label">커쯔 · 깡</span>
                    <div className="seg-group" role="group" aria-label="패 종류">
                        <button
                            type="button"
                            className={`seg-btn ${!pendingTerminal ? 'on' : ''}`}
                            aria-pressed={!pendingTerminal}
                            disabled={locked}
                            onClick={() => setPendingTerminal(false)}
                        >
                            중장패
                        </button>
                        <button
                            type="button"
                            className={`seg-btn ${pendingTerminal ? 'on' : ''}`}
                            aria-pressed={pendingTerminal}
                            disabled={locked}
                            onClick={() => setPendingTerminal(true)}
                        >
                            노두·자패
                        </button>
                    </div>
                    <div className="seg-group" role="group" aria-label="커쯔 종류">
                        {KOTSU_KINDS.map((k) => (
                            <button
                                key={k.kind}
                                type="button"
                                className={`seg-btn ${pendingKind === k.kind ? 'on' : ''}`}
                                aria-pressed={pendingKind === k.kind}
                                disabled={locked}
                                onClick={() => setPendingKind(k.kind)}
                            >
                                {k.label}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        className="btn ghost fc-add"
                        disabled={locked}
                        onClick={addKotsu}
                    >
                        + 커쯔 추가 (
                        {kotsuFu({
                            concealed: KOTSU_KINDS.find((d) => d.kind === pendingKind)!.concealed,
                            quad: KOTSU_KINDS.find((d) => d.kind === pendingKind)!.quad,
                            terminal: pendingTerminal,
                        })}
                        부)
                    </button>

                    {input.kotsu.length > 0 && (
                        <ul className="fc-kotsu-list">
                            {input.kotsu.map((k, i) => {
                                const def = KOTSU_KINDS.find((d) => d.kind === k.kind)!;
                                const fu = kotsuFu({
                                    concealed: def.concealed,
                                    quad: def.quad,
                                    terminal: k.terminal,
                                });
                                return (
                                    <li key={i} className="fc-kotsu-item">
                                        <span>
                                            {k.terminal ? '노두·자패' : '중장패'} {def.label}
                                        </span>
                                        <span className="fc-kotsu-fu">{fu}부</span>
                                        <button
                                            type="button"
                                            className="fc-kotsu-del"
                                            aria-label="삭제"
                                            disabled={locked}
                                            onClick={() => removeKotsu(i)}
                                        >
                                            ×
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            <div className="fc-actions">
                <button type="button" className="btn ghost" onClick={reset}>
                    리셋
                </button>
            </div>

            <div className="fc-result">
                <table className="detail-table">
                    <caption>부수 계산</caption>
                    <tbody>
                        {result.breakdown.map((b, i) => (
                            <tr key={i}>
                                <td>{b.label}</td>
                                <td className="num-cell">{b.fu}부</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="fc-total">
                    <span className="fc-total-raw">합계 {result.raw}부</span>
                    <span className="fc-total-arrow">→</span>
                    <span className="fc-total-final">{result.rounded}부</span>
                </div>
            </div>
        </div>
    );
}
