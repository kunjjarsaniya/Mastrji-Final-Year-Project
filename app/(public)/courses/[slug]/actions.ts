"use server";

import { ApiResponse } from "@/lib/types";
import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { User } from "@/lib/types/user";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";

// Rate limiting configuration
const rateLimit = fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5
});

const aj = arcjet.withRule(rateLimit);

export async function enrollInCourseAction(courseId: string): Promise<ApiResponse> {
    console.log('[Enrollment] Starting enrollment process for course:', courseId);
    const user = await requireUser() as User;
    console.log('[Enrollment] User:', { id: user.id, email: user.email });

    try {
        const req = await request();
        const decision = await aj.protect(req, {
            fingerprint: user.id,
        });

        if (decision.isDenied()) {
            throw new Error("You have been blocked due to too many requests. Please try again later.");
        }

        console.log('[Enrollment] Fetching course details for:', courseId);
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                title: true,
                price: true,
                slug: true,
                stripePriceId: true,
            },
        });
        console.log('[Enrollment] Course details:', JSON.stringify(course, null, 2));

        if (!course) {
            console.error('[Enrollment] Course not found:', courseId);
            throw new Error("Course not found");
        }

        const transactionResult = await prisma.$transaction(async (tx) => {
            // Create or get Stripe customer
        console.log('[Enrollment] Creating/updating Stripe customer');
        let customerId = user.stripeCustomerId;
        
        if (!customerId) {
            console.log('[Enrollment] No existing Stripe customer, creating new one');
            const freshCustomer = await stripe.customers.create({
                email: user.email,
                name: user.name || '',
                metadata: { userId: user.id },
            });
            customerId = freshCustomer.id;
            console.log('[Enrollment] Created new Stripe customer:', customerId);
        } else {
            console.log('[Enrollment] Using existing Stripe customer:', customerId);
        }

            // Update database with customer ID if it was just created
            if (!user.stripeCustomerId) {
                console.log('[Enrollment] Updating user with new Stripe customer ID');
                await tx.user.update({
                    where: { id: user.id },
                    data: { stripeCustomerId: customerId },
                });
            }

            // Get fresh course data inside transaction
            const currentCourse = await tx.course.findUnique({
                where: { id: courseId },
                select: {
                    id: true,
                    title: true,
                    price: true,
                    stripePriceId: true,
                    slug: true,
                }
            });

            if (!currentCourse) {
                throw new Error('Course not found');
            }

            // Check for existing enrollment
            const existingEnrollment = await tx.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: user.id,
                        courseId: courseId,
                    },
                },
                select: {
                    status: true,
                    id: true,
                }
            });

            if (existingEnrollment?.status === "Active") {
                throw new Error("You are already enrolled in this course");
            }

            // Create or update enrollment
            const enrollment = existingEnrollment
                ? await tx.enrollment.update({
                      where: { id: existingEnrollment.id },
                      data: {
                          amount: currentCourse.price,
                          status: "Pending",
                          updatedAt: new Date(),
                      },
                  })
                : await tx.enrollment.create({
                      data: {
                          userId: user.id,
                          courseId: courseId,
                          amount: currentCourse.price,
                          status: "Pending",
                      },
                  });

            // Create checkout session
            try {
                console.log('[Enrollment] Creating checkout session with course:', {
                    courseId: currentCourse.id,
                    courseTitle: currentCourse.title,
                    price: currentCourse.price,
                    stripePriceId: currentCourse.stripePriceId,
                    hasStripePriceId: !!currentCourse.stripePriceId
                });

                if (!currentCourse.stripePriceId) {
                    console.error('[Enrollment] No stripePriceId found for course:', currentCourse.id);
                    throw new Error('Course is not properly configured for payments');
                }

                const lineItems = [{
                    price: currentCourse.stripePriceId,
                    quantity: 1,
                }];

                console.log('[Enrollment] Creating Stripe checkout session');
                const checkoutSession = await stripe.checkout.sessions.create({
                    customer: customerId,
                    line_items: lineItems,
                    mode: 'payment',
                    success_url: `${env.BETTER_AUTH_URL}/payment/success`,
                    cancel_url: `${env.BETTER_AUTH_URL}/payment/cancel`,
                    metadata: {
                        userId: user.id,
                        courseId: courseId,
                        enrollmentId: enrollment.id,
                        coursePrice: currentCourse.price.toString(),
                    },
                });

                if (!checkoutSession.url) {
                    throw new Error('Checkout session created but no URL available');
                }

                return {
                    enrollment: enrollment,
                    checkoutUrl: checkoutSession.url,
                };
            } catch (error) {
                console.error('[Enrollment Error] Error creating checkout session:', error);
                throw new Error('Failed to create checkout session');
            }
        }, { timeout: 30000 });

        if (!transactionResult?.checkoutUrl) {
            throw new Error('Failed to generate checkout URL');
        }

        // This will be caught by Next.js and handled as a redirect
        redirect(transactionResult.checkoutUrl);

    } catch (error) {
        // Log detailed error information
        console.error('[Enrollment Error] Full error:', JSON.stringify(error, null, 2));
        
        if (error instanceof Error) {
            console.error('[Enrollment Error] Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                ...(error as any).response?.data && { responseData: (error as any).response.data },
                ...(error as any).code && { code: (error as any).code },
                ...(error as any).type && { type: (error as any).type },
                ...(error as any).raw && { raw: (error as any).raw },
            });
        }

        // Don't catch NEXT_REDIRECT errors - let them bubble up for Next.js to handle
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error;
        }

        let errorMessage = 'Failed to enroll in course';
        if (error instanceof Error) {
            if (error.message.includes("blocked") || error.message.includes("too many requests")) {
                errorMessage = error.message;
            } else if (error.message.includes("Course not found")) {
                errorMessage = "The requested course could not be found.";
            } else if (error.message.includes("already enrolled")) {
                errorMessage = "You are already enrolled in this course.";
            } else if (error.message.includes("checkout session")) {
                errorMessage = "There was an issue creating your checkout session. Please try again.";
            } else if ('code' in error) {
                // Handle Stripe-specific errors
                const stripeError = error as { code?: string; type?: string; };
                if (stripeError.code === 'resource_missing') {
                    errorMessage = "Payment configuration is incomplete. Please contact support.";
                } else if (stripeError.type === 'StripeCardError') {
                    errorMessage = "Your card was declined. Please try a different payment method.";
                } else if (stripeError.code === 'api_key_expired') {
                    errorMessage = "Payment service configuration error. Please contact support.";
                }
            }
        }

        return {
            status: "error",
            message: errorMessage,
        };
    }
}

