import { ScoreTrainer } from './features/ScoreTrainer';

export default function App() {
    return (
        <div className="app">
            <header className="app-header">
                <p className="eyebrow">RIICHI DRILL</p>
                <h1>리치드릴 · 점수 계산 연습</h1>
            </header>

            <ScoreTrainer />

            <footer className="app-footer">작혼 룰 기준 · 0본장 고정 · 뒷도라 미적용</footer>
        </div>
    );
}
