// app/api/media/categories/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // Import the Prisma client
import { z } from "zod"; // Import Zod for validation

// Schema for creating a new category
const createCategorySchema = z.object({
  name: z.string().min(1, "Category name cannot be empty."), // Category name must be a non-empty string
});

/**
 * Handles GET requests to retrieve all categories.
 * @returns {NextResponse} A JSON response containing a list of categories or an error.
 */
export async function GET() {
  try {
    // Fetch all categories from the database, ordered alphabetically by name
    const categories = await prisma.imageCategories.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories, { status: 200 }); // Return the categories with a 200 OK status
  } catch (error) {
    console.error("Error fetching categories:", error); // Log any errors
    return NextResponse.json(
      { error: "Failed to fetch categories." },
      { status: 500 } // Return a 500 Internal Server Error for unhandled exceptions
    );
  }
}

/**
 * Handles POST requests to create a new category.
 * @param {Request} request - The incoming request object containing the category name.
 * @returns {NextResponse} A JSON response containing the newly created category or an error.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json(); // Parse the request body
    const validation = createCategorySchema.safeParse(body); // Validate the body against the schema

    if (!validation.success) {
      // If validation fails, return a 400 Bad Request with validation errors
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name } = validation.data; // Extract the category name

    // Check if a category with the same name already exists to prevent duplicates
    const existingCategory = await prisma.imageCategories.findUnique({
      where: { name },
    });

    if (existingCategory) {
      // If a category with this name already exists, return a 409 Conflict status
      return NextResponse.json(
        { error: "Category with this name already exists." },
        { status: 409 }
      );
    }

    // Create the new category in the database
    const newCategory = await prisma.imageCategories.create({
      data: { name },
    });

    return NextResponse.json(newCategory, { status: 201 }); // Return the newly created category with a 201 Created status
  } catch (error) {
    console.error("Error creating category:", error); // Log any errors
    return NextResponse.json(
      { error: "Failed to create category." },
      { status: 500 } // Return a 500 Internal Server Error for unhandled exceptions
    );
  }
}
