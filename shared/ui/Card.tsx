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
        className={`rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,16,16,0.04)] ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

