# Week 6 Report - Payments & Enrollment

## Weekly Work Done:
- Wired Stripe SDK (`lib/stripe.ts`) and webhook (`app/api/webhook/stripe/route.ts`)
- On `checkout.session.completed`, verified signature and activated enrollment
- Allowlisted Stripe webhook category in middleware bot detection
- Added payment success and cancel routes

## Work Planned for the Next Week:
- Finalize checkout trigger from course detail page
- Harden error handling and monitoring around payments