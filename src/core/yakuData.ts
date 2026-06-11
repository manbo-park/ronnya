import { parseTiles, sortTiles } from './tiles';
import type { Tile } from './types';

/** 역 목록(역 정보) 화면용 정적 데이터. 채점 엔진(score.ts)이 인정하는 역과 일치시킨다. */
export interface YakuDef {
    name: string;
    /** 멘젠(닫힌) 기준 판수. 역만은 이 값 대신 yakuman으로 표기. */
    han: number;
    /** 0=일반역, 1=역만, 2=더블역만 */
    yakuman: 0 | 1 | 2;
    /** 멘젠 한정 역 (후로 시 성립하지 않음) */
    closedOnly: boolean;
    /** 후로 시 줄어드는 판수(쿠이사가리). 0이면 변화 없음. */
    openMinus: number;
    desc: string;
    /** 예시 패 (대표형). 정렬해서 렌더한다. */
    example: Tile[];
}

const ex = (notation: string): Tile[] => sortTiles(parseTiles(notation));

/**
 * 작혼 기준 역 목록. 정렬은 화면에서 판수 오름차순으로 수행한다.
 * (도라·적도라는 역이 아니므로 제외)
 */
export const YAKU: YakuDef[] = [
    // ---- 1판 ----
    {
        name: '리치',
        han: 1,
        yakuman: 0,
        closedOnly: true,
        openMinus: 0,
        desc: '멘젠 상태로 텐파이를 선언하고 1000점을 공탁한다.',
        example: ex('234m 456p 234s 678s 55z'),
    },
    {
        name: '일발',
        han: 1,
        yakuman: 0,
        closedOnly: true,
        openMinus: 0,
        desc: '리치 선언 후 한 바퀴 이내에, 울음 없이 화료한다.',
        example: ex('234m 456p 234s 678s 55z'),
    },
    {
        name: '멘젠쯔모',
        han: 1,
        yakuman: 0,
        closedOnly: true,
        openMinus: 0,
        desc: '멘젠(울지 않은) 상태에서 쯔모로 화료한다.',
        example: ex('234m 456p 234s 678s 55z'),
    },
    {
        name: '핑후',
        han: 1,
        yakuman: 0,
        closedOnly: true,
        openMinus: 0,
        desc: '4개 멘쯔가 모두 슌쯔이고, 역패가 아닌 또이쯔에, 양면 대기로 화료한다.',
        example: ex('234m 456p 678p 234s 99s'),
    },
    {
        name: '탕야오',
        han: 1,
        yakuman: 0,
        closedOnly: false,
        openMinus: 0,
        desc: '2~8의 수패만으로 구성한다. 작혼은 울어도 인정(쿠이탕).',
        example: ex('234m 567m 345p 678s 44p'),
    },
    {
        name: '역패 (삼원패)',
        han: 1,
        yakuman: 0,
        closedOnly: false,
        openMinus: 0,
        desc: '삼원패(백·발·중) 커쯔. 종류마다 각 1판.',
        example: ex('5z5z5z 234m 456p 678s 99m'),
    },
    {
        name: '역패 (장풍·자풍)',
        han: 1,
        yakuman: 0,
        closedOnly: false,
        openMinus: 0,
        desc: '자신의 장풍패·자풍패 커쯔. 각 1판(연풍이면 2판).',
        example: ex('1z1z1z 234m 456p 678s 99m'),
    },
    {
        name: '이페코',
        han: 1,
        yakuman: 0,
        closedOnly: true,
        openMinus: 0,
        desc: '완전히 같은 슌쯔 2조. 멘젠 한정.',
        example: ex('234m 234m 567p 789s 55z'),
    },

    // ---- 2판 ----
    {
        name: '더블리치',
        han: 2,
        yakuman: 0,
        closedOnly: true,
        openMinus: 0,
        desc: '첫 번째 자기 차례에 울음 없이 리치를 선언한다.',
        example: ex('234m 456p 234s 678s 55z'),
    },
    {
        name: '치또이츠',
        han: 2,
        yakuman: 0,
        closedOnly: true,
        openMinus: 0,
        desc: '서로 다른 또이쯔 7조. 멘젠 한정, 부수는 25부 고정.',
        example: ex('1133m 5599p 2266s 44z'),
    },
    {
        name: '삼색동순',
        han: 2,
        yakuman: 0,
        closedOnly: false,
        openMinus: 1,
        desc: '같은 번호의 슌쯔를 만·통·삭 세 종류로 모은다.',
        example: ex('234m 234p 234s 678m 99z'),
    },
    {
        name: '일기통관',
        han: 2,
        yakuman: 0,
        closedOnly: false,
        openMinus: 1,
        desc: '한 종류 수패로 123·456·789 슌쯔를 완성한다.',
        example: ex('123m 456m 789m 234p 55z'),
    },
    {
        name: '삼색동각',
        han: 2,
        yakuman: 0,
        closedOnly: false,
        openMinus: 0,
        desc: '같은 번호의 커쯔를 만·통·삭 세 종류로 모은다.',
        example: ex('333m 333p 333s 678s 99z'),
    },
    {
        name: '찬타',
        han: 2,
        yakuman: 0,
        closedOnly: false,
        openMinus: 1,
        desc: '모든 멘쯔·또이쯔에 노두패 또는 자패가 포함되고, 슌쯔와 자패를 함께 가진다.',
        example: ex('123m 789p 123s 5z5z5z 99m'),
    },
    {
        name: '혼노두',
        han: 2,
        yakuman: 0,
        closedOnly: false,
        openMinus: 0,
        desc: '모든 패가 노두패·자패로만 이루어진다(커쯔 구성).',
        example: ex('111m 999p 5z5z5z 7z7z7z 99s'),
    },
    {
        name: '또이또이',
        han: 2,
        yakuman: 0,
        closedOnly: false,
        openMinus: 0,
        desc: '4개 멘쯔를 모두 커쯔(깡 포함)로 구성한다.',
        example: ex('333m 555p 888s 7z7z7z 22m'),
    },
    {
        name: '산안커',
        han: 2,
        yakuman: 0,
        closedOnly: false,
        openMinus: 0,
        desc: '암커(안깡 포함)를 3조 갖춘다.',
        example: ex('111m 333p 555s 678s 99m'),
    },
    {
        name: '산깡쯔',
        han: 2,
        yakuman: 0,
        closedOnly: false,
        openMinus: 0,
        desc: '깡을 3조 한다. (예시는 깡 3조 + 또이쯔)',
        example: ex('1111m 9999p 5z5z5z5z 33s'),
    },
    {
        name: '소삼원',
        han: 2,
        yakuman: 0,
        closedOnly: false,
        openMinus: 0,
        desc: '삼원패 중 2종을 커쯔, 1종을 또이쯔로 가진다.',
        example: ex('5z5z5z 6z6z6z 7z7z 234m 678p'),
    },

    // ---- 3판 ----
    {
        name: '량페코',
        han: 3,
        yakuman: 0,
        closedOnly: true,
        openMinus: 0,
        desc: '이페코(같은 슌쯔 2조)를 두 벌 갖춘다. 멘젠 한정.',
        example: ex('223344m 778899p 55s'),
    },
    {
        name: '준찬타',
        han: 3,
        yakuman: 0,
        closedOnly: false,
        openMinus: 1,
        desc: '모든 멘쯔·또이쯔에 노두패가 포함된다(자패 없음, 슌쯔 1개 이상).',
        example: ex('123m 789m 123p 789s 99s'),
    },
    {
        name: '혼일색',
        han: 3,
        yakuman: 0,
        closedOnly: false,
        openMinus: 1,
        desc: '한 종류의 수패와 자패만으로 구성한다.',
        example: ex('123m 456m 789m 5z5z5z 99m'),
    },

    // ---- 6판 ----
    {
        name: '청일색',
        han: 6,
        yakuman: 0,
        closedOnly: false,
        openMinus: 1,
        desc: '한 종류의 수패만으로 구성한다(자패 없음).',
        example: ex('111m 234m 567m 789m 99m'),
    },

    // ---- 역만 ----
    {
        name: '국사무쌍',
        han: 13,
        yakuman: 1,
        closedOnly: true,
        openMinus: 0,
        desc: '13종의 노두패·자패를 한 장씩 모으고 그중 한 장을 또이쯔로. 13면 대기는 더블역만.',
        example: ex('19m 19p 19s 1234567z 1z'),
    },
    {
        name: '스안커',
        han: 13,
        yakuman: 1,
        closedOnly: true,
        openMinus: 0,
        desc: '암커 4조. 단기 대기로 완성하면 더블역만.',
        example: ex('111m 333p 555s 7z7z7z 99m'),
    },
    {
        name: '대삼원',
        han: 13,
        yakuman: 1,
        closedOnly: false,
        openMinus: 0,
        desc: '삼원패(백·발·중)를 모두 커쯔로 가진다.',
        example: ex('5z5z5z 6z6z6z 7z7z7z 234m 99p'),
    },
    {
        name: '소사희',
        han: 13,
        yakuman: 1,
        closedOnly: false,
        openMinus: 0,
        desc: '풍패 3종을 커쯔, 남은 1종을 또이쯔로 가진다.',
        example: ex('1z1z1z 2z2z2z 3z3z3z 4z4z 234m'),
    },
    {
        name: '대사희',
        han: 26,
        yakuman: 2,
        closedOnly: false,
        openMinus: 0,
        desc: '풍패(동·남·서·북) 4종을 모두 커쯔로 가진다. 더블역만.',
        example: ex('1z1z1z 2z2z2z 3z3z3z 4z4z4z 99m'),
    },
    {
        name: '자일색',
        han: 13,
        yakuman: 1,
        closedOnly: false,
        openMinus: 0,
        desc: '모든 패가 자패로만 이루어진다.',
        example: ex('1z1z1z 5z5z5z 6z6z6z 7z7z7z 2z2z'),
    },
    {
        name: '청노두',
        han: 13,
        yakuman: 1,
        closedOnly: false,
        openMinus: 0,
        desc: '모든 패가 노두패(1·9 수패)로만 이루어진다.',
        example: ex('111m 999m 111p 999s 11s'),
    },
    {
        name: '녹일색',
        han: 13,
        yakuman: 1,
        closedOnly: false,
        openMinus: 0,
        desc: '녹색 패(2·3·4·6·8삭과 발)만으로 구성한다.',
        example: ex('234234s 666s 888s 66z'),
    },
    {
        name: '스깡쯔',
        han: 13,
        yakuman: 1,
        closedOnly: false,
        openMinus: 0,
        desc: '깡을 4조 한다. (예시는 깡 4조; 실제로는 또이쯔가 추가된다)',
        example: ex('1111m 9999p 5z5z5z5z 6z6z6z6z'),
    },
    {
        name: '구련보등',
        han: 13,
        yakuman: 1,
        closedOnly: true,
        openMinus: 0,
        desc: '한 수패로 1112345678999 + 임의의 1장. 멘젠 한정, 순정은 더블역만.',
        example: ex('1112345678999m 5m'),
    },
];
