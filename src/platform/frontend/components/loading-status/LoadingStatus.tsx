import { useTranslation } from 'react-i18next';

export const LoadingStatus = () => {
  const { t } = useTranslation();
  return (
    <p role="status" className="sr-only">
      {t('status.loading')}
    </p>
  );
};
