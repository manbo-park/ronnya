import { Link, Route, Routes } from 'react-router-dom';
import { Home } from './features/Home';
import { ScoreTrainer } from './features/ScoreTrainer';
import { ScoreTable } from './features/ScoreTable';
import { YakuList } from './features/YakuList';
import { FuGuide } from './features/FuGuide';
import { Calculator } from './features/Calculator';

export default function App() {
    return (
        <div className="app">
            <Routes>
                <Route path="/" element={<Home />} />
                <Route
                    path="/train"
                    element={
                        <Page title="연습하기" footer="작혼 룰 기준 · 0본장 고정 · 뒷도라 미적용">
                            <ScoreTrainer />
                        </Page>
                    }
                />
                <Route
                    path="/score"
                    element={
                        <Page title="점수표">
                            <ScoreTable />
                        </Page>
                    }
                />
                <Route
                    path="/calc"
                    element={
                        <Page title="계산하기" footer="작혼 룰 기준 · 연풍 또이쯔 4부">
                            <Calculator />
                        </Page>
                    }
                />
                <Route
                    path="/fu"
                    element={
                        <Page title="부수 계산법" footer="작혼 룰 기준 · 연풍 또이쯔 4부">
                            <FuGuide />
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
                <Link to="/" className="home-link" aria-label="홈으로">
                    {/* 픽셀 그리드(8×8)로 그린 집 아이콘 */}
                    <svg
                        viewBox="0 0 8 8"
                        shapeRendering="crispEdges"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <rect x="3" y="0" width="2" height="1" />
                        <rect x="2" y="1" width="4" height="1" />
                        <rect x="1" y="2" width="6" height="1" />
                        <rect x="0" y="3" width="8" height="1" />
                        <rect x="1" y="4" width="6" height="1" />
                        <rect x="1" y="5" width="2" height="3" />
                        <rect x="5" y="5" width="2" height="3" />
                    </svg>
                </Link>
                <h1>{title}</h1>
            </header>

            {children}

            {footer && <footer className="app-footer">{footer}</footer>}
        </>
    );
}
