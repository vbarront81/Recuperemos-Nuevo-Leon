'use client';

import type { CSSProperties, ReactNode } from 'react';

export function ConfirmSubmitButton({ children, message, className, style }: {
  children: ReactNode;
  message: string;
  className?: string;
  style?: CSSProperties;
}) {
  return <button type="submit" className={className} style={style} onClick={(event) => {
    if (!window.confirm(message)) event.preventDefault();
  }}>{children}</button>;
}
