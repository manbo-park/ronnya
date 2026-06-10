import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import App from '../App';

describe('앱 스모크 테스트', () => {
  it('도전 Phase가 서버 렌더링으로 출력된다', () => {
    const html = renderToString(<App />);
    expect(html).toContain('점수 계산 연습');
    expect(html).toContain('도라표시');
    expect(html).toContain('장풍');
    expect(html).toContain('확인');
  });
});
