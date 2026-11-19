import { useText } from '../../lib/i18n/index.ts';
import { Button } from '../button/Button.tsx';

export interface LoadFailedProps {
  message: string;
  onRetry: () => void;
}

export const LoadFailed = ({ message, onRetry }: LoadFailedProps) => {
  const text = useText('common.actions');

  return (
    <div className="flex flex-col items-start gap-3">
      <p role="alert" className="text-dex-red-text text-base font-bold">
        {message}
      </p>
      <Button variant="secondary" onClick={onRetry}>
        {text.tryAgain}
      </Button>
    </div>
  );
};
