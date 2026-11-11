import { useText } from '../../lib/i18n/index.ts';

export const LoadingStatus = () => {
  const text = useText('components.loadingStatus');
  return (
    <p role="status" className="sr-only">
      {text.loading}
    </p>
  );
};
