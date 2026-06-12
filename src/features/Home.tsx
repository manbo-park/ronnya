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
            { to: '/fu', title: '부수 계산법', desc: '부수 항목별 계산 안내' },
        ],
    },
];

export function Home() {
    return (
        <>
            <header className="app-header">
                <h1>
                    론냐
                    {/* 픽셀 그리드(10×10)로 그린 고양이 발바닥 2개 — 🐾를 픽셀 스타일로 (#39) */}
                    <svg
                        className="title-paw"
                        viewBox="0 0 10 10"
                        shapeRendering="crispEdges"
                        fill="currentColor"
                        role="img"
                        aria-label="고양이 발바닥"
                    >
                        {/* 좌상단 발바닥 */}
                        <rect x="0" y="0" width="1" height="1" />
                        <rect x="2" y="0" width="1" height="1" />
                        <rect x="4" y="0" width="1" height="1" />
                        <rect x="1" y="2" width="3" height="1" />
                        <rect x="0" y="3" width="5" height="1" />
                        <rect x="1" y="4" width="3" height="1" />
                        {/* 우하단 발바닥 */}
                        <rect x="5" y="5" width="1" height="1" />
                        <rect x="7" y="5" width="1" height="1" />
                        <rect x="9" y="5" width="1" height="1" />
                        <rect x="6" y="7" width="3" height="1" />
                        <rect x="5" y="8" width="5" height="1" />
                        <rect x="6" y="9" width="3" height="1" />
                    </svg>
                </h1>
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
