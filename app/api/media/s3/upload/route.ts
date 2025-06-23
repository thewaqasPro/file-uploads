import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3 } from "@/lib/S3Client";
import { z } from "zod";

import { prisma } from "@/lib/db"; // Import the database query function
import { title } from "process";

const uploeadRequestSchema = z.object({
  title: z.string().optional(),
  filename: z.string(),
  contentType: z.string(),
  size: z.number(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = uploeadRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { title, filename, contentType, size } = validation.data;

    const uniqueKey = `${uuidv4()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: uniqueKey,
      ContentType: contentType,
      ContentLength: size,
    });

    const presignedUrl = await getSignedUrl(S3, command, {
      expiresIn: 360, // URL expires in 6 minutes
    });

    // Construct the public URL of the uploaded image
    // Assumes S3_BUCKET_REGION is set in environment variables
    const imageUrl = `https://console-minio.waqas.pro/api/v1/buckets/${process.env.S3_BUCKET_NAME}/objects/download?preview=true&prefix=${uniqueKey}&version_id=null`;
    //1f89e214-79d4-4908-8f83-518642dff433-IMG_0791.JPG&version_id=null

    // --- New Category Logic ---
    // Find or create the "Uncategorized" category.
    // If it doesn't exist, it will be created. This ensures all new images
    // have a default category.
    const uncategorizedCategory = await prisma.imageCategories.upsert({
      // Corrected to use ImageCategories as per your schema
      where: { name: "Uncategorized" }, // Try to find by name
      update: {}, // No updates if found
      create: { name: "Uncategorized" }, // Create if not found
    });

    // Insert image metadata into the PostgreSQL database using Prisma
    // Connect the new image to the "Uncategorized" category.
    await prisma.image.create({
      data: {
        title: title || filename, // title || filename Use provided title or default to filename
        s3Key: uniqueKey, // Store the S3 object key
        url: imageUrl, // Store the public URL of the image
        categories: {
          connect: { id: uncategorizedCategory.id }, // Connect to the "Uncategorized" category by its ID
        },
      },
    });

    // Return the presigned URL and the unique S3 key to the client
    const response = {
      presignedUrl,
      key: uniqueKey,
      imageUrl, // Also return the public URL for immediate display if needed
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
