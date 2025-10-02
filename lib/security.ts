import { NextRequest } from 'next/server';
import { detectBot } from '@arcjet/next';
import arcjet from '@arcjet/next';

export async function protectWithArcJet(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') {
    return { isDenied: () => false };
  }

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
