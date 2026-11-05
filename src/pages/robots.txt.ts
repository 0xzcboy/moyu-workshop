import type { APIRoute } from 'astro';
import { url } from '../lib/site';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(url('sitemap.xml'), site || 'https://lab.myapi.pw').href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
