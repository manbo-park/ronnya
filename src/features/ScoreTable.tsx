import { useState } from 'react';
import { computePoints } from '../core/points';

// 기본은 20~60부만 노출(가로 스크롤 없음). 70부 이상은 버튼으로 확장.
const FU_BASE = [20, 25, 30, 40, 50, 60];
const FU_EXT = [70, 80, 90, 100, 110];
const HAN_ROWS = [1, 2, 3, 4];

// 만관 이상은 점수 없이 명칭만 표시. 판수 구간별로 행을 묶는다.
const LIMIT_GROUPS: { labels: string[]; name: string }[] = [
    { labels: ['5판'], name: '만관' },
    { labels: ['6판', '7판'], name: '하네만' },
    { labels: ['8판', '9판', '10판'], name: '배만' },
    { labels: ['11판', '12판'], name: '삼배만' },
    { labels: ['+13판'], name: '헤아림 역만' },
];

const fmt = (n: number) => n.toLocaleString('ko-KR');

// 기본점 = 부 × 2^(2+판). 2000 이상이면 만관으로 절상되어 부수가 무의미해진다.
const basePoints = (han: number, fu: number) => fu * Math.pow(2, 2 + han);
const isMangan = (han: number, fu: number) => basePoints(han, fu) >= 2000;

// 성립하지 않는 칸: 20부/25부는 각각 핑후 쯔모·치또이 전용이라 최소 2판
const impossible = (han: number, fu: number) => (fu === 20 || fu === 25) && han < 2;

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
    if (pm.kind === 'tsumoNonDealer') return `${fmt(pm.others)}/${fmt(pm.dealer)}`;
    return '—';
}

export function ScoreTable() {
    const [dealer, setDealer] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const visibleFu = expanded ? [...FU_BASE, ...FU_EXT] : FU_BASE;

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

            <p className="st-legend">
                <span className="lg-ron">론</span> 윗줄 · <span className="lg-tsumo">쯔모</span>{' '}
                아랫줄
                {dealer ? ' (3명 각자 지불)' : ' (자/친 지불)'}
            </p>

            <div className="st-scroll">
                <table className={`st-table ${expanded ? 'expanded' : ''}`}>
                    <thead>
                        <tr>
                            <th className="st-corner" />
                            {visibleFu.map((fu) => (
                                <th key={fu}>{`${fu}부`}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {HAN_ROWS.map((han) => {
                            // 부수가 커지면 만관에 도달 → 보이는 만관 구간을 한 칸으로 병합
                            const manganIdx = visibleFu.findIndex((fu) => isMangan(han, fu));
                            const valueCount = manganIdx === -1 ? visibleFu.length : manganIdx;
                            return (
                                <tr key={han}>
                                    <th className="st-han">{`${han}판`}</th>
                                    {visibleFu.slice(0, valueCount).map((fu) => (
                                        <td key={fu}>
                                            <span className="st-ron">
                                                {ronText(han, fu, dealer)}
                                            </span>
                                            <span className="st-tsumo">
                                                {tsumoText(han, fu, dealer)}
                                            </span>
                                        </td>
                                    ))}
                                    {manganIdx !== -1 && (
                                        <td
                                            className="st-limit"
                                            colSpan={visibleFu.length - valueCount}
                                        >
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
                                            colSpan={visibleFu.length}
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

            <button
                className="fu-toggle"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
            >
                {expanded ? '70부 이상 접기' : '70부 이상 보기'}
            </button>
        </div>
    );
}
