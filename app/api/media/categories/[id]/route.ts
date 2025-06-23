// app/api/media/categories/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Handles DELETE requests to remove a category by its ID.
 * @param {Request} request - The incoming request object.
 * @param {Object} params - The object containing route parameters.
 * @param {string} params.id - The ID of the category to delete.
 * @returns {NextResponse} A JSON response indicating success or failure.
 */

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { params } = context; // context.params is a Promise now
  const { id } = await params; // Await the promise to get the id

  try {
    // Validate that params.id exists
    // The inline type already ensures `params` and `params.id` are defined,
    // but a runtime check adds robustness against unexpected scenarios.
    if (!id) {
      return NextResponse.json(
        { error: "Category ID not provided in route parameters." },
        { status: 400 }
      );
    }

    const categoryId = parseInt(id, 10); // Parse the category ID from the URL parameters

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
