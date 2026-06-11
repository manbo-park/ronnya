import { TileView } from '../components/Tiles';
import { YAKU, type YakuDef } from '../core/yakuData';

function groupLabel(y: YakuDef): string {
    if (y.yakuman === 2) return '더블역만';
    if (y.yakuman === 1) return '역만';
    return `${y.han}판`;
}

export function YakuList() {
    // 판수(역만 단위 포함) 오름차순 정렬
    const sorted = [...YAKU].sort((a, b) => a.han - b.han);

    const groups: { key: string; items: YakuDef[] }[] = [];
    for (const y of sorted) {
        const key = groupLabel(y);
        const g = groups.find((x) => x.key === key);
        if (g) g.items.push(y);
        else groups.push({ key, items: [y] });
    }

    return (
        <div className="yaku-list">
            {groups.map((g) => (
                <section key={g.key} className="yaku-group">
                    <h2 className="yaku-group-title">{g.key}</h2>
                    {g.items.map((y) => (
                        <article key={y.name} className="yaku-card">
                            <div className="yaku-head">
                                <span className="yaku-name">{y.name}</span>
                                <span className="yaku-tags">
                                    {y.yakuman === 0 && (
                                        <span className="ytag ytag-han">{`${y.han}판`}</span>
                                    )}
                                    {y.closedOnly && (
                                        <span className="ytag ytag-closed">멘젠 한정</span>
                                    )}
                                    {y.openMinus > 0 && (
                                        <span className="ytag ytag-open">{`후로 시 -${y.openMinus}판`}</span>
                                    )}
                                </span>
                            </div>
                            <p className="yaku-desc">{y.desc}</p>
                            <div className="yaku-example">
                                {y.example.map((t, i) => (
                                    <TileView key={i} tile={t} />
                                ))}
                            </div>
                        </article>
                    ))}
                </section>
            ))}
        </div>
    );
}
