import { TriangleAlert } from 'lucide-react';
import { useText } from '../../locales/index.ts';

export type Urgency = 'overdue' | 'today' | 'soon' | 'later';

export interface UrgencyLabelProps {
  urgency: Urgency;
  daysUntil: number;
}

const URGENCY_CLASSES: Record<Urgency, string> = {
  overdue: 'bg-dex-red-soft text-dex-red-text rounded-full px-2 py-0.5 font-extrabold',
  today: 'bg-dex-amber-soft text-dex-amber-text rounded-full px-2 py-0.5 font-extrabold',
  soon: 'text-dex-amber-text font-bold',
  later: 'text-dex-green-text font-bold',
};

const TOMORROW = 1;

export const UrgencyLabel = ({ urgency, daysUntil }: UrgencyLabelProps) => {
  const text = useText('components.urgencyLabel');

  const label = () => {
    if (urgency === 'overdue') {
      return text.overdue({ count: -daysUntil });
    }

    if (urgency === 'today') {
      return text.today;
    }

    return daysUntil === TOMORROW ? text.tomorrow : text.inDays({ count: daysUntil });
  };

  return (
    <span className={`inline-flex items-center gap-1 text-sm ${URGENCY_CLASSES[urgency]}`}>
      {urgency === 'overdue' ? <TriangleAlert size={16} aria-hidden /> : null}
      {label()}
    </span>
  );
};
