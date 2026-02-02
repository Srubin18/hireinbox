import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/hire/recruiter/',
          '/hire/agency/',
          '/candidates/scan/',
          '/candidates/create/',
          '/candidates/video-upload/',
          '/company/',
        ],
      },
    ],
    sitemap: 'https://hireinbox.co.za/sitemap.xml',
  };
}
