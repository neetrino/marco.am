/// <reference types="react" />
/// <reference types="react-dom" />

// JSON module declarations
declare module '*.json' {
  const value: unknown;
  export default value;
}

declare global {
  interface Window {
    /** Set during admin product edit to defer variant → form conversion. */
    __productVariantsToConvert?: unknown;
    __productAttributeIds?: string[];
  }
}

export {};

