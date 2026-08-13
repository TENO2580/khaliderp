import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tripidio ERP',
    short_name: 'Tripidio',
    description: 'Tripidio Enterprise Resource Planning',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#080810',
    theme_color: '#080810',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
