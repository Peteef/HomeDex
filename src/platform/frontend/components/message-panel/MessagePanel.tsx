import type { ReactNode } from 'react';
import { Panel } from '../panel/Panel.tsx';
import { Wordmark } from '../wordmark/Wordmark.tsx';

export interface MessagePanelProps {
  title: string;
  message: string;
  children?: ReactNode;
}

export const MessagePanel = ({ title, message, children }: MessagePanelProps) => (
  <Panel className="flex flex-col gap-3">
    <Wordmark />
    <h1 className="text-3xl font-extrabold">{title}</h1>
    <p className="text-dex-ink-muted text-base">{message}</p>
    {children}
  </Panel>
);
