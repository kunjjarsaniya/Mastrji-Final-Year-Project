"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { request } from "@arcjet/next";






const aj = arcjet.withRule(
  detectBot({
    mode: "LIVE",
    allow: [],
  })
).withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

export async function deleteCourse(courseId: string): Promise<ApiResponse> {
  const session = await requireAdmin();

  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: session.user.id,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return {
          status: "error",
          message: "You have been blocked due to rate limiting",
        };
      }
      return {
        status: "error",
        message: "Access denied",
      };
    }

    await prisma.course.delete({
      where: {
        id: courseId,
      },
    });

    revalidatePath("/admin/courses");

    return {
      status: "success",
      message: "Course deleted successfully",
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      message: "Failed to delete Course!",
    };
  }
}