/// <reference types="astro/client" />

/** Vite's `?inline` suffix yields a data URI string. Used for the Satori fonts. */
declare module '*.woff?inline' {
  const dataUri: string;
  export default dataUri;
}
