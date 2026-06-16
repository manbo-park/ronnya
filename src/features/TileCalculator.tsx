import { useState } from 'react';
import { scoreHand } from '../core/score';
import { nextDoraId, sortTiles, tileId } from '../core/tiles';
import { paymentText } from '../core/points';
import type { Problem, ScoringResult, Suit, Tile } from '../core/types';
import { TilePicker, TileView } from '../components/Tiles';
import { Segmented } from './Calculator';

type Slot = 'hand' | 'win' | 'dora' | 'ura';

const MAX_HAND = 13; // 후로 미지원(v1): 멘젠 손패 13장 + 오름패 1장 = 14장

export function TileCalculator() {
    const [hand, setHand] = useState<Tile[]>([]);
    const [winTile, setWinTile] = useState<Tile | null>(null);
    const [dora, setDora] = useState<Tile[]>([]);
    const [ura, setUra] = useState<Tile[]>([]);
    const [target, setTarget] = useState<Slot>('hand');

    const [roundWind, setRoundWind] = useState<1 | 2>(1);
    const [seatWind, setSeatWind] = useState<1 | 2 | 3 | 4>(1);
    const [winType, setWinType] = useState<'tsumo' | 'ron'>('ron');
    const [riichi, setRiichi] = useState<0 | 1 | 2>(0);
    const [honba, setHonba] = useState(0);

    // 같은 패의 전역 사용 매수(손패+오름패+도라표시+뒷도라표시)
    const usedCount = (id: number) => {
        let n = 0;
        for (const t of hand) if (tileId(t) === id) n++;
        if (winTile && tileId(winTile) === id) n++;
        for (const t of dora) if (tileId(t) === id) n++;
        for (const t of ura) if (tileId(t) === id) n++;
        return n;
    };

    const pick = (t: Tile) => {
        if (target === 'hand') {
            if (hand.length >= MAX_HAND) return;
            setHand((h) => sortTiles([...h, t]));
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
        setWinTile(null);
        setDora([]);
        setUra([]);
        setTarget('hand');
        setRoundWind(1);
        setSeatWind(1);
        setWinType('ron');
        setRiichi(0);
        setHonba(0);
    };

    const removeHand = (i: number) => setHand((h) => h.filter((_, idx) => idx !== i));
    const removeDora = (i: number) => setDora((d) => d.filter((_, idx) => idx !== i));
    const removeUra = (i: number) => setUra((u) => u.filter((_, idx) => idx !== i));

    // 도라표시패(+리치 시 뒷도라표시패)가 가리키는 패에 광택을 줄 id 집합
    const doraIds = new Set<number>();
    for (const ind of dora) doraIds.add(nextDoraId(tileId(ind)));
    if (riichi > 0) for (const ind of ura) doraIds.add(nextDoraId(tileId(ind)));
    const isDora = (t: Tile) => doraIds.has(tileId(t));

    const ready = hand.length === MAX_HAND && winTile !== null && dora.length >= 1;

    let result: ScoringResult | null = null;
    let error: string | null = null;
    if (ready) {
        const p: Problem = {
            hand,
            melds: [],
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

    // 적도라는 수트당 1장뿐
    const redUsed = (suit: Suit) =>
        [...hand, ...(winTile ? [winTile] : []), ...dora, ...ura].some(
            (t) => t.suit === suit && t.red,
        );

    // 어느 슬롯에 채워 넣는 중인지에 따라 매수 제한을 다르게 본다(표시패도 패산에서 ≤4)
    const pickerDisabled = (t: Tile) => {
        if (target === 'hand' && hand.length >= MAX_HAND) return true;
        if (t.red && redUsed(t.suit)) return true;
        return usedCount(tileId(t)) >= 4;
    };

    return (
        <div className="calc-content tile-calc">
            <Segmented
                label="입력 대상"
                value={target}
                options={[
                    { value: 'hand', label: `손패 ${hand.length}/${MAX_HAND}` },
                    { value: 'win', label: '오름패' },
                    { value: 'dora', label: `도라 ${dora.length}` },
                    {
                        value: 'ura',
                        label: `뒷도라 ${ura.length}`,
                        disabled: riichi === 0,
                    },
                ]}
                onChange={setTarget}
            />

            <TilePicker onPick={pick} disabled={pickerDisabled} />

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
                    { value: '1', label: '리치' },
                    { value: '2', label: '더블리치' },
                ]}
                onChange={(v) => setRiichi(Number(v) as 0 | 1 | 2)}
            />
            <Segmented
                label="연장 (본장)"
                value={String(honba)}
                options={Array.from({ length: 6 }, (_, i) => ({
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
                    손패 13장·오름패·도라표시 1장을 입력하면 계산됩니다.
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
