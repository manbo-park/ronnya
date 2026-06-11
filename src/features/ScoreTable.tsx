import { useState } from 'react';
import { computePoints } from '../core/points';

const FU_COLS = [20, 25, 30, 40, 50, 60, 70];
const HAN_ROWS = [1, 2, 3, 4];

// 부수별 안내 (핑후 쯔모 = 20부, 치또이 = 25부)
const FU_NOTE: Record<number, string> = { 20: '핑후 쯔모', 25: '치또이' };

// 만관 이상은 부수가 점수에 무의미하므로 별도 정리 행으로 노출
const LIMITS: { name: string; han: number }[] = [
    { name: '만관', han: 5 },
    { name: '하네만', han: 6 },
    { name: '배만', han: 8 },
    { name: '삼배만', han: 11 },
    { name: '헤아림역만 · 역만', han: 13 },
];

const fmt = (n: number) => n.toLocaleString('ko-KR');

/** 해당 (판, 부) 조합이 실제로 성립하지 않는 칸인지 */
function impossible(han: number, fu: number): boolean {
    if (fu === 20 && han < 2) return true; // 핑후 쯔모는 최소 2판(핑후+쯔모)
    if (fu === 25 && han < 2) return true; // 치또이는 최소 2판
    return false;
}

function ronText(han: number, fu: number, dealer: boolean): string {
    if (fu === 20) return '—'; // 20부 론은 존재하지 않음(핑후 쯔모 전용)
    if (impossible(han, fu)) return '—';
    const pm = computePoints(han, fu, 0, dealer, false).payment;
    return pm.kind === 'ron' ? fmt(pm.total) : '—';
}

function tsumoText(han: number, fu: number, dealer: boolean): string {
    if (impossible(han, fu)) return '—';
    const pm = computePoints(han, fu, 0, dealer, true).payment;
    if (pm.kind === 'tsumoDealer') return `${fmt(pm.each)} 올`;
    if (pm.kind === 'tsumoNonDealer') return `${fmt(pm.others)} / ${fmt(pm.dealer)}`;
    return '—';
}

export function ScoreTable() {
    const [dealer, setDealer] = useState(false);

    return (
        <div className="score-table">
            <div className="seat-toggle" role="tablist" aria-label="자/친 전환">
                <button
                    role="tab"
                    aria-selected={!dealer}
                    className={`seat-btn ${!dealer ? 'active' : ''}`}
                    onClick={() => setDealer(false)}
                >
                    자 (비친)
                </button>
                <button
                    role="tab"
                    aria-selected={dealer}
                    className={`seat-btn ${dealer ? 'active' : ''}`}
                    onClick={() => setDealer(true)}
                >
                    친 (오야)
                </button>
            </div>

            <p className="st-legend">
                각 칸은 <b>윗줄 = 론</b>, <b>아랫줄 = 쯔모</b>
                {dealer ? ' (3명 각자 지불)' : ' (자 지불 / 친 지불)'}.
            </p>

            <div className="st-scroll">
                <table className="st-table">
                    <thead>
                        <tr>
                            <th className="st-corner">판 \ 부</th>
                            {FU_COLS.map((fu) => (
                                <th key={fu}>
                                    {fu}부
                                    {FU_NOTE[fu] && (
                                        <span className="st-fu-note">{FU_NOTE[fu]}</span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {HAN_ROWS.map((han) => (
                            <tr key={han}>
                                <th className="st-han">{han}판</th>
                                {FU_COLS.map((fu) => (
                                    <td key={fu}>
                                        <span className="st-ron">{ronText(han, fu, dealer)}</span>
                                        <span className="st-tsumo">
                                            {tsumoText(han, fu, dealer)}
                                        </span>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <table className="st-table st-limits">
                <tbody>
                    {LIMITS.map((l) => (
                        <tr key={l.name}>
                            <th className="st-han">{l.name}</th>
                            <td>
                                <span className="st-ron">{ronText(l.han, 30, dealer)}</span>
                                <span className="st-tsumo">{tsumoText(l.han, 30, dealer)}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <p className="st-foot">절상 만관 미적용 · 0본장 기준</p>
        </div>
    );
}
