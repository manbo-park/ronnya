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
    it('홈: 트레이닝/유틸리티 그룹과 메뉴가 출력된다', () => {
        const html = renderAt('/');
        expect(html).toContain('richdrill');
        expect(html).toContain('점수 계산 연습');
        expect(html).toContain('href="/score"');
        // 유틸리티 메뉴
        expect(html).toContain('점수표');
        expect(html).toContain('역 목록');
        expect(html).toContain('href="/score-table"');
        expect(html).toContain('href="/yaku"');
        // 유틸리티 그룹은 트레이닝 그룹 아래에 배치
        expect(html.indexOf('트레이닝')).toBeLessThan(html.indexOf('유틸리티'));
    });

    it('/score: 도전 Phase가 서버 렌더링으로 출력된다', () => {
        const html = renderAt('/score');
        expect(html).toContain('점수 계산 연습');
        expect(html).toContain('도라표시패');
        expect(html).toContain('장풍');
        expect(html).toContain('확인');
        expect(html).toContain('정답 보기');
    });

    it('/score-table: 점수표가 자/친 전환과 점수, 만관 이상 명칭과 함께 출력된다', () => {
        const html = renderAt('/score-table');
        expect(html).toContain('점수표');
        // 자/친 버튼 (괄호 라벨 제거됨)
        expect(html).toContain('>자<');
        expect(html).toContain('>친<');
        expect(html).not.toContain('비친');
        expect(html).not.toContain('오야');
        // 하단 안내문구 제거
        expect(html).not.toContain('절상 만관 미적용');
        expect(html).not.toContain('0본장');
        // 1판 25부는 불가능, 자 4판 30부 론 = 7700
        expect(html).toContain('불가능');
        expect(html).toContain('7,700');
        // 만관 이상은 명칭만 (점수 없음)
        expect(html).toContain('만관');
        expect(html).toContain('하네만');
        expect(html).toContain('배만');
        expect(html).toContain('삼배만');
        expect(html).toContain('헤아림 역만');
    });

    it('/yaku: 역 목록이 이름·설명·배지와 함께 출력된다', () => {
        const html = renderAt('/yaku');
        expect(html).toContain('역 목록');
        expect(html).toContain('리치');
        expect(html).toContain('청일색');
        expect(html).toContain('국사무쌍');
        // 쿠이사가리 / 멘젠 한정 배지
        expect(html).toContain('후로 시 -1판');
        expect(html).toContain('멘젠 한정');
        expect(html).toContain('역만');
    });
});
