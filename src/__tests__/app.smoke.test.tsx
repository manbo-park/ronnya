import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

function renderAt(path: string): string {
    return renderToString(
        <MemoryRouter initialEntries={[path]}>
            <App />
        </MemoryRouter>,
    );
}

describe('앱 스모크 테스트', () => {
    it('메인 페이지에 메뉴가 출력된다', () => {
        const html = renderAt('/');
        expect(html).toContain('richdrill');
        expect(html).toContain('점수 계산 연습');
        expect(html).toContain('href="/score"');
    });

    it('/score: 도전 Phase가 서버 렌더링으로 출력된다', () => {
        const html = renderAt('/score');
        expect(html).toContain('점수 계산 연습');
        expect(html).toContain('왕패');
        expect(html).toContain('장풍');
        expect(html).toContain('확인');
        expect(html).toContain('정답 보기');
    });
});
