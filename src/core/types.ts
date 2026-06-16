/** 도메인 공통 타입 정의 */

export type Suit = 'm' | 'p' | 's' | 'z';

export interface Tile {
    suit: Suit;
    /** 수패 1~9, 자패 1~7 (동남서북백발중) */
    rank: number;
    /** 적도라 (5만/5통/5삭 각 1장) */
    red?: boolean;
}

export type MeldType = 'chi' | 'pon' | 'minkan' | 'kakan' | 'ankan';

/** 후로 출처: 상가(왼쪽) / 대면 / 하가(오른쪽) */
export type MeldFrom = 'left' | 'across' | 'right';

export interface Meld {
    type: MeldType;
    tiles: Tile[];
    /** 후로 출처 (안깡은 없음, 치는 항상 left) */
    from?: MeldFrom;
    /** 치에서 받은 패의 tiles 인덱스 (눕혀서 표시할 패) */
    calledIndex?: number;
}

export type WinType = 'tsumo' | 'ron';

/** 화료 문제 1건 */
export interface Problem {
    /** 순수 손패 (오름패 제외, 정렬됨) */
    hand: Tile[];
    melds: Meld[];
    winningTile: Tile;
    winType: WinType;
    /** 장풍: 1=동 2=남 */
    roundWind: 1 | 2;
    /** 자풍: 1=동(친) 2=남 3=서 4=북 */
    seatWind: 1 | 2 | 3 | 4;
    /** 0=없음 1=리치 2=더블리치 */
    riichi: 0 | 1 | 2;
    ippatsu: boolean;
    /** 왕패 (1 + 깡 수) */
    doraIndicators: Tile[];
    /** 뒷도라 표시패 (리치 화료 시에만 적용). 생략 시 미적용 */
    uraIndicators?: Tile[];
}

export interface YakuItem {
    name: string;
    han: number;
    /** 도라/적도라 (역이 아님) */
    isDora?: boolean;
    /** 역만 단위 수 (1=역만, 2=더블역만). 존재 시 han 무시. */
    yakuman?: number;
}

export interface FuItem {
    reason: string;
    fu: number;
    /** 역이 아닌 보정성 항목(예: 10부 단위 절상)은 약하게 표시 */
    dim?: boolean;
}

export type Payment =
    | { kind: 'ron'; total: number }
    | { kind: 'tsumoDealer'; each: number }
    | { kind: 'tsumoNonDealer'; dealer: number; others: number };

export interface ScoringResult {
    yaku: YakuItem[];
    /** 도라 포함 총 판수 (역만이면 0) */
    han: number;
    /** 절상 후 부수 (역만/국사 등은 표시용 0) */
    fu: number;
    fuDetails: FuItem[];
    /** 역만 단위 합 (0이면 일반 화료) */
    yakumanUnits: number;
    /** 만관/하네만/배만/삼배만/헤아림역만/역만/2배역만... */
    limitName?: string;
    basePoints: number;
    payment: Payment;
    /** 화료자가 받는 총점 */
    totalReceived: number;
}
