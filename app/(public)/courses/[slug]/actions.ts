"use server";

import { ApiResponse } from "@/lib/types";
import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";

const aj = arcjet.withRule(
    fixedWindow({
        mode: "LIVE",
        window: "1m",
        max: 5,
    })
);

export async function enrollInCourseAction(courseId: string): Promise<ApiResponse> {
    const user = await requireUser();

    try {
        const req = await request();
        const decision = await aj.protect(req, {
            fingerprint: user.id,
        });

        if (decision.isDenied()) {
            throw new Error("You have been blocked due to too many requests. Please try again later.");
        }

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

        if (!course) {
            throw new Error("Course not found");
        }

        const transactionResult = await prisma.$transaction(async (tx) => {
            // Create a fresh customer
            const freshCustomer = await stripe.customers.create({
                email: user.email,
                name: user.name || '',
                metadata: { userId: user.id },
            });

            // Update database with new customer ID
            await tx.user.update({
                where: { id: user.id },
                data: { stripeCustomerId: freshCustomer.id },
            });

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
                const lineItems = [{
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: currentCourse.title,
                        },
                        unit_amount: currentCourse.price,
                    },
                    quantity: 1,
                }];

                const checkoutSession = await stripe.checkout.sessions.create({
                    customer: freshCustomer.id,
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
        // Log error for debugging
        console.error('[Enrollment Error] Enrollment failed:', error);

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
            }
        }

        return {
            status: "error",
            message: errorMessage,
        };
    }
}

