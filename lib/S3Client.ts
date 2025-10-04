import "server-only";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import { env } from "./env";

// Enhanced S3 client configuration for production reliability
export const S3 = new S3Client({
    region: env.AWS_REGION || "auto",
    endpoint: env.AWS_ENDPOINT_URL_S3,
    forcePathStyle: false,
    maxAttempts: 3, // Retry failed requests up to 3 times
    retryMode: "standard",
    credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
    // Add request timeout
    requestHandler: {
        requestTimeout: 30000, // 30 seconds
    },
    // Enable SSL in production
    tls: process.env.NODE_ENV === 'production',
});

// Add a function to check S3 connectivity
export async function checkS3Connection() {
    try {
        await S3.send(new ListBucketsCommand({}));
        return { connected: true };
    } catch (error) {
        console.error('S3 Connection Error:', error);
        return { 
            connected: false, 
            error: error instanceof Error ? error.message : 'Unknown error',
            details: process.env.NODE_ENV === 'development' ? 
                { 
                    region: env.AWS_REGION,
                    endpoint: env.AWS_ENDPOINT_URL_S3,
                    nodeEnv: process.env.NODE_ENV
                } : undefined
        };
    }
}

// Add a function to test file upload
export async function testS3Upload(file: Blob, key: string) {
    try {
        const { PutObjectCommand } = await import('@aws-sdk/client-s3');
        const command = new PutObjectCommand({
            Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
            Key: `test-${Date.now()}-${key}`,
            Body: file,
            ContentType: file.type,
        });
        
        const result = await S3.send(command);
        return { success: true, result };
    } catch (error) {
        console.error('S3 Upload Test Error:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error',
            details: process.env.NODE_ENV === 'development' ? error : undefined
        };
    }
}