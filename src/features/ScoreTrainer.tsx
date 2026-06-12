import { useCallback, useEffect, useRef, useState } from 'react';
import { generateProblem, type GeneratedProblem } from '../core/generator';
import { nextDoraId, tileId } from '../core/tiles';
import type { Payment, Problem, ScoringResult, Tile } from '../core/types';
import { MeldView, TileView } from '../components/Tiles';
import { preloadTileImages } from '../components/tileAssets';

type Phase = 'challenge' | 'answer' | 'loading';

const DORA_INDICATOR_SLOTS = 5; // 왕패의 도라표시패 자리 수
const NON_DEALER_TSUMO_RE = /^\d+\s+\d+$/;
// 문제를 공개하기 전 로딩 UI를 보여주는 최소 시간
const LOADING_MS = 480;
// 패 이미지 프리로드가 늦어져도 이 시간이 지나면 문제를 공개한다
const LOADING_MAX_MS = 3000;

/** 문제 화면에 표시되는 모든 패 (이미지 프리로드용) */
function problemTiles(p: Problem): Tile[] {
    return [
        { suit: 'z', rank: p.roundWind },
        { suit: 'z', rank: p.seatWind },
        ...p.doraIndicators,
        ...p.hand,
        ...p.melds.flatMap((m) => m.tiles),
        p.winningTile,
    ];
}

