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
    winForm: 'tsumo',
    wait: 'ryanmen',
    pair: 'normal',
    kotsu: [],
};

const WIN_FORM_OPTS: { value: WinForm; label: string }[] = [
    { value: 'tsumo', label: '쯔모' },
    { value: 'menzenRon', label: '멘젠 론' },
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
    options: { value: T; label: string; disabled?: boolean }[];
    onChange: (v: T) => void;
    disabled?: boolean;
}) {
    return (
        <div className="calc-field">
            <span className="calc-field-label">{label}</span>
            <div className="seg-group" role="group" aria-label={label}>
                {options.map((o) => (
                    <button
                        key={o.value}
                        type="button"
                        className={`seg-btn ${value === o.value ? 'on' : ''}`}
                        aria-pressed={value === o.value}
                        disabled={disabled || o.disabled}
                        onClick={() => onChange(o.value)}
                    >
                        {o.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

export function Calculator() {
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
    // 화료 형태(쯔모/론)는 점수의 쯔모·론과 핑후 부수(쯔모 20 / 론 30)를 가른다.
    // 부수가 화료 형태와 무관한 치또이(25 고정)만, 부수만 모드에서 잠근다.
    const winFormLocked = input.special === 'chiitoi' && mode === 'fuOnly';
    // 1판이 불가능한 형태: 치또이(2판 확정) / 핑후+쯔모(핑후1+멘젠쯔모1)
    const hanFloorTwo =
        input.special === 'chiitoi' || (input.special === 'pinfu' && input.winForm === 'tsumo');

    // 샤보 대기는 또이쯔 하나가 커쯔(밍커/안커)로 완성되는 형태다. 깡은 이미 4장으로
    // 완성돼 대기 멘쯔가 될 수 없으므로, 커쯔가 하나도 없으면 경고한다.
    const shanponNeedsKotsu =
        input.special === 'none' &&
        !fuIrrelevant &&
        input.wait === 'shanpon' &&
        !input.kotsu.some((k) => k.kind === 'minko' || k.kind === 'anko');

    const pendingDef = KOTSU_KINDS.find((d) => d.kind === pendingKind)!;
    const pendingFu = kotsuFu({
        concealed: pendingDef.concealed,
        quad: pendingDef.quad,
        terminal: pendingTerminal,
    });

    const score =
        mode === 'score'
            ? computePoints(han, result.rounded, 0, isDealer, input.winForm === 'tsumo')
            : null;

    const toggleSpecial = (s: Special) => {
        setInput((p) => {
            const special = p.special === s ? 'none' : s;
            // 핑후·치또이는 멘젠 한정이라 후로 론과 양립 불가 → 후로 론일 때만 멘젠 론으로 바꾼다
            const winForm = special !== 'none' && p.winForm === 'furoRon' ? 'menzenRon' : p.winForm;
            return { ...p, special, winForm };
        });
        // 1판이 불가능해지는 형태로 켜지면 선택을 2판으로 올린다
        if (han < 2) {
            if (s === 'chiitoi' && input.special !== 'chiitoi') setHan(2);
            else if (s === 'pinfu' && input.special !== 'pinfu' && input.winForm === 'tsumo')
                setHan(2);
        }
    };

    const setWinForm = (v: WinForm) => {
        setInput((p) => ({ ...p, winForm: v }));
        // 핑후+쯔모는 최소 2판이라 1판이 선택돼 있었다면 2판으로 올린다
        if (v === 'tsumo' && input.special === 'pinfu' && han < 2) setHan(2);
    };

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
        <div className="calc">
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

            {/* 탭 전환 시 key가 바뀌어 콘텐츠 전체가 다시 마운트되며 진입 애니메이션이 재생된다 */}
            <div className="calc-content" key={mode}>
                {mode === 'score' && (
                    <>
                        <Segmented
                            label="자 / 친"
                            value={isDealer ? 'dealer' : 'nonDealer'}
                            options={[
                                { value: 'nonDealer', label: '자' },
                                { value: 'dealer', label: '친' },
                            ]}
                            onChange={(v) => setIsDealer(v === 'dealer')}
                        />
                        <div className="calc-field">
                            <span className="calc-field-label">판수</span>
                            <div className="seg-group" role="group" aria-label="판수">
                                {HAN_OPTS.map((h) => (
                                    <button
                                        key={h}
                                        type="button"
                                        className={`seg-btn ${han === h ? 'on' : ''}`}
                                        aria-pressed={han === h}
                                        disabled={hanFloorTwo && h < 2}
                                        onClick={() => setHan(h)}
                                    >
                                        {h >= 13 ? '13판↑ · 역만' : `${h}판`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <div className="calc-field">
                    <span className="calc-field-label">특수 형태</span>
                    <div className="calc-special">
                        <button
                            type="button"
                            className={`calc-special-btn ${input.special === 'pinfu' ? 'on' : ''}`}
                            aria-pressed={input.special === 'pinfu'}
                            disabled={fuIrrelevant}
                            onClick={() => toggleSpecial('pinfu')}
                        >
                            핑후
                        </button>
                        <button
                            type="button"
                            className={`calc-special-btn ${input.special === 'chiitoi' ? 'on' : ''}`}
                            aria-pressed={input.special === 'chiitoi'}
                            disabled={fuIrrelevant}
                            onClick={() => toggleSpecial('chiitoi')}
                        >
                            치또이
                        </button>
                    </div>
                </div>

                <div className="calc-body">
                    <Segmented
                        label="화료 형태"
                        value={input.winForm}
                        options={WIN_FORM_OPTS.map((o) => ({
                            ...o,
                            // 핑후·치또이는 멘젠 한정이라 후로 론과 양립 불가
                            disabled: input.special !== 'none' && o.value === 'furoRon',
                        }))}
                        onChange={setWinForm}
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

                    <div className="calc-field">
                        <span className="calc-field-label">커쯔 · 깡쯔</span>
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
                            className="btn ghost calc-add"
                            disabled={fuLocked || fuIrrelevant || input.kotsu.length >= 4}
                            onClick={addKotsu}
                        >
                            + {pendingDef.quad ? '깡쯔' : '커쯔'} 추가 ({pendingFu}부)
                        </button>

                        {input.kotsu.length === 0 ? (
                            <p className="calc-kotsu-empty">추가된 커쯔·깡쯔가 없습니다.</p>
                        ) : (
                            <ul className="calc-kotsu-list">
                                {input.kotsu.map((k, i) => {
                                    const def = KOTSU_KINDS.find((d) => d.kind === k.kind)!;
                                    const fu = kotsuFu({
                                        concealed: def.concealed,
                                        quad: def.quad,
                                        terminal: k.terminal,
                                    });
                                    return (
                                        <li key={i} className="calc-kotsu-item">
                                            <span>
                                                {k.terminal ? '노두·자패' : '중장패'} {def.label}
                                            </span>
                                            <span className="calc-kotsu-fu">{fu}부</span>
                                            <button
                                                type="button"
                                                className="calc-kotsu-del"
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

                <div className="calc-actions">
                    <button type="button" className="calc-reset" onClick={reset}>
                        ↺ 리셋
                    </button>
                </div>

                {shanponNeedsKotsu && (
                    <p className="calc-warning">⚠ 샤보 대기는 커쯔가 1개 이상 필요합니다.</p>
                )}

                {!fuIrrelevant && !shanponNeedsKotsu && (
                    <div className="calc-result">
                        <table className="detail-table">
                            <caption>부수 계산 결과</caption>
                            <tbody>
                                {result.breakdown.map((b, i) => (
                                    <tr key={i} className={b.dim ? 'dim-row' : ''}>
                                        <td>{b.label}</td>
                                        <td className="num-cell">{b.fu}부</td>
                                    </tr>
                                ))}
                                <tr className="total-row">
                                    <td>합계</td>
                                    <td className="num-cell">{result.rounded}부</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {score && !shanponNeedsKotsu && (
                    <div className="plaque">
                        <div className="plaque-main">
                            {isDealer ? '친' : '자'} {input.winForm === 'tsumo' ? '쯔모' : '론'}
                            {han < 13 && ` · ${han}판`}
                            {han < 13 && !fuIrrelevant && ` ${result.rounded}부`}
                            {score.limitName &&
                                ` · ${score.limitName === '헤아림역만' ? '(헤아림) 역만' : score.limitName}`}
                        </div>
                        <div className="plaque-score">{paymentText(score.payment)}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
