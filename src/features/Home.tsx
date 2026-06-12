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
                    {/* 픽셀 그리드(8×8)로 그린 고양이 발바닥 — 폰트 이모지 대신 픽셀 스타일 유지 (#39) */}
                    <svg
                        className="title-paw"
                        viewBox="0 0 8 8"
                        shapeRendering="crispEdges"
                        fill="currentColor"
                        role="img"
                        aria-label="고양이 발바닥"
                    >
                        {/* 발가락 패드 4개 — 안쪽 둘이 한 칸 높은 아치 */}
                        <rect x="0" y="2" width="1" height="2" />
                        <rect x="2" y="1" width="1" height="2" />
                        <rect x="5" y="1" width="1" height="2" />
                        <rect x="7" y="2" width="1" height="2" />
                        {/* 손바닥 패드 */}
                        <rect x="2" y="5" width="4" height="1" />
                        <rect x="1" y="6" width="6" height="1" />
                        <rect x="2" y="7" width="4" height="1" />
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
