import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { S3 } from "@/lib/S3Client";
import { prisma } from "@/lib/db"; // Import the Prisma client
import { z } from "zod";

// Define the schema for the delete request body using Zod
const deleteRequestSchema = z.object({
  key: z.string(), // The S3 key of the file to be deleted
});

export async function DELETE(request: Request) {
  try {
    const body = await request.json(); // Parse the request body as JSON
    const validation = deleteRequestSchema.safeParse(body); // Validate the body against the schema

    if (!validation.success) {
      // If validation fails, return a 400 Bad Request response with error details
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { key } = validation.data; // Extract the S3 key from the validated data

    // 1. Delete record from PostgreSQL database using Prisma
    // This ensures that even if S3 deletion fails, the DB record is removed first
    // Or if DB deletion fails, S3 still has the file.
    // Consider transaction management if strict consistency is required.
    const deletedImage = await prisma.image.delete({
      where: { s3Key: key }, // Find the image by its S3 key
    });

    if (!deletedImage) {
      // If no record was found and deleted, it's likely already gone or invalid key
      return NextResponse.json(
        { error: "Image not found in database or already deleted." },
        { status: 404 }
      );
    }

    // 2. Delete object from S3 bucket
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME, // S3 bucket name from environment variables
      Key: key, // The S3 key of the object to delete
    });
    await S3.send(command); // Send the delete command to S3

    // Return a success response
    return NextResponse.json(
      { message: "File deleted successfully from S3 and database." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting file:", error); // Log the full error
    // Return a 500 Internal Server Error response for any unhandled exceptions
    return NextResponse.json(
      { error: "Failed to delete file." },
      { status: 500 }
    );
  }
}
