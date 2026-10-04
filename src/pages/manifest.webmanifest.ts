import type { APIRoute } from 'astro';
import { profile } from '../data/site';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: `${profile.name} — ${profile.role}`,
      short_name: profile.name,
      description: profile.description,
      start_url: '/',
      display: 'minimal-ui',
      // The light theme's `--bg` (tokens.css), as sRGB.
      background_color: '#fafaf6',
      theme_color: '#fafaf6',
      icons: [
        { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        { src: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      ],
    }),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
