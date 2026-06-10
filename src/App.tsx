import { Link, Route, Routes } from 'react-router-dom';
import { Home } from './features/Home';
import { ScoreTrainer } from './features/ScoreTrainer';

export default function App() {
    return (
        <div className="app">
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/score" element={<ScorePage />} />
            </Routes>
        </div>
    );
}

function ScorePage() {
    return (
        <>
            <header className="app-header">
                <Link to="/" className="home-link">
                    ← 홈
                </Link>
                <h1>점수 계산 연습</h1>
            </header>

            <ScoreTrainer />

            <footer className="app-footer">작혼 룰 기준 · 0본장 고정 · 뒷도라 미적용</footer>
        </>
    );
}
