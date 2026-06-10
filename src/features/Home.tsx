import { Link } from 'react-router-dom';

const MENUS = [{ to: '/score', title: '점수 계산 연습', desc: '화료 점수 맞추기' }];

export function Home() {
    return (
        <>
            <header className="app-header">
                <h1>richdrill</h1>
            </header>

            <nav className="menu-grid">
                {MENUS.map((m) => (
                    <Link key={m.to} to={m.to} className="menu-card">
                        <span className="menu-title">{m.title}</span>
                        <span className="menu-desc">{m.desc}</span>
                    </Link>
                ))}
            </nav>
        </>
    );
}
