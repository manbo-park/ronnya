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
import { computePoints, paymentText } from '../core/points';

type Mode = 'score' | 'fuOnly';

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

// 1~12판 + 13판 이상(헤아림역만)
const HAN_OPTS = Array.from({ length: 13 }, (_, i) => i + 1);

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
    const [mode, setMode] = useState<Mode>('score');
    const [input, setInput] = useState<FuInput>(DEFAULT);
    const [isDealer, setIsDealer] = useState(false);
    const [han, setHan] = useState(1);
    const [pendingTerminal, setPendingTerminal] = useState(false);
    const [pendingKind, setPendingKind] = useState<KotsuKind>('minko');

    const result = calcFu(input);
    const fuLocked = input.special !== 'none';
    // 점수 모드에서 만관 이상(5판+)은 부수가 점수에 무의미하므로 부수 입력을 비활성
    const fuIrrelevant = mode === 'score' && han >= 5;
    // 점수 모드에선 쯔모/론을 점수에 써야 하므로 화료 형태는 핑후/치또이여도 활성
    const winFormLocked = fuLocked && mode === 'fuOnly';

    const score =
        mode === 'score'
            ? computePoints(han, result.rounded, 0, isDealer, input.winForm === 'tsumo')
            : null;

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
        setIsDealer(false);
        setHan(1);
        setPendingTerminal(false);
        setPendingKind('minko');
    };

    return (
        <div className="fu-calc">
            <div className="tab-bar" role="group" aria-label="계산 모드">
                <button
                    type="button"
                    className={`tab-btn ${mode === 'score' ? 'on' : ''}`}
                    aria-pressed={mode === 'score'}
                    onClick={() => setMode('score')}
                >
                    점수 계산하기
                </button>
                <button
                    type="button"
                    className={`tab-btn ${mode === 'fuOnly' ? 'on' : ''}`}
                    aria-pressed={mode === 'fuOnly'}
                    onClick={() => setMode('fuOnly')}
                >
                    부수만 계산하기
                </button>
            </div>

            {mode === 'score' && (
                <>
                    <Segmented
                        label="자 / 친"
                        value={isDealer ? 'dealer' : 'nonDealer'}
                        options={[
                            { value: 'nonDealer', label: '자 (비장가)' },
                            { value: 'dealer', label: '친 (장가)' },
                        ]}
                        onChange={(v) => setIsDealer(v === 'dealer')}
                    />
                    <div className="fc-field">
                        <span className="fc-field-label">판수</span>
                        <div className="seg-group" role="group" aria-label="판수">
                            {HAN_OPTS.map((h) => (
                                <button
                                    key={h}
                                    type="button"
                                    className={`seg-btn ${han === h ? 'on' : ''}`}
                                    aria-pressed={han === h}
                                    onClick={() => setHan(h)}
                                >
                                    {h >= 13 ? '13판↑ · 역만' : `${h}판`}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <div className="fc-special">
                <button
                    type="button"
                    className={`fc-special-btn ${input.special === 'pinfu' ? 'on' : ''}`}
                    aria-pressed={input.special === 'pinfu'}
                    disabled={fuIrrelevant}
                    onClick={() => toggleSpecial('pinfu')}
                >
                    핑후 (20부)
                </button>
                <button
                    type="button"
                    className={`fc-special-btn ${input.special === 'chiitoi' ? 'on' : ''}`}
                    aria-pressed={input.special === 'chiitoi'}
                    disabled={fuIrrelevant}
                    onClick={() => toggleSpecial('chiitoi')}
                >
                    치또이 (25부)
                </button>
            </div>

            <div className="fc-body">
                <Segmented
                    label="화료 형태"
                    value={input.winForm}
                    options={WIN_FORM_OPTS}
                    onChange={(v) => setInput((p) => ({ ...p, winForm: v }))}
                    disabled={winFormLocked}
                />
                <Segmented
                    label="대기 형태"
                    value={input.wait}
                    options={WAIT_OPTS}
                    onChange={(v) => setInput((p) => ({ ...p, wait: v }))}
                    disabled={fuLocked || fuIrrelevant}
                />
                <Segmented
                    label="또이쯔 (머리)"
                    value={input.pair}
                    options={PAIR_OPTS}
                    onChange={(v) => setInput((p) => ({ ...p, pair: v }))}
                    disabled={fuLocked || fuIrrelevant}
                />

                <div className="fc-field">
                    <span className="fc-field-label">커쯔 · 깡</span>
                    <div className="seg-group" role="group" aria-label="패 종류">
                        <button
                            type="button"
                            className={`seg-btn ${!pendingTerminal ? 'on' : ''}`}
                            aria-pressed={!pendingTerminal}
                            disabled={fuLocked || fuIrrelevant}
                            onClick={() => setPendingTerminal(false)}
                        >
                            중장패
                        </button>
                        <button
                            type="button"
                            className={`seg-btn ${pendingTerminal ? 'on' : ''}`}
                            aria-pressed={pendingTerminal}
                            disabled={fuLocked || fuIrrelevant}
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
                                disabled={fuLocked || fuIrrelevant}
                                onClick={() => setPendingKind(k.kind)}
                            >
                                {k.label}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        className="btn ghost fc-add"
                        disabled={fuLocked || fuIrrelevant}
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
                                            disabled={fuLocked || fuIrrelevant}
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

            {!fuIrrelevant && (
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
            )}

            {score && (
                <div className="fc-score">
                    <div className="fc-score-head">
                        <span>
                            {isDealer ? '친' : '자'} {input.winForm === 'tsumo' ? '쯔모' : '론'} ·{' '}
                            {han >= 13 ? '13판↑' : `${han}판`}
                            {!fuIrrelevant && ` ${result.rounded}부`}
                        </span>
                        {score.limitName && (
                            <span className="fc-score-limit">
                                {score.limitName === '헤아림역만'
                                    ? '(헤아림) 역만'
                                    : score.limitName}
                            </span>
                        )}
                    </div>
                    <div className="fc-score-value">
                        <b>{paymentText(score.payment)}</b> 점
                    </div>
                </div>
            )}
        </div>
    );
}
