import type { ReactNode } from 'react';
import { Footer } from './components/footer/Footer.tsx';
import { APP_VERSION_LABEL } from './lib/version/index.ts';

interface PageFrameProps {
  children: ReactNode;
}

// Equal rows above and below the page keep it centred on the screen; the footer sits at the
// bottom of the lower row, so it never pushes the page off centre.
export const PageFrame = ({ children }: PageFrameProps) => (
  <div className="safe-area grid min-h-dvh grid-rows-[1fr_auto_1fr]">
    <main className="row-start-2 flex justify-center">{children}</main>
    <div className="row-start-3 flex items-end justify-center pt-3">
      <Footer version={APP_VERSION_LABEL} />
    </div>
  </div>
);
