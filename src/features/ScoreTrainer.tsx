import { useCallback, useState } from 'react';
import { generateProblem, type GeneratedProblem } from '../core/generator';
import type { Payment, ScoringResult } from '../core/types';
import { MeldView, TileView } from '../components/Tiles';

type Phase = 'challenge' | 'answer';

interface Inputs {
  score1: string; // 론 총액 / 친 쯔모 1명당 / 자 쯔모는 "자 친" 공백 구분 (예: 1000 2000)
  han: string;
  fu: string;
}

const EMPTY: Inputs = { score1: '', han: '', fu: '' };
const DORA_INDICATOR_SLOTS = 5; // 왕패의 도라표시패 자리 수
const NON_DEALER_TSUMO_RE = /^\d+\s+\d+$/;
const FU_OPTIONS = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];

export function ScoreTrainer({ hanFuMode }: { hanFuMode: boolean }) {
  const [gp, setGp] = useState<GeneratedProblem>(() => generateProblem());
  const [phase, setPhase] = useState<Phase>('challenge');
  const [inputs, setInputs] = useState<Inputs>(EMPTY);
  const [streak, setStreak] = useState({ correct: 0, total: 0 });

  const next = useCallback(() => {
    setGp(generateProblem());
    setInputs(EMPTY);
    setPhase('challenge');
  }, []);

  const p = gp.problem;
  const r = gp.result;
  const tsumo = p.winType === 'tsumo';
  const dealer = p.seatWind === 1;

  const grade = gradeAnswer(r, inputs, hanFuMode);

  const submit = () => {
    setStreak((s) => ({ correct: s.correct + (grade.allCorrect ? 1 : 0), total: s.total + 1 }));
    setPhase('answer');
  };

  return (
    <div className="trainer">
      <section className="card">
        <div className="badges">
          <span className="badge">0본장</span>
          <span className={`badge badge-win ${tsumo ? 'b-tsumo' : 'b-ron'}`}>
            {tsumo ? '쯔모' : '론'}
          </span>
          {p.riichi === 2 && <span className="badge b-riichi">더블리치</span>}
          {p.riichi === 1 && <span className="badge b-riichi">리치</span>}
          {p.ippatsu && <span className="badge b-riichi">일발</span>}
        </div>

        <div className="dora-row">
          <span className="row-label">장풍</span>
          <TileView tile={{ suit: 'z', rank: p.roundWind }} />
          <span className="row-label">자풍{dealer ? ' (친)' : ''}</span>
          <TileView tile={{ suit: 'z', rank: p.seatWind }} />
        </div>

        <div className="dora-row">
          <span className="row-label">도라표시</span>
          {Array.from({ length: DORA_INDICATOR_SLOTS }, (_, i) =>
            i < p.doraIndicators.length ? (
              <TileView key={i} tile={p.doraIndicators[i]} />
            ) : (
              <TileView key={i} back />
            ),
          )}
        </div>

        <div className="hand-area">
          <div className="hand-tiles">
            {p.hand.map((t, i) => (
              <TileView key={i} tile={t} />
            ))}
          </div>
          {p.melds.map((m, i) => (
            <MeldView key={i} meld={m} />
          ))}
          <div className="win-tile">
            <span className="meld-label">{tsumo ? '쯔모' : '론'}</span>
            <TileView tile={p.winningTile} win />
          </div>
        </div>

        {phase === 'challenge' ? (
          <ChallengeInputs
            payment={r.payment}
            hanFuMode={hanFuMode}
            yakuman={r.yakumanUnits > 0}
            inputs={inputs}
            setInputs={setInputs}
            onSubmit={submit}
            onReset={next}
          />
        ) : (
          <AnswerView result={r} grade={grade} hanFuMode={hanFuMode} onNext={next} />
        )}
      </section>

      <p className="streak">
        정답 {streak.correct} / {streak.total}
      </p>
    </div>
  );
}

