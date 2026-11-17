import { useText } from '../../lib/i18n/index.ts';

export interface FooterProps {
  version: string;
}

// The cream glow keeps the text readable on any part of the scene without a panel behind it.
export const Footer = ({ version }: FooterProps) => {
  const text = useText('components.footer');
  return (
    <footer className="text-dex-ink-muted text-center text-xs text-shadow-[0_0_2px_var(--color-dex-paper),0_0_6px_var(--color-dex-paper),0_0_10px_var(--color-dex-paper)]">
      {text.credit({ version })}
    </footer>
  );
};
