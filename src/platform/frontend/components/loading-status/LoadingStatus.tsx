import { useText } from '../../lib/i18n/index.ts';

export const LoadingStatus = () => {
  const text = useText('components.loadingStatus');
  return (
    <p
      role="status"
      className="text-dex-ink-muted motion-safe:animate-appear py-6 text-center text-base font-bold"
    >
      {text.loading}
    </p>
  );
};
