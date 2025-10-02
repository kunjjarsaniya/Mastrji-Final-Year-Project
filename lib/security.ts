import { NextRequest } from 'next/server';

// Lightweight bot detection for common bots
const ALLOWED_BOTS = [
  'googlebot', 'bingbot', 'slurp', 'duckduckbot',
  'baiduspider', 'yandexbot', 'facebot', 'ia_archiver'
] as const;

function isBotAllowed(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return ALLOWED_BOTS.some((bot: string) => ua.includes(bot));
}

export async function protectWithArcJet(request: NextRequest) {
  // Skip in development
  if (process.env.NODE_ENV !== 'production') {
    return { isDenied: () => false };
  }

  // Skip for allowed bots
  const userAgent = request.headers.get('user-agent');
  if (isBotAllowed(userAgent)) {
    return { isDenied: () => false };
  }

  // Only load ArcJet if absolutely necessary
  const { detectBot } = await import('@arcjet/next');
  const arcjet = (await import('@arcjet/next')).default;

  const aj = arcjet({
    key: process.env.ARCJET_KEY!,
    rules: [
      detectBot({
        mode: 'LIVE',
        allow: [
          'CATEGORY:SEARCH_ENGINE',
          'CATEGORY:MONITOR',
          'STRIPE_WEBHOOK'
        ]
      })
    ]
  });

  return aj.protect(request);
}
