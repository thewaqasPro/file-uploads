// app/api/categories/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Handles DELETE requests to remove a category by its ID.
 * @param {Request} request - The incoming request object.
 * @param {Object} context - The context object containing route parameters.
 * @param {Object} context.params - The parameters object, including 'id' for the category to delete.
 * @returns {NextResponse} A JSON response indicating success or failure.
 */
export async function DELETE(
  request: Request,
  context: { params: { id: string } } // Type definition for context with params.id
) {
  try {
    const categoryId = await parseInt(context.params.id, 10); // Parse the category ID from the URL parameters

    if (isNaN(categoryId)) {
      // If the ID is not a valid number, return a 400 Bad Request error
      return NextResponse.json(
        { error: "Invalid category ID provided." },
        { status: 400 }
      );
    }

    // Prevent deletion of the "Uncategorized" category
    const uncategorizedCategory = await prisma.imageCategories.findUnique({
      where: { name: "Uncategorized" },
    });

    if (uncategorizedCategory && uncategorizedCategory.id === categoryId) {
      return NextResponse.json(
        { error: "The 'Uncategorized' category cannot be deleted." },
        { status: 403 } // Forbidden
      );
    }

    // Before deleting the category, you might want to reassign images
    // associated with it to "Uncategorized" or handle them in another way.
    // For now, if a category is deleted, its relationship to images will be removed.
    // If you need images to always have a category, you'll need more complex logic here.
    // Prisma's default behavior for many-to-many is to just remove the join table entries.

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
