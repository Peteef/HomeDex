import { useText } from '../../lib/i18n/index.ts';
import { PlaceholderPage } from '../PlaceholderPage.tsx';

export const NotFoundPage = () => {
  const text = useText('notFound');
  return <PlaceholderPage title={text.title} message={text.message} homeLink />;
};
