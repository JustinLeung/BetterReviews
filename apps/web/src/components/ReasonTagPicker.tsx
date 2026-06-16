import type { ReasonSentiment, ReasonTag } from '@betterreviews/shared';

const SENTIMENT_ORDER: ReasonSentiment[] = ['positive', 'neutral', 'negative'];
const SENTIMENT_LABEL: Record<ReasonSentiment, string> = {
  positive: 'What was good',
  neutral: 'Worth knowing',
  negative: 'Heads up',
};

/**
 * Optional, clickable reason tags grouped by sentiment. Selection is controlled
 * by the parent.
 */
export function ReasonTagPicker({
  reasonTags,
  selected,
  onToggle,
}: {
  reasonTags: ReasonTag[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const groups = SENTIMENT_ORDER.map((sentiment) => ({
    sentiment,
    tags: reasonTags.filter((t) => t.sentiment === sentiment),
  })).filter((g) => g.tags.length > 0);

  return (
    <div className="tag-picker">
      {groups.map((group) => (
        <div key={group.sentiment} className="tag-picker__group">
          <span className="tag-picker__group-label">{SENTIMENT_LABEL[group.sentiment]}</span>
          <div className="tag-picker__chips">
            {group.tags.map((tag) => {
              const isSelected = selected.has(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  className={`chip chip--${tag.sentiment} ${isSelected ? 'is-selected' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => onToggle(tag.id)}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
