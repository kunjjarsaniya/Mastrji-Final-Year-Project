import { env } from "@/lib/env";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3 } from "@/lib/S3Client";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";
import { requireAdmin } from "@/app/data/admin/require-admin";

export const fileUploadSchema = z.object({
    fileName: z.string().min(1, { message: "Filename is required" }),
    contentType: z.string().min(1, { message: "Content type is required" }),
    size: z.number().min(1, { message: "Size is required" }),
    isImage: z.boolean(),
});




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



export async function POST(request: Request) {
    const session = await requireAdmin();
    try {
        const decision = await aj.protect(request, {
            fingerprint: session?.user.id as string
        });

        if (decision.isDenied()) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            );
        }

        const body = await request.json();
        const validation = fileUploadSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            );
        }

        const { fileName, contentType, size } = validation.data;
        const fileExtension = fileName.split('.').pop() || '';
        const uniqueKey = `${uuidv4()}.${fileExtension}`;

        // Generate a pre-signed URL for direct upload to S3
        const command = new PutObjectCommand({
            Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
            ContentType: contentType,
            ContentLength: size,
            Key: uniqueKey,
            ACL: 'public-read', // Make the file publicly accessible
        });

        const presignedUrl = await getSignedUrl(S3, command, {
            expiresIn: 3600, // 1 hour
        });

        const response = {
            presignedUrl,
            key: uniqueKey,
            bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
            region: env.AWS_REGION
        };

        return NextResponse.json(response);
    } catch {
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}