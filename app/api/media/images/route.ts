// app/api/media/images/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // Import the Prisma client

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Parse limit and offset from query parameters.
    // Default limit to 15 images per load, and offset to 0 (start from the beginning).
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Fetch images from the database with pagination
    const images = await prisma.image.findMany({
      select: {
        id: true,
        title: true,
        s3Key: true,
        url: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc", // Order by creation date, newest first
      },
      take: limit, // Limit the number of records returned
      skip: offset, // Skip records to get the next set for pagination
    });

    // To determine if there are more images to load, we can try to fetch one more than the limit.
    // This is a common pattern to avoid making an extra count query for large tables.
    // However, for simplicity with offset/limit, we'll assume the client manages this
    // by checking if the number of returned images is less than the requested limit.
    // A more robust solution might involve returning a 'hasMore' boolean from the server,
    // or simply comparing `images.length` with `limit` on the client.

    // For now, we'll return the images. The client will infer if more are available.
    return NextResponse.json(images, { status: 200 });
  } catch (error) {
    console.error("Error fetching images:", error); // Log the full error
    // Return a 500 Internal Server Error response for any unhandled exceptions
    return NextResponse.json(
      { error: "Failed to fetch images." },
      { status: 500 }
    );
  }
}
