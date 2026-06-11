import { Link } from 'react-router-dom';

interface MenuItem {
    to: string;
    title: string;
    desc: string;
}

interface MenuGroup {
    label: string;
    items: MenuItem[];
}

// 트레이닝 그룹을 위에, 유틸리티 그룹을 그 아래에 배치한다
const GROUPS: MenuGroup[] = [
    {
        label: '트레이닝',
        items: [{ to: '/score', title: '점수 계산 연습', desc: '화료 점수 맞추기' }],
    },
    {
        label: '유틸리티',
        items: [
            { to: '/score-table', title: '점수표', desc: '판·부수별 점수 조견표' },
            { to: '/yaku', title: '역 목록', desc: '역 이름·설명·예시' },
        ],
    },
];

export function Home() {
    return (
        <>
            <header className="app-header">
                <h1>richdrill</h1>
            </header>

            {GROUPS.map((group) => (
                <section key={group.label} className="menu-section">
                    <h2 className="menu-section-title">{group.label}</h2>
                    <nav className="menu-grid">
                        {group.items.map((m) => (
                            <Link key={m.to} to={m.to} className="menu-card">
                                <span className="menu-title">{m.title}</span>
                                <span className="menu-desc">{m.desc}</span>
                            </Link>
                        ))}
                    </nav>
                </section>
            ))}
        </>
    );
}
