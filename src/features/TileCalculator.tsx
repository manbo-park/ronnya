import { useState } from 'react';
import { scoreHand } from '../core/score';
import { nextDoraId, sortTiles, tileId, tileLabel } from '../core/tiles';
import { paymentText } from '../core/points';
import type { Meld, MeldFrom, MeldType, Problem, ScoringResult, Suit, Tile } from '../core/types';
import { MeldView, TilePicker, TileView } from '../components/Tiles';
import { Segmented } from './Calculator';

type Slot = 'hand' | 'win' | 'dora' | 'ura' | 'meld';

// 받은(눕힌) 패의 tiles 인덱스. 하가는 마지막 열(밍깡 4장, 퐁·가깡 표시열 3장).
function laidCol(type: MeldType, from: MeldFrom): number {
    if (from === 'left') return 0;
    if (from === 'across') return 1;
    return type === 'minkan' ? 3 : 2;
}

// 치 한 묶음. redIndex가 지정되면 그 위치의 패를 적도라로. 치는 항상 상가에서 받는다.
function chiMeld(suit: Suit, base: number, called: number, redIndex: number | null): Meld {
    const at = (rank: number, isRed = false): Tile =>
        isRed ? { suit, rank, red: true } : { suit, rank };
    const tiles = [at(base), at(base + 1), at(base + 2)];
    if (redIndex !== null) tiles[redIndex] = at(base + redIndex, true);
    return { type: 'chi', tiles, from: 'left', calledIndex: called };
}

// 커쯔/깡쯔 한 묶음(깡은 4장). redIndex가 지정되면 그 위치의 패를 적도라로 한다.
function kotsuMeld(
    type: Exclude<MeldType, 'chi'>,
    suit: Suit,
    rank: number,
    from: MeldFrom,
    redIndex: number | null,
): Meld {
    const n = type === 'pon' ? 3 : 4;
    const tiles: Tile[] = Array.from({ length: n }, () => ({ suit, rank }));
    if (redIndex !== null) tiles[redIndex] = { suit, rank, red: true };
    return type === 'ankan' ? { type, tiles } : { type, tiles, from };
}

