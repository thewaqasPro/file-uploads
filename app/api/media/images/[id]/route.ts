// app/api/media/images/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Schema for updating an image
const updateImageSchema = z.object({
  title: z.string().min(1, "Title cannot be empty.").optional(), // Title is optional for update
  categoryIds: z.array(z.number().int()).optional(), // Array of category IDs to connect
});

/**
 * Handles PATCH requests to update an image's details (title, categories).
 * @param {Request} request - The incoming request object.
 * @param {Object} context - The context object containing route parameters.
 * @param {Object} context.params - The parameters object, including 'id' for the image to update.
 * @returns {NextResponse} A JSON response containing the updated image or an error.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { params } = context; // context.params is a Promise now
  const { id } = await params; // Await the promise to get the id

  try {
    // Validate that context.params and id exist
    if (!params || !id) {
      return NextResponse.json(
        { error: "Image ID not provided in route parameters." },
        { status: 400 }
      );
    }

    // Parse image ID from URL. parseInt is synchronous, no await needed.
    const imageId = parseInt(id, 10);

    if (isNaN(imageId)) {
      return NextResponse.json(
        { error: "Invalid image ID provided." },
        { status: 400 }
      );
    }

    const body = await request.json(); // Parse request body
    const validation = updateImageSchema.safeParse(body); // Validate body

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { title, categoryIds } = validation.data;

    // Build the data object for Prisma update
    const updateData: {
      title?: string;
      categories?: {
        set?: { id: number }[]; // To replace all categories
        connect?: { id: number }[]; // To connect new categories
        disconnect?: { id: number }[]; // To disconnect old categories
      };
    } = {};

    if (title !== undefined) {
      updateData.title = title;
    }

    if (categoryIds !== undefined) {
      // Fetch the current categories of the image to determine what to connect/disconnect
      const currentImage = await prisma.image.findUnique({
        where: { id: imageId },
        include: { categories: true }, // Include categories to know current associations
      });

      if (!currentImage) {
        return NextResponse.json(
          { error: "Image not found." },
          { status: 404 }
        );
      }

      // Ensure categories are treated as ImageCategories as per your schema
      const currentCategoryIds = currentImage.categories.map((cat) => cat.id);

      // Categories to connect (newly selected that weren't previously)
      const categoriesToConnect = categoryIds
        .filter((id) => !currentCategoryIds.includes(id))
        .map((id) => ({ id }));

      // Categories to disconnect (previously associated but no longer selected)
      const categoriesToDisconnect = currentCategoryIds
        .filter((id) => !categoryIds.includes(id))
        .map((id) => ({ id }));

      // Only add to updateData if there are changes to make
      if (categoriesToConnect.length > 0 || categoriesToDisconnect.length > 0) {
        updateData.categories = {
          connect: categoriesToConnect,
          disconnect: categoriesToDisconnect,
        };
      }
    }

    // Perform the update operation
    const updatedImage = await prisma.image.update({
      where: { id: imageId },
      data: updateData,
      include: { categories: true }, // Include categories in the response
    });

    return NextResponse.json(updatedImage, { status: 200 }); // Return updated image
  } catch (error) {
    console.error("Error updating image:", error);
    return NextResponse.json(
      { error: "Failed to update image details." },
      { status: 500 }
    );
  }
}
