import { Button, IconButton } from '#platform/frontend';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useText } from '../../../locales/index.ts';

export interface MonthHeaderProps {
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export const MonthHeader = ({
  title,
  canGoBack,
  canGoForward,
  onPrevious,
  onNext,
  onToday,
}: MonthHeaderProps) => {
  const text = useText('calendar.monthHeader');

  return (
    <div className="flex items-center gap-2">
      <h3 aria-live="polite" className="flex-1 text-xl font-extrabold first-letter:uppercase">
        {title}
      </h3>
      <Button variant="secondary" onClick={onToday}>
        {text.today}
      </Button>
      <IconButton
        icon={<ChevronLeft size={20} aria-hidden />}
        label={text.previous}
        disabled={!canGoBack}
        onClick={onPrevious}
      />
      <IconButton
        icon={<ChevronRight size={20} aria-hidden />}
        label={text.next}
        disabled={!canGoForward}
        onClick={onNext}
      />
    </div>
  );
};
