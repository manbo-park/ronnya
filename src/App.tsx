import { Link, Route, Routes } from 'react-router-dom';
import { Home } from './features/Home';
import { ScoreTrainer } from './features/ScoreTrainer';
import { ScoreTable } from './features/ScoreTable';
import { YakuList } from './features/YakuList';

export default function App() {
    return (
        <div className="app">
            <Routes>
                <Route path="/" element={<Home />} />
                <Route
                    path="/score"
                    element={
                        <Page
                            title="점수 계산 연습"
                            footer="작혼 룰 기준 · 0본장 고정 · 뒷도라 미적용"
                        >
                            <ScoreTrainer />
                        </Page>
                    }
                />
                <Route
                    path="/score-table"
                    element={
                        <Page title="점수표">
                            <ScoreTable />
                        </Page>
                    }
                />
                <Route
                    path="/yaku"
                    element={
                        <Page title="역 목록" footer="작혼 룰 기준 · 판수 오름차순">
                            <YakuList />
                        </Page>
                    }
                />
            </Routes>
        </div>
    );
}

function Page({
    title,
    footer,
    children,
}: {
    title: string;
    footer?: string;
    children: React.ReactNode;
}) {
    return (
        <>
            <header className="app-header">
                <Link to="/" className="home-link">
                    ← 홈
                </Link>
                <h1>{title}</h1>
            </header>

            {children}

            {footer && <footer className="app-footer">{footer}</footer>}
        </>
    );
}
