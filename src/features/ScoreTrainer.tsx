import { useCallback, useState } from 'react';
import { generateProblem, type GeneratedProblem } from '../core/generator';
import { nextDoraId, tileId } from '../core/tiles';
import type { Payment, ScoringResult, Tile } from '../core/types';
import { MeldView, TileView } from '../components/Tiles';

type Phase = 'challenge' | 'answer';

const DORA_INDICATOR_SLOTS = 5; // 왕패의 도라표시패 자리 수
const NON_DEALER_TSUMO_RE = /^\d+\s+\d+$/;

export function ScoreTrainer() {
    const [gp, setGp] = useState<GeneratedProblem>(() => generateProblem());
    const [phase, setPhase] = useState<Phase>('challenge');
    const [answer, setAnswer] = useState('');
    // 정답 보기로 넘어온 경우: 채점(정답/오답) 대신 중립 표시
    const [revealed, setRevealed] = useState(false);
    // 문제마다 손패 영역을 리마운트해 모든 도라패의 광택 애니메이션을 같은 프레임에 시작시킨다
    const [round, setRound] = useState(0);

    const next = useCallback(() => {
        setGp(generateProblem());
        setAnswer('');
        setRevealed(false);
        setPhase('challenge');
        setRound((n) => n + 1);
    }, []);

    const p = gp.problem;
    const r = gp.result;
    const tsumo = p.winType === 'tsumo';
    const dealer = p.seatWind === 1;

    const correct = gradeAnswer(r, answer);

    const doraIds = new Set(p.doraIndicators.map((t) => nextDoraId(tileId(t))));
    const isDora = (t: Tile) => doraIds.has(tileId(t));

    const submit = () => {
        setRevealed(false);
        setPhase('answer');
    };
    const reveal = () => {
        setRevealed(true);
        setPhase('answer');
    };

    return (
        <div className="trainer">
            <section className="card">
                <div className="badges">
                    <span className={`badge badge-seat ${dealer ? 'b-dealer' : 'b-nondealer'}`}>
                        {dealer ? '친' : '자'}
                    </span>
                    {p.riichi === 2 && <span className="badge b-riichi">더블리치</span>}
                    {p.riichi === 1 && <span className="badge b-riichi">리치</span>}
                    {p.ippatsu && <span className="badge b-riichi">일발</span>}
                    <span className={`badge badge-win ${tsumo ? 'b-tsumo' : 'b-ron'}`}>
                        {tsumo ? '쯔모' : '론'}
                    </span>
                </div>

                <div className="dora-row">
                    <span className="row-label">장풍패</span>
                    <TileView tile={{ suit: 'z', rank: p.roundWind }} />
                    <span className="row-label">자풍패</span>
                    <TileView tile={{ suit: 'z', rank: p.seatWind }} />
                </div>

                <div className="dora-row">
                    <span className="row-label">도라표시패</span>
                    <div className="tile-group">
                        {Array.from({ length: DORA_INDICATOR_SLOTS }, (_, i) =>
                            i < p.doraIndicators.length ? (
                                <TileView key={i} tile={p.doraIndicators[i]} />
                            ) : (
                                <TileView key={i} back />
                            ),
                        )}
                    </div>
                </div>

                <div
                    key={round}
                    className={`hand-area ${tsumo ? 'win-tsumo' : 'win-ron'} ${
                        p.melds.length === 0 ? 'hand-menzen' : ''
                    }`}
                >
                    <div className="hand-tiles">
                        {p.hand.map((t, i) => (
                            <TileView key={i} tile={t} dora={isDora(t)} />
                        ))}
                    </div>
                    {p.melds.map((m, i) => (
                        <MeldView key={i} meld={m} isDora={isDora} />
                    ))}
                    <TileView tile={p.winningTile} win dora={isDora(p.winningTile)} />
                </div>

                {phase === 'challenge' ? (
                    <ChallengeInputs
                        payment={r.payment}
                        answer={answer}
                        setAnswer={setAnswer}
                        onSubmit={submit}
                        onReveal={reveal}
                        onReset={next}
                    />
                ) : (
                    <AnswerView result={r} correct={correct} revealed={revealed} onNext={next} />
                )}
            </section>
        </div>
    );
}

