import { useState } from 'react';
import { computePoints } from '../core/points';

// 사진과 동일한 부수 열 (20~110부)
const FU_COLS = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];
const HAN_ROWS = [1, 2, 3, 4];

// 만관 이상은 점수 없이 명칭만 표시. 판수 구간별로 행을 묶는다.
const LIMIT_GROUPS: { labels: string[]; name: string }[] = [
    { labels: ['5판'], name: '만관' },
    { labels: ['6판', '7판'], name: '하네만' },
    { labels: ['8판', '9판', '10판'], name: '배만' },
    { labels: ['11판', '12판'], name: '삼배만' },
    { labels: ['13판 이상'], name: '헤아림 역만' },
];

const fmt = (n: number) => n.toLocaleString('ko-KR');

// 기본점 = 부 × 2^(2+판). 2000 이상이면 만관으로 절상되어 부수가 무의미해진다.
const basePoints = (han: number, fu: number) => fu * Math.pow(2, 2 + han);
const isMangan = (han: number, fu: number) => basePoints(han, fu) >= 2000;

function ronTotal(han: number, fu: number, dealer: boolean): number {
    const pm = computePoints(han, fu, 0, dealer, false).payment;
    return pm.kind === 'ron' ? pm.total : 0;
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
                    자
                </button>
                <button
                    role="tab"
                    aria-selected={dealer}
                    className={`seat-btn ${dealer ? 'active' : ''}`}
                    onClick={() => setDealer(true)}
                >
                    친
                </button>
            </div>

            <table className="st-table">
                <thead>
                    <tr>
                        <th className="st-corner" />
                        {FU_COLS.map((fu) => (
                            <th key={fu}>{fu}부</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {HAN_ROWS.map((han) => {
                        // 같은 판이라도 부수가 커지면 만관에 도달 → 그 구간을 한 칸으로 병합
                        const manganIdx = FU_COLS.findIndex((fu) => isMangan(han, fu));
                        const valueCount = manganIdx === -1 ? FU_COLS.length : manganIdx;
                        return (
                            <tr key={han}>
                                <th className="st-han">{han}판</th>
                                {FU_COLS.slice(0, valueCount).map((fu) => (
                                    <td key={fu}>
                                        {fu === 25 && han === 1
                                            ? '불가능'
                                            : fmt(ronTotal(han, fu, dealer))}
                                    </td>
                                ))}
                                {manganIdx !== -1 && (
                                    <td className="st-limit" colSpan={FU_COLS.length - valueCount}>
                                        만관
                                    </td>
                                )}
                            </tr>
                        );
                    })}

                    {LIMIT_GROUPS.map((g) =>
                        g.labels.map((label, i) => (
                            <tr key={label}>
                                <th className="st-han">{label}</th>
                                {i === 0 && (
                                    <td
                                        className="st-limit"
                                        rowSpan={g.labels.length}
                                        colSpan={FU_COLS.length}
                                    >
                                        {g.name}
                                    </td>
                                )}
                            </tr>
                        )),
                    )}
                </tbody>
            </table>
        </div>
    );
}
