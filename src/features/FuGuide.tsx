// 부수 항목 한 줄: 항목명 + 부수 (+ 부가 설명)
interface FuRow {
    label: string;
    fu: string;
    note?: string;
}

interface FuSection {
    title: string;
    desc?: string;
    rows: FuRow[];
}

// 채점 엔진(score.ts computeFu)과 동일한 작혼 기준 부수 규칙
const SECTIONS: FuSection[] = [
    {
        title: '부저',
        desc: '모든 화료에 공통으로 깔리는 기본 부수.',
        rows: [
            { label: '부저', fu: '20부', note: '화료 형태와 무관하게 항상 더한다.' },
            {
                label: '치또이츠',
                fu: '25부',
                note: '아래 가산·절상 없이 항상 25부 고정.',
            },
        ],
    },
    {
        title: '화료 형태',
        desc: '어떻게 화료했는지에 따라 더한다.',
        rows: [
            {
                label: '멘젠 론',
                fu: '+10부',
                note: '울지 않은 손으로 론 화료 (멘젠 가산).',
            },
            {
                label: '쯔모',
                fu: '+2부',
                note: '핑후에는 붙지 않는다 → 핑후 쯔모는 20부.',
            },
            {
                label: '후로 론',
                fu: '+0부',
                note: '가산이 전혀 없어 합계 20부가 되면 30부로 처리한다 (쿠이핑후형 보정).',
            },
        ],
    },
    {
        title: '대기 형태',
        desc: '오름패를 기다린 모양. 여러 해석이 가능하면 점수가 높은 쪽을 따른다 (고점법).',
        rows: [
            { label: '양면 대기', fu: '0부', note: '23 → 1·4처럼 양쪽을 기다리는 모양.' },
            { label: '샤보 대기', fu: '0부', note: '또이쯔 둘 중 하나가 커쯔로 완성.' },
            { label: '간짱 대기', fu: '+2부', note: '24 → 3처럼 가운데를 기다리는 모양.' },
            { label: '변짱 대기', fu: '+2부', note: '12 → 3, 89 → 7만 해당.' },
            { label: '단기 대기', fu: '+2부', note: '머리(또이쯔)의 한 장을 기다리는 모양.' },
        ],
    },
    {
        title: '또이쯔',
        desc: '머리(또이쯔)가 어떤 패인지에 따라 더한다.',
        rows: [
            { label: '수패 · 객풍', fu: '0부', note: '객풍 = 장풍도 자풍도 아닌 바람패.' },
            { label: '역패 (백·발·중)', fu: '+2부' },
            { label: '장풍', fu: '+2부' },
            { label: '자풍', fu: '+2부' },
            {
                label: '연풍',
                fu: '+4부',
                note: '장풍이자 자풍인 패 (동장 동가의 동 등). 작혼은 4부.',
            },
        ],
    },
];

// 커쯔·깡 부수표: [밍커, 안커, 밍깡, 안깡] × [중장패, 노두·자패]
const KOTSU_ROWS: { label: string; simple: number; terminal: number }[] = [
    { label: '밍커', simple: 2, terminal: 4 },
    { label: '안커', simple: 4, terminal: 8 },
    { label: '밍깡', simple: 8, terminal: 16 },
    { label: '안깡', simple: 16, terminal: 32 },
];

export function FuGuide() {
    return (
        <div className="fu-guide">
            <p className="fu-intro">
                부수는 부저에 화료 형태·대기 형태·또이쯔·커쯔 부수를 더한 뒤 10부 단위로 절상해
                정한다. 판수와 함께 점수를 결정한다.
            </p>

            {SECTIONS.map((s) => (
                <section key={s.title} className="fu-card">
                    <h2 className="fu-card-title">{s.title}</h2>
                    {s.desc && <p className="fu-card-desc">{s.desc}</p>}
                    <table className="fu-rows">
                        <tbody>
                            {s.rows.map((r) => (
                                <tr key={r.label}>
                                    <td>
                                        {r.label}
                                        {r.note && <span className="fu-row-note">{r.note}</span>}
                                    </td>
                                    <td className="num-cell fu-value">{r.fu}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            ))}

            <section className="fu-card">
                <h2 className="fu-card-title">커쯔 · 깡</h2>
                <p className="fu-card-desc">
                    닫혀 있을수록(안커·안깡), 노두·자패일수록 2배씩 커진다. 론으로 완성한 커쯔는
                    밍커, 쯔모로 완성한 커쯔는 안커로 취급한다.
                </p>
                <table className="fu-kotsu">
                    <thead>
                        <tr>
                            <th />
                            <th>중장패 (2~8)</th>
                            <th>노두 · 자패</th>
                        </tr>
                    </thead>
                    <tbody>
                        {KOTSU_ROWS.map((r) => (
                            <tr key={r.label}>
                                <th>{r.label}</th>
                                <td>{`${r.simple}부`}</td>
                                <td>{`${r.terminal}부`}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section className="fu-card">
                <h2 className="fu-card-title">10부 단위 절상</h2>
                <p className="fu-card-desc">
                    항목을 모두 더한 합계의 1의 자리를 올려 10부 단위로 맞춘다. 치또이츠(25부)는
                    절상하지 않는다.
                </p>
                <div className="fu-example">
                    <span className="fu-example-label">계산 예</span>
                    부저 20 + 멘젠 론 10 + 간짱 대기 2 = 32 → <b>40부</b>
                    <br />
                    부저 20 + 쯔모 2 + 백 안커 8 = 30 → <b>30부</b> (절상 없음)
                </div>
            </section>
        </div>
    );
}