function ChallengeInputs({
  payment,
  hanFuMode,
  yakuman,
  inputs,
  setInputs,
  onSubmit,
  onReset,
}: {
  payment: Payment;
  hanFuMode: boolean;
  yakuman: boolean;
  inputs: Inputs;
  setInputs: (i: Inputs) => void;
  onSubmit: () => void;
  onReset: () => void;
}) {
  const set = (k: keyof Inputs) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setInputs({ ...inputs, [k]: e.target.value });

  const filled =
    payment.kind === 'tsumoNonDealer'
      ? NON_DEALER_TSUMO_RE.test(inputs.score1.trim())
      : inputs.score1 !== '';

  return (
    <div className="inputs">
      {hanFuMode && !yakuman && (
        <div className="field-row">
          <label className="field">
            <span>판</span>
            <input inputMode="numeric" pattern="[0-9]*" value={inputs.han} onChange={set('han')} placeholder="판" />
          </label>
          <label className="field">
            <span>부 (만관 이상은 생략 가능)</span>
            <select value={inputs.fu} onChange={set('fu')}>
              <option value="">—</option>
              {FU_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}부
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {hanFuMode && yakuman && <p className="hint">역만 화료는 점수만 채점합니다.</p>}

      <div className="field-row">
        {payment.kind === 'ron' && (
          <label className="field grow">
            <span>론 점수 (지불 총액)</span>
            <input inputMode="numeric" pattern="[0-9]*" value={inputs.score1} onChange={set('score1')} placeholder="예: 7700" />
          </label>
        )}
        {payment.kind === 'tsumoDealer' && (
          <label className="field grow">
            <span>친 쯔모 (1명당 지불)</span>
            <input inputMode="numeric" pattern="[0-9]*" value={inputs.score1} onChange={set('score1')} placeholder="예: 2600" />
          </label>
        )}
        {payment.kind === 'tsumoNonDealer' && (
          <label className="field grow">
            <span>자 쯔모 (자·친 지불, 띄어서 입력)</span>
            <input pattern="[0-9 ]*" value={inputs.score1} onChange={set('score1')} placeholder="예: 1000 2000" />
          </label>
        )}
      </div>

      <div className="actions">
        <button className="btn ghost" onClick={onReset}>
          리셋
        </button>
        <button className="btn primary" onClick={onSubmit} disabled={!filled}>
          확인
        </button>
      </div>
    </div>
  );
}

interface Grade {
  allCorrect: boolean;
  scoreOk: boolean;
  hanOk: boolean | null; // null = 채점 제외
  fuOk: boolean | null;
}

function gradeAnswer(r: ScoringResult, inputs: Inputs, hanFuMode: boolean): Grade {
  let scoreOk = false;
  if (r.payment.kind === 'ron') scoreOk = Number(inputs.score1) === r.payment.total;
  else if (r.payment.kind === 'tsumoDealer') scoreOk = Number(inputs.score1) === r.payment.each;
  else {
    const [others, dealer] = inputs.score1.trim().split(/\s+/).map(Number);
    scoreOk = others === r.payment.others && dealer === r.payment.dealer;
  }

  let hanOk: boolean | null = null;
  let fuOk: boolean | null = null;
  if (hanFuMode && r.yakumanUnits === 0) {
    hanOk = Number(inputs.han) === r.han;
    // 만관 이상이면 부는 생략 가능 (입력 시에만 채점)
    if (r.limitName && inputs.fu === '') fuOk = null;
    else fuOk = Number(inputs.fu) === r.fu;
  }

  const allCorrect = scoreOk && hanOk !== false && fuOk !== false;
  return { allCorrect, scoreOk, hanOk, fuOk };
}

function paymentText(pm: Payment): string {
  const f = (n: number) => n.toLocaleString('ko-KR');
  if (pm.kind === 'ron') return `${f(pm.total)}점`;
  if (pm.kind === 'tsumoDealer') return `${f(pm.each)} 올`;
  return `${f(pm.others)} / ${f(pm.dealer)}`;
}

function AnswerView({
  result: r,
  grade,
  hanFuMode,
  onNext,
}: {
  result: ScoringResult;
  grade: Grade;
  hanFuMode: boolean;
  onNext: () => void;
}) {
  const headline =
    r.yakumanUnits > 0
      ? r.limitName
      : `${r.han}판 ${r.fu}부` +
        (r.limitName ? ` · ${r.limitName}${r.kiriage ? ' (키리아게)' : ''}` : '');

  return (
    <div className="answer">
      <div className={`verdict ${grade.allCorrect ? 'ok' : 'no'}`}>
        {grade.allCorrect ? '정답!' : '오답'}
      </div>

      <div className="plaque">
        <div className="plaque-main">{headline}</div>
        <div className="plaque-score">{paymentText(r.payment)}</div>
      </div>

      {hanFuMode && r.yakumanUnits === 0 && (
        <div className="grade-detail">
          <Mark ok={grade.hanOk} label="판" />
          <Mark ok={grade.fuOk} label="부" />
          <Mark ok={grade.scoreOk} label="점수" />
        </div>
      )}

      <table className="detail-table">
        <caption>역</caption>
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

      {r.yakumanUnits === 0 && (
        <table className="detail-table">
          <caption>부수 계산</caption>
          <tbody>
            {r.fuDetails.map((d, i) => (
              <tr key={i}>
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

function Mark({ ok, label }: { ok: boolean | null; label: string }) {
  if (ok === null) return <span className="mark skip">{label} 생략</span>;
  return <span className={`mark ${ok ? 'ok' : 'no'}`}>{label} {ok ? '✓' : '✗'}</span>;
}