export function TileCalculator() {
    const [hand, setHand] = useState<Tile[]>([]);
    const [melds, setMelds] = useState<Meld[]>([]);
    const [winTile, setWinTile] = useState<Tile | null>(null);
    const [dora, setDora] = useState<Tile[]>([]);
    const [ura, setUra] = useState<Tile[]>([]);
    const [target, setTarget] = useState<Slot>('hand');
    const [meldType, setMeldType] = useState<MeldType>('chi');
    // 받을 패를 고르면 그 패로 만들 수 있는 후로 후보를 제시하고 선택받는다(안깡 제외)
    const [pendingTile, setPendingTile] = useState<Tile | null>(null);

    const [roundWind, setRoundWind] = useState<1 | 2>(1);
    const [seatWind, setSeatWind] = useState<1 | 2 | 3 | 4>(1);
    const [winType, setWinType] = useState<'tsumo' | 'ron'>('ron');
    const [riichi, setRiichi] = useState<0 | 1 | 2>(0);
    const [honba, setHonba] = useState(0);

    const maxHand = 13 - 3 * melds.length; // 후로 1묶음당 손패 3장 차감
    const open = melds.some((m) => m.type !== 'ankan'); // 안깡은 멘젠 유지

    // 같은 패의 전역 사용 매수(손패 + 후로 + 오름패 + 도라/뒷도라표시패)
    const usedCount = (id: number) => {
        let n = 0;
        for (const t of hand) if (tileId(t) === id) n++;
        for (const m of melds) for (const t of m.tiles) if (tileId(t) === id) n++;
        if (winTile && tileId(winTile) === id) n++;
        for (const t of dora) if (tileId(t) === id) n++;
        for (const t of ura) if (tileId(t) === id) n++;
        return n;
    };

    const avail = (id: number) => 4 - usedCount(id); // 패산에 남은 매수
    const hasMeldRoom = melds.length < 4 && hand.length <= 13 - 3 * (melds.length + 1);

    // 적도라는 수트당 1장뿐
    const redUsed = (suit: Suit) =>
        [
            ...hand,
            ...melds.flatMap((m) => m.tiles),
            ...(winTile ? [winTile] : []),
            ...dora,
            ...ura,
        ].some((t) => t.suit === suit && t.red);

    const addMeld = (m: Meld) => {
        if (!hasMeldRoom) return;
        setMelds((ms) => [...ms, m]);
        if (m.type !== 'ankan') setRiichi(0); // 오픈 후로는 리치 불가
    };

    // 받을 패(클릭한 패)를 포함하는 슌쯔 후보 — base는 슌쯔 첫 패 rank, called는 받은 패 위치(0~2)
    const chiCandidates = (t: Tile): { base: number; called: number }[] => {
        if (t.suit === 'z') return [];
        const out: { base: number; called: number }[] = [];
        for (const called of [0, 1, 2]) {
            const base = t.rank - called;
            if (base < 1 || base + 2 > 9) continue;
            const ranks = [base, base + 1, base + 2];
            if (ranks.every((r) => avail(tileId({ suit: t.suit, rank: r })) >= 1)) {
                out.push({ base, called });
            }
        }
        return out;
    };

    // 받을 패로 만들 수 있는 후로 후보. 치는 슌쯔별, 퐁·깡은 받은 방향별로 미리보기를 만든다.
    // 적도라(5수패): 적5를 누르면 받은(눕힌) 패가 적도라, 일반 5를 누르면 적도라가
    // 다른 패 중 맨 왼쪽에 온다. 깡은 5 네 장을 모두 쓰므로 적도라가 항상 포함되고,
    // 퐁은 적도라 없는 케이스도 함께 제시한다. 가깡은 적5 선택 시 기존 퐁 패/추가 패 두 케이스.
    const meldCandidates = (t: Tile): Meld[] => {
        const { suit, rank } = t;
        const clickedRed = !!t.red;
        const redFree = !redUsed(suit);
        if (meldType === 'chi') {
            const out: Meld[] = [];
            for (const { base, called } of chiCandidates(t)) {
                if (clickedRed) {
                    out.push(chiMeld(suit, base, called, called)); // 받은 적5가 적도라
                    continue;
                }
                out.push(chiMeld(suit, base, called, null)); // 적도라 없음
                // 슌쯔에 5가 있고 그 5가 받은 패가 아니면, 들고 있던 적5인 케이스 추가
                const fivePos = 5 - base;
                if (fivePos >= 0 && fivePos <= 2 && fivePos !== called && redFree) {
                    out.push(chiMeld(suit, base, called, fivePos));
                }
            }
            return out;
        }
        const isFive = rank === 5;
        const froms: MeldFrom[] = ['left', 'across', 'right'];
        const out: Meld[] = [];
        for (const from of froms) {
            const laid = laidCol(meldType, from);
            const leftmostOther = (max: number) => [...Array(max).keys()].find((i) => i !== laid)!;
            if (meldType === 'pon') {
                if (clickedRed) {
                    out.push(kotsuMeld('pon', suit, rank, from, laid));
                } else {
                    out.push(kotsuMeld('pon', suit, rank, from, null));
                    if (isFive && redFree) {
                        out.push(kotsuMeld('pon', suit, rank, from, leftmostOther(3)));
                    }
                }
            } else if (meldType === 'minkan') {
                const redIdx = !isFive ? null : clickedRed ? laid : leftmostOther(4);
                out.push(kotsuMeld('minkan', suit, rank, from, redIdx));
            } else {
                // 가깡: 표시열 0~2 + 위에 쌓는 추가 패 index 3
                if (!isFive) {
                    out.push(kotsuMeld('kakan', suit, rank, from, null));
                } else if (clickedRed) {
                    out.push(kotsuMeld('kakan', suit, rank, from, laid)); // 기존 퐁 패가 적도라
                    out.push(kotsuMeld('kakan', suit, rank, from, 3)); // 추가 패가 적도라
                } else {
                    out.push(kotsuMeld('kakan', suit, rank, from, leftmostOther(3)));
                }
            }
        }
        return out;
    };

    const pick = (t: Tile) => {
        if (target === 'hand') {
            if (hand.length >= maxHand) return;
            setHand((h) => sortTiles([...h, t]));
        } else if (target === 'meld') {
            // 안깡은 방향이 없어 바로 추가, 나머지는 후보 선택을 받는다
            if (meldType === 'ankan')
                addMeld(kotsuMeld('ankan', t.suit, t.rank, 'left', t.red ? 0 : null));
            else setPendingTile(t);
        } else if (target === 'win') {
            setWinTile(t);
        } else if (target === 'dora') {
            setDora((d) => [...d, t]);
        } else {
            setUra((u) => [...u, t]);
        }
    };

    const reset = () => {
        setHand([]);
        setMelds([]);
        setWinTile(null);
        setDora([]);
        setUra([]);
        setTarget('hand');
        setMeldType('chi');
        setPendingTile(null);
        setRoundWind(1);
        setSeatWind(1);
        setWinType('ron');
        setRiichi(0);
        setHonba(0);
    };

    const removeHand = (i: number) => setHand((h) => h.filter((_, idx) => idx !== i));
    const removeMeld = (i: number) => setMelds((ms) => ms.filter((_, idx) => idx !== i));
    const removeDora = (i: number) => setDora((d) => d.filter((_, idx) => idx !== i));
    const removeUra = (i: number) => setUra((u) => u.filter((_, idx) => idx !== i));

    // 도라표시패(+리치 시 뒷도라표시패)가 가리키는 패에 광택을 줄 id 집합
    const doraIds = new Set<number>();
    for (const ind of dora) doraIds.add(nextDoraId(tileId(ind)));
    if (riichi > 0) for (const ind of ura) doraIds.add(nextDoraId(tileId(ind)));
    const isDora = (t: Tile) => doraIds.has(tileId(t));

    const ready = hand.length === maxHand && winTile !== null && dora.length >= 1;

    let result: ScoringResult | null = null;
    let error: string | null = null;
    if (ready) {
        const p: Problem = {
            hand,
            melds,
            winningTile: winTile,
            winType,
            roundWind,
            seatWind,
            riichi,
            ippatsu: false,
            doraIndicators: dora,
            uraIndicators: riichi > 0 ? ura : undefined,
            honba,
        };
        try {
            result = scoreHand(p);
        } catch (e) {
            error = e instanceof Error ? e.message : '계산할 수 없습니다';
        }
    }

    // 후로용: 클릭한 패로 묶음을 만들 수 있는지
    const meldUnavailable = (t: Tile) => {
        if (t.red && redUsed(t.suit)) return true; // 적도라는 수트당 1장
        if (meldType === 'chi') return chiCandidates(t).length === 0;
        return avail(tileId(t)) < (meldType === 'pon' ? 3 : 4);
    };

    const pickerDisabled = (t: Tile) => {
        if (target === 'meld') return melds.length >= 4 || meldUnavailable(t);
        if (target === 'hand' && hand.length >= maxHand) return true;
        if (t.red && redUsed(t.suit)) return true;
        return avail(tileId(t)) < 1;
    };

    return (
        <div className="calc-content tile-calc">
            <Segmented
                label="입력 대상"
                value={target}
                options={[
                    { value: 'hand', label: `손패 ${hand.length}/${maxHand}` },
                    { value: 'meld', label: `후로 ${melds.length}` },
                    { value: 'win', label: '오름패' },
                    { value: 'dora', label: `도라 ${dora.length}` },
                    { value: 'ura', label: `뒷도라 ${ura.length}`, disabled: riichi === 0 },
                ]}
                onChange={(v) => {
                    setTarget(v);
                    setPendingTile(null);
                }}
            />

            {target === 'meld' && (
                <>
                    <Segmented
                        label="후로 종류"
                        value={meldType}
                        options={[
                            { value: 'chi', label: '치' },
                            { value: 'pon', label: '퐁' },
                            { value: 'kakan', label: '가깡' },
                            { value: 'minkan', label: '밍깡' },
                            { value: 'ankan', label: '안깡' },
                        ]}
                        onChange={(v) => {
                            setMeldType(v);
                            setPendingTile(null);
                        }}
                    />
                    <span className="tile-calc-empty">
                        {meldType === 'ankan'
                            ? '패를 누르면 안깡이 만들어집니다.'
                            : '받을 패를 누르면 만들 수 있는 후로를 보여줍니다.'}
                    </span>
                </>
            )}

            <TilePicker onPick={pick} disabled={pickerDisabled} />

            {target === 'meld' && pendingTile && (
                <div className="calc-field">
                    <span className="calc-field-label">
                        {tileLabel(pendingTile)} 받아서 만들 후로 선택
                    </span>
                    <div className="chi-candidates">
                        {meldCandidates(pendingTile).map((meld, i) => (
                            <button
                                key={i}
                                type="button"
                                className="chi-candidate"
                                disabled={!hasMeldRoom}
                                onClick={() => {
                                    addMeld(meld);
                                    setPendingTile(null);
                                }}
                            >
                                <MeldView meld={meld} isDora={isDora} />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="tile-calc-slots">
                <div className="hand-row">
                    <span className="row-label">손패</span>
                    <div className="hand-tiles">
                        {hand.map((t, i) => (
                            <button
                                key={i}
                                type="button"
                                className="tile-del-btn"
                                aria-label={`손패 ${i + 1}번 패 제거`}
                                onClick={() => removeHand(i)}
                            >
                                <TileView tile={t} dora={isDora(t)} />
                            </button>
                        ))}
                        {hand.length === 0 && (
                            <span className="tile-calc-empty">패를 추가하세요</span>
                        )}
                    </div>
                </div>
                {melds.length > 0 && (
                    <div className="hand-row">
                        <span className="row-label">후로</span>
                        <div className="meld-list">
                            {melds.map((m, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className="tile-del-btn"
                                    aria-label={`후로 ${i + 1}번 제거`}
                                    onClick={() => removeMeld(i)}
                                >
                                    <MeldView meld={m} isDora={isDora} />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div className="hand-row">
                    <span className="row-label">오름패</span>
                    {winTile ? (
                        <button
                            type="button"
                            className="tile-del-btn"
                            aria-label="오름패 제거"
                            onClick={() => setWinTile(null)}
                        >
                            <TileView tile={winTile} win dora={isDora(winTile)} />
                        </button>
                    ) : (
                        <span className="tile-calc-empty">오름패를 지정하세요</span>
                    )}
                </div>
                <div className="hand-row">
                    <span className="row-label">도라표시패</span>
                    <div className="hand-tiles">
                        {dora.map((t, i) => (
                            <button
                                key={i}
                                type="button"
                                className="tile-del-btn"
                                aria-label={`도라표시 ${i + 1}번 제거`}
                                onClick={() => removeDora(i)}
                            >
                                <TileView tile={t} />
                            </button>
                        ))}
                        {dora.length === 0 && (
                            <span className="tile-calc-empty">1장 이상 필요</span>
                        )}
                    </div>
                </div>
                {riichi > 0 && (
                    <div className="hand-row">
                        <span className="row-label">뒷도라표시패</span>
                        <div className="hand-tiles">
                            {ura.map((t, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className="tile-del-btn"
                                    aria-label={`뒷도라표시 ${i + 1}번 제거`}
                                    onClick={() => removeUra(i)}
                                >
                                    <TileView tile={t} />
                                </button>
                            ))}
                            {ura.length === 0 && (
                                <span className="tile-calc-empty">없으면 비워 두세요</span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <Segmented
                label="장풍"
                value={String(roundWind)}
                options={[
                    { value: '1', label: '동' },
                    { value: '2', label: '남' },
                ]}
                onChange={(v) => setRoundWind(Number(v) as 1 | 2)}
            />
            <Segmented
                label="자풍 (동=친)"
                value={String(seatWind)}
                options={[
                    { value: '1', label: '동' },
                    { value: '2', label: '남' },
                    { value: '3', label: '서' },
                    { value: '4', label: '북' },
                ]}
                onChange={(v) => setSeatWind(Number(v) as 1 | 2 | 3 | 4)}
            />
            <Segmented
                label="화료 형태"
                value={winType}
                options={[
                    { value: 'tsumo', label: '쯔모' },
                    { value: 'ron', label: '론' },
                ]}
                onChange={setWinType}
            />
            <Segmented
                label="리치"
                value={String(riichi)}
                options={[
                    { value: '0', label: '없음' },
                    { value: '1', label: '리치', disabled: open },
                    { value: '2', label: '더블리치', disabled: open },
                ]}
                onChange={(v) => setRiichi(Number(v) as 0 | 1 | 2)}
            />
            <Segmented
                label="연장 (본장)"
                value={String(honba)}
                options={Array.from({ length: 11 }, (_, i) => ({
                    value: String(i),
                    label: `${i}본장`,
                }))}
                onChange={(v) => setHonba(Number(v))}
            />

            <div className="calc-actions">
                <button type="button" className="calc-reset" onClick={reset}>
                    ↺ 리셋
                </button>
            </div>

            {!ready && (
                <p className="calc-kotsu-empty">
                    손패 {maxHand}장·오름패·도라표시패 1장을 입력하면 계산됩니다.
                </p>
            )}
            {error && <p className="calc-warning">⚠ {error}</p>}
            {result && <ResultView result={result} dealer={seatWind === 1} winType={winType} />}
        </div>
    );
}

function ResultView({
    result: r,
    dealer,
    winType,
}: {
    result: ScoringResult;
    dealer: boolean;
    winType: 'tsumo' | 'ron';
}) {
    const showFu = r.yakumanUnits === 0 && r.han < 5;
    const headline =
        r.yakumanUnits > 0
            ? r.limitName
            : `${r.han}판` +
              (showFu ? ` ${r.fu}부` : '') +
              (r.limitName ? ` · ${r.limitName}` : '');

    return (
        <div className="answer">
            <div className="plaque">
                <div className="plaque-main">
                    {dealer ? '친' : '자'} {winType === 'tsumo' ? '쯔모' : '론'} · {headline}
                </div>
                <div className="plaque-score">{paymentText(r.payment)}</div>
            </div>

            <table className="detail-table">
                <caption>판</caption>
                <tbody>
                    {r.yaku.map((y, i) => (
                        <tr key={i} className={y.isDora ? 'dora-row-y' : ''}>
                            <td>{y.name}</td>
                            <td className="num-cell">
                                {y.yakuman ? (y.yakuman === 2 ? '더블역만' : '역만') : `${y.han}판`}
                            </td>
                        </tr>
                    ))}
                    {r.yakumanUnits === 0 && (
                        <tr className="total-row">
                            <td>합계</td>
                            <td className="num-cell">{r.han}판</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {showFu && (
                <table className="detail-table">
                    <caption>부수</caption>
                    <tbody>
                        {r.fuDetails.map((d, i) => (
                            <tr key={i} className={d.dim ? 'dim-row' : ''}>
                                <td>{d.reason}</td>
                                <td className="num-cell">{d.fu > 0 ? `${d.fu}부` : '—'}</td>
                            </tr>
                        ))}
                        <tr className="total-row">
                            <td>합계</td>
                            <td className="num-cell">{r.fu}부</td>
                        </tr>
                    </tbody>
                </table>
            )}
        </div>
    );
}