function ChallengeInputs({
    payment,
    answer,
    setAnswer,
    onSubmit,
    onReveal,
    onReset,
}: {
    payment: Payment;
    answer: string;
    setAnswer: (v: string) => void;
    onSubmit: () => void;
    onReveal: () => void;
    onReset: () => void;
}) {
    const set = (e: React.ChangeEvent<HTMLInputElement>) => setAnswer(e.target.value);

    const filled =
        payment.kind === 'tsumoNonDealer' ? NON_DEALER_TSUMO_RE.test(answer.trim()) : answer !== '';

    return (
        <div className="inputs">
            <div className="field-row">
                {payment.kind === 'ron' && (
                    <label className="field grow">
                        <span>론 점수 (지불 총액)</span>
                        <input
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={answer}
                            onChange={set}
                            placeholder="예: 7700"
                        />
                    </label>
                )}
                {payment.kind === 'tsumoDealer' && (
                    <label className="field grow">
                        <span>친 쯔모 (1명당 지불)</span>
                        <input
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={answer}
                            onChange={set}
                            placeholder="예: 2600"
                        />
                    </label>
                )}
                {payment.kind === 'tsumoNonDealer' && (
                    <label className="field grow">
                        <span>자 쯔모 (자·친 지불, 띄어서 입력)</span>
                        <input
                            pattern="[0-9 ]*"
                            value={answer}
                            onChange={set}
                            placeholder="예: 1000 2000"
                        />
                    </label>
                )}
            </div>

            <div className="actions">
                <button className="btn ghost" onClick={onReset}>
                    리셋
                </button>
                <button className="btn ghost" onClick={onReveal}>
                    정답 보기
                </button>
                <button className="btn primary" onClick={onSubmit} disabled={!filled}>
                    확인
                </button>
            </div>
        </div>
    );
}

function gradeAnswer(r: ScoringResult, answer: string): boolean {
    if (r.payment.kind === 'ron') return Number(answer) === r.payment.total;
    if (r.payment.kind === 'tsumoDealer') return Number(answer) === r.payment.each;
    const [others, dealer] = answer.trim().split(/\s+/).map(Number);
    return others === r.payment.others && dealer === r.payment.dealer;
}

function paymentText(pm: Payment): string {
    const f = (n: number) => n.toLocaleString('ko-KR');
    if (pm.kind === 'ron') return `${f(pm.total)}점`;
    if (pm.kind === 'tsumoDealer') return `${f(pm.each)} 올`;
    return `${f(pm.others)} / ${f(pm.dealer)}`;
}

function AnswerView({
    result: r,
    correct,
    revealed,
    onNext,
}: {
    result: ScoringResult;
    correct: boolean;
    revealed: boolean;
    onNext: () => void;
}) {
    // 5판 이상(만관 이상)은 부수가 점수에 무의미하므로 부수 표기를 숨긴다
    const showFu = r.yakumanUnits === 0 && r.han < 5;
    const headline =
        r.yakumanUnits > 0
            ? r.limitName
            : `${r.han}판` +
              (showFu ? ` ${r.fu}부` : '') +
              (r.limitName ? ` · ${r.limitName}` : '');

    return (
        <div className="answer">
            {revealed ? (
                <div className="verdict reveal">정답 보기</div>
            ) : (
                <div className={`verdict ${correct ? 'ok' : 'no'}`}>
                    {correct ? '정답!' : '오답'}
                </div>
            )}

            <div className="plaque">
                <div className="plaque-main">{headline}</div>
                <div className="plaque-score">{paymentText(r.payment)}</div>
            </div>

            <table className="detail-table">
                <caption>판</caption>
                <tbody>
                    {r.yaku.map((y, i) => (
                        <tr key={i} className={y.isDora ? 'dora-row-y' : ''}>
                            <td>{y.name}</td>
                            <td className="num-cell">
                                {y.yakuman ? (y.yakuman === 2 ? '더블역만' : '역만') : `${y.han}판`}
                            </td>
                        </tr>
                    ))}
                    {r.yakumanUnits === 0 && (
                        <tr className="total-row">
                            <td>합계</td>
                            <td className="num-cell">{r.han}판</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {showFu && (
                <table className="detail-table">
                    <caption>부수</caption>
                    <tbody>
                        {r.fuDetails.map((d, i) => (
                            <tr key={i} className={d.dim ? 'dim-row' : ''}>
                                <td>{d.reason}</td>
                                <td className="num-cell">{d.fu > 0 ? `${d.fu}부` : '—'}</td>
                            </tr>
                        ))}
                        <tr className="total-row">
                            <td>합계</td>
                            <td className="num-cell">{r.fu}부</td>
                        </tr>
                    </tbody>
                </table>
            )}

            <div className="actions">
                <button className="btn primary grow" onClick={onNext}>
                    다음 문제
                </button>
            </div>
        </div>
    );
}
