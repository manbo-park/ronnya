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
        expect(html).toContain('론냐');
        expect(html).toContain('title-paw');
        expect(html).toContain('점수 계산 연습');
        expect(html).toContain('href="/score"');
        // 유틸리티 메뉴
        expect(html).toContain('점수표');
        expect(html).toContain('역 목록');
        expect(html).toContain('부수 계산법');
        expect(html).toContain('href="/score-table"');
        expect(html).toContain('href="/yaku"');
        expect(html).toContain('href="/fu"');
        // 유틸리티 그룹은 트레이닝 그룹 아래에 배치
        expect(html.indexOf('트레이닝')).toBeLessThan(html.indexOf('유틸리티'));
    });

    it('/score: 최초 진입 시 문제 대신 로딩 UI가 출력된다 (#32)', () => {
        const html = renderAt('/score');
        expect(html).toContain('점수 계산 연습');
        expect(html).toContain('문제 준비 중');
        // 패 이미지가 준비되기 전에는 문제를 노출하지 않는다
        expect(html).not.toContain('도라표시패');
        expect(html).not.toContain('확인');
    });

    it('/score-table: 론/쯔모 2줄 표기와 만관 이상 명칭, 기본 60부까지 출력된다', () => {
        const html = renderAt('/score-table');
        expect(html).toContain('점수표');
        // 자/친 버튼 (괄호 라벨 없음)
        expect(html).toContain('>자<');
        expect(html).toContain('>친<');
        expect(html).not.toContain('비친');
        expect(html).not.toContain('오야');
        // 하단 안내문구 제거
        expect(html).not.toContain('절상 만관 미적용');
        expect(html).not.toContain('0본장');
        // 론/쯔모 2줄 표기 유지
        expect(html).toContain('st-ron');
        expect(html).toContain('st-tsumo');
        // 자 4판 30부 론 = 7,700
        expect(html).toContain('7,700');
        // 만관 이상은 명칭 + 론/쯔모 점수 (자 만관 론 = 8,000)
        expect(html).toContain('만관');
        expect(html).toContain('8,000');
        expect(html).toContain('하네만');
        expect(html).toContain('배만');
        expect(html).toContain('삼배만');
        expect(html).toContain('헤아림 역만');
        // 기본은 60부까지, 70부 이상은 버튼으로 확장 (110부 열은 기본 비표시)
        expect(html).toContain('60부');
        expect(html).not.toContain('110부');
        expect(html).toContain('70부 이상');
    });

    it('/fu: 부수 계산법 섹션과 절상 안내가 출력된다', () => {
        const html = renderAt('/fu');
        expect(html).toContain('부수 계산법');
        // 이슈 #34에서 요구한 섹션 구성
        expect(html).toContain('부저');
        expect(html).toContain('화료 형태');
        expect(html).toContain('대기 형태');
        expect(html).toContain('또이쯔');
        expect(html).toContain('커쯔');
        expect(html).toContain('10부 단위 절상');
        // 주요 수치: 치또이 고정 25부, 안깡 노두·자패 32부, 절상 예시
        expect(html).toContain('치또이츠');
        expect(html).toContain('25부');
        expect(html).toContain('32부');
        expect(html).toContain('40부');
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
