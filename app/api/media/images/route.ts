// app/api/images/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // Import the Prisma client

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Parse limit and offset from query parameters.
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    // Parse optional categoryId for filtering
    const categoryId = searchParams.get("categoryId");

    // Define the WHERE clause for the Prisma query
    const whereClause: any = {};

    if (categoryId) {
      const parsedCategoryId = parseInt(categoryId, 10);
      if (!isNaN(parsedCategoryId)) {
        whereClause.categories = {
          some: {
            id: parsedCategoryId, // Filter images that belong to this category
          },
        };
      }
    }

    // Fetch images from the database with pagination and optional category filter
    const images = await prisma.image.findMany({
      select: {
        id: true,
        title: true,
        s3Key: true,
        url: true,
        createdAt: true,
        // Include categories for the image in the response, especially for the standalone page
        categories: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      where: whereClause, // Apply the category filter if present
      orderBy: {
        createdAt: "desc", // Order by creation date, newest first
      },
      take: limit, // Limit the number of records returned
      skip: offset, // Skip records to get the next set for pagination
    });

    return NextResponse.json(images, { status: 200 });
  } catch (error) {
    console.error("Error fetching images:", error); // Log the full error
    return NextResponse.json(
      { error: "Failed to fetch images." },
      { status: 500 }
    );
  }
}
