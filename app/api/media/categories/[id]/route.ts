// app/api/categories/[id]/route.ts (This should be in your app/api/media/categories/[id]/route.ts path)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Define a more flexible context interface for route handlers
// This helps to accommodate potential slight variations in how Next.js
// infers the `params` object in complex or nested route structures.
interface RouteContext {
  params: {
    [key: string]: string | string[] | undefined; // Allows for any string key, accommodating potential extra params
    id: string; // Explicitly ensures the 'id' parameter is present as a string
  };
}

/**
 * Handles DELETE requests to remove a category by its ID.
 * @param {Request} request - The incoming request object.
 * @param {RouteContext} context - The context object containing route parameters.
 * @returns {NextResponse} A JSON response indicating success or failure.
 */
export async function DELETE(
  request: Request,
  context: RouteContext // Use the more flexible RouteContext type
) {
  try {
    // Validate that context.params and context.params.id exist
    if (!context.params || !context.params.id) {
      return NextResponse.json(
        { error: "Category ID not provided in route parameters." },
        { status: 400 }
      );
    }

    const categoryId = parseInt(context.params.id, 10); // Parse the category ID from the URL parameters

    if (isNaN(categoryId)) {
      // If the ID is not a valid number, return a 400 Bad Request error
      return NextResponse.json(
        { error: "Invalid category ID provided." },
        { status: 400 }
      );
    }

    // Prevent deletion of the "Uncategorized" category
    // Ensure `prisma.imageCategories` is the correct model name as per your schema.
    const uncategorizedCategory = await prisma.imageCategories.findUnique({
      where: { name: "Uncategorized" },
    });

    if (uncategorizedCategory && uncategorizedCategory.id === categoryId) {
      return NextResponse.json(
        { error: "The 'Uncategorized' category cannot be deleted." },
        { status: 403 } // Forbidden
      );
    }

    // Delete the category from the database
    const deletedCategory = await prisma.imageCategories.delete({
      where: { id: categoryId }, // Delete category by ID
    });

    if (!deletedCategory) {
      // If no category was found with the given ID, return a 404 Not Found error
      return NextResponse.json(
        { error: "Category not found or already deleted." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Category deleted successfully." },
      { status: 200 } // Return a 200 OK status on successful deletion
    );
  } catch (error) {
    console.error("Error deleting category:", error); // Log any errors
    // Return a 500 Internal Server Error for unhandled exceptions
    return NextResponse.json(
      { error: "Failed to delete category." },
      { status: 500 }
    );
  }
}
