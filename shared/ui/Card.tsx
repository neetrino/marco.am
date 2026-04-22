'use client';

import React, { HTMLAttributes, forwardRef, ReactElement } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card({ className = '', children, ...props }, ref): ReactElement {
    return (
      <div
        ref={ref}
        className={`rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,16,16,0.04)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_8px_24px_rgba(0,0,0,0.28)] ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