export function ScoreTrainer() {
    const [gp, setGp] = useState<GeneratedProblem>(() => generateProblem());
    // 최초 진입 시에도 패 이미지가 준비되기 전에 문제가 노출되지 않도록 로딩으로 시작한다 (#32)
    const [phase, setPhase] = useState<Phase>('loading');
    const [answer, setAnswer] = useState('');
    // 정답 보기로 넘어온 경우: 채점(정답/오답) 대신 중립 표시
    const [revealed, setRevealed] = useState(false);
    // 문제마다 손패 영역을 리마운트해 모든 도라패의 광택 애니메이션을 같은 프레임에 시작시킨다
    const [round, setRound] = useState(0);
    // 진행 중인 로딩 식별자 — 새 로딩이 시작되거나 언마운트되면 이전 로딩의 공개를 무효화한다
    const loadSeq = useRef(0);

    useEffect(
        () => () => {
            loadSeq.current++;
        },
        [],
    );

    // 로딩 UI를 최소 LOADING_MS 동안 보여주면서 패 이미지를 미리 받은 뒤 문제를 공개한다
    const revealAfterLoading = useCallback((nextGp: GeneratedProblem) => {
        setPhase('loading');
        const seq = ++loadSeq.current;
        const delay = (ms: number) => new Promise((res) => window.setTimeout(res, ms));
        Promise.all([
            Promise.race([preloadTileImages(problemTiles(nextGp.problem)), delay(LOADING_MAX_MS)]),
            delay(LOADING_MS),
        ]).then(() => {
            if (seq !== loadSeq.current) return;
            setGp(nextGp);
            setAnswer('');
            setRevealed(false);
            setPhase('challenge');
            setRound((n) => n + 1);
        });
    }, []);

    const next = useCallback(() => revealAfterLoading(generateProblem()), [revealAfterLoading]);

    // 최초 진입: 이미 생성된 문제를 리셋과 동일한 로딩 절차로 공개한다 (#32)
    const initialGp = useRef(gp);
    useEffect(() => {
        revealAfterLoading(initialGp.current);
    }, [revealAfterLoading]);

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
                {phase === 'loading' && <LoadingView />}
                {phase !== 'loading' && (
                    <>
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

                        <div className="badges">
                            <span
                                className={`badge badge-seat ${dealer ? 'b-dealer' : 'b-nondealer'}`}
                            >
                                {dealer ? '친' : '자'}
                            </span>
                            {p.riichi === 2 && <span className="badge b-riichi">더블리치</span>}
                            {p.riichi === 1 && <span className="badge b-riichi">리치</span>}
                            {p.ippatsu && <span className="badge b-riichi">일발</span>}
                            <span className={`badge badge-win ${tsumo ? 'b-tsumo' : 'b-ron'}`}>
                                {tsumo ? '쯔모' : '론'}
                            </span>
                        </div>

                        <div key={round} className={`hand-area ${tsumo ? 'win-tsumo' : 'win-ron'}`}>
                            <div className="hand-row">
                                <span className="row-label">손패</span>
                                <div className="hand-tiles">
                                    {p.hand.map((t, i) => (
                                        <TileView key={i} tile={t} dora={isDora(t)} />
                                    ))}
                                </div>
                            </div>
                            {p.melds.length > 0 && (
                                <div className="hand-row">
                                    <span className="row-label">후로</span>
                                    <div className="meld-list">
                                        {p.melds.map((m, i) => (
                                            <MeldView key={i} meld={m} isDora={isDora} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="hand-row">
                                <span className="row-label">오름패</span>
                                <TileView tile={p.winningTile} win dora={isDora(p.winningTile)} />
                            </div>
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
                            <AnswerView
                                result={r}
                                correct={correct}
                                revealed={revealed}
                                onNext={next}
                            />
                        )}
                    </>
                )}
            </section>
        </div>
    );
}

function LoadingView() {
    return (
        <div className="loading" role="status" aria-live="polite">
            <span className="loading-spinner" aria-hidden="true" />
            <span className="loading-text">문제 준비 중…</span>
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

    // 자 쯔모: 한 필드에 공백 구분으로 받으면 숫자 키패드(inputMode=numeric)에
    // 공백 키가 없어 일반 키보드가 떠야 하므로, 자·친 지불을 별도 필드로 받는다 (#17)
    // answer에는 기존 채점 형식("자 친")을 그대로 유지한다.
    const [others = '', dealerPay = ''] = answer.split(' ');
    const setPair = (o: string, d: string) => setAnswer(o === '' && d === '' ? '' : `${o} ${d}`);

    const othersRef = useRef<HTMLInputElement>(null);
    const dealerPayRef = useRef<HTMLInputElement>(null);
    // 론·친 쯔모의 단일 입력 필드 (둘은 동시에 렌더링되지 않아 ref 하나를 공유)
    const singleRef = useRef<HTMLInputElement>(null);

    // 자 지불은 대부분 4자리 이하라, 4자리가 되는 순간 친 지불로 포커스를 넘겨
    // 두 번째 필드 터치를 생략한다. 5자리(더블 역만 16000)는 매우 드물어
    // 자동 이동 후 첫 필드를 다시 터치해 이어 입력한다 — 4자리가 "되는" 순간에만
    // 이동하므로 0을 덧붙여 5자리를 만들거나 5자리에서 지울 때는 재이동하지 않는다.
    const setOthers = (v: string) => {
        setPair(v, dealerPay);
        if (v.length === 4 && others.length < 4) dealerPayRef.current?.focus();
    };

    // 자동 이동 직후 수정: 빈 친 지불 필드에서 백스페이스 시 자 지불로 복귀
    const onDealerPayKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && dealerPay === '') othersRef.current?.focus();
    };

    const filled =
        payment.kind === 'tsumoNonDealer' ? NON_DEALER_TSUMO_RE.test(answer.trim()) : answer !== '';

    // 키보드 단축키 (#25): Enter/Space 확인, R 리셋, A 정답 보기, 1~9 첫 필드 입력.
    // 매 렌더의 최신 상태(answer·filled 등)를 그대로 쓰기 위해 의존성 배열 없이 재구독한다.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
            // 포커스된 버튼은 Enter/Space가 네이티브 클릭으로 동작하므로 그대로 둔다
            if (e.target instanceof HTMLButtonElement) return;
            const inInput = e.target instanceof HTMLInputElement;

            if (e.key === 'Enter' || e.key === ' ') {
                // Space 기본 동작 차단: 페이지 스크롤, 채점 형식을 깨는 필드 공백 입력 방지
                e.preventDefault();
                if (filled) onSubmit();
                return;
            }

            // 글자·숫자 단축키는 필드 입력 중에는 무시한다
            if (inInput) return;

            // e.code(물리 키) 기준이라 한글 자판(ㄱ=R, ㅁ=A)도 함께 처리된다
            if (e.code === 'KeyR') {
                onReset();
                return;
            }
            if (e.code === 'KeyA') {
                onReveal();
                return;
            }

            // 1~9(0 제외): 첫 번째 필드에 이어 붙이고 포커스를 옮긴다
            if (/^[1-9]$/.test(e.key)) {
                e.preventDefault();
                if (payment.kind === 'tsumoNonDealer') {
                    othersRef.current?.focus();
                    // 4자리가 되면 setOthers의 기존 규칙대로 친 지불로 포커스가 넘어간다
                    setOthers(others + e.key);
                } else {
                    singleRef.current?.focus();
                    setAnswer(answer + e.key);
                }
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    });

    return (
        <div className="inputs">
            <div className="field-row">
                {payment.kind === 'ron' && (
                    <label className="field grow">
                        <span>론 점수 (지불 총액)</span>
                        <input
                            ref={singleRef}
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
                            ref={singleRef}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={answer}
                            onChange={set}
                            placeholder="예: 2600"
                        />
                    </label>
                )}
                {payment.kind === 'tsumoNonDealer' && (
                    <>
                        <label className="field grow">
                            <span>자 쯔모 (자 지불)</span>
                            <input
                                ref={othersRef}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={others}
                                onChange={(e) => setOthers(e.target.value)}
                                placeholder="예: 1000"
                            />
                        </label>
                        <label className="field grow">
                            <span>자 쯔모 (친 지불)</span>
                            <input
                                ref={dealerPayRef}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={dealerPay}
                                onChange={(e) => setPair(others, e.target.value)}
                                onKeyDown={onDealerPayKeyDown}
                                placeholder="예: 2000"
                            />
                        </label>
                    </>
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
    if (pm.kind === 'ron') return `${f(pm.total)}`;
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
    // 키보드 단축키 (#25): Enter/Space 다음 문제, R 리셋(해답 화면에서는 다음 문제와 동일).
    // 확인 직후 Enter를 계속 누르고 있어도 넘어가지 않도록 자동 반복(repeat)은 무시한다.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
            if (e.target instanceof HTMLButtonElement) return;
            if (e.key === 'Enter' || e.key === ' ' || e.code === 'KeyR') {
                e.preventDefault();
                onNext();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [onNext]);

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
