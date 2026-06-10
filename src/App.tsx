import { useEffect, useState } from 'react';
import { ScoreTrainer } from './features/ScoreTrainer';

const SETTING_KEY = 'richdrill.hanFuMode';

function loadHanFuMode(): boolean {
  try {
    return localStorage.getItem(SETTING_KEY) === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const [hanFuMode, setHanFuMode] = useState<boolean>(loadHanFuMode);

  useEffect(() => {
    try {
      localStorage.setItem(SETTING_KEY, hanFuMode ? '1' : '0');
    } catch {
      // 저장 불가 환경에서는 세션 동안만 유지
    }
  }, [hanFuMode]);

  return (
    <div className="app">
      <header className="app-header">
        <p className="eyebrow">RIICHI DRILL</p>
        <h1>리치드릴 · 점수 계산 연습</h1>
      </header>

      <label className="setting-row">
        <span>판·부 입력 모드</span>
        <input
          type="checkbox"
          checked={hanFuMode}
          onChange={(e) => setHanFuMode(e.target.checked)}
        />
      </label>

      <ScoreTrainer hanFuMode={hanFuMode} />

      <footer className="app-footer">
        작혼 룰 기준 · 0본장 고정 · 뒷도라 미적용 (연습 목적의 의도적 차이)
      </footer>
    </div>
  );
}
