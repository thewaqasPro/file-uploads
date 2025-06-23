// components/web/EditImageDialog.tsx
"use client";

import React, { useState, useEffect, FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// Interfaces (should match your Prisma models and API responses)
interface Category {
  id: number;
  name: string;
}

interface Image {
  id: number;
  title: string;
  s3Key: string;
  url: string;
  createdAt: string;
  categories?: Category[]; // Categories associated with this specific image
}

interface EditImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  image: Image; // The image object to be edited
  onImageUpdated: (updatedImage: Image) => void; // Callback after successful update
}

export function EditImageDialog({
  isOpen,
  onClose,
  image,
  onImageUpdated,
}: EditImageDialogProps) {
  const [editedTitle, setEditedTitle] = useState(image.title);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all categories on component mount
  useEffect(() => {
    const fetchAllCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await fetch("/api/media/categories");
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data: Category[] = await response.json();
        setAllCategories(data);

        // Initialize selected categories based on the image's current categories
        const currentImageCategoryIds =
          image.categories?.map((cat) => cat.id) || [];
        setSelectedCategoryIds(currentImageCategoryIds);
      } catch (error) {
        console.error("Error fetching all categories:", error);
        toast.error("Failed to load categories for editing.");
      } finally {
        setLoadingCategories(false);
      }
    };

    if (isOpen) {
      fetchAllCategories();
      setEditedTitle(image.title); // Reset title if dialog re-opens
    }
  }, [isOpen, image.title, image.categories]); // Dependency on image.categories to re-init if image object changes

  // Handle checkbox change for categories
  const handleCategoryChange = (categoryId: number, isChecked: boolean) => {
    setSelectedCategoryIds((prev) =>
      isChecked ? [...prev, categoryId] : prev.filter((id) => id !== categoryId)
    );
  };

  // Handle form submission to update image
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch(`/api/media/images/${image.id}`, {
        method: "PATCH", // Use PATCH for partial updates
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editedTitle,
          categoryIds: selectedCategoryIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update image.");
      }

      const updatedImage: Image = await response.json();
      onImageUpdated(updatedImage); // Call the callback to update parent state
      onClose(); // Close the dialog
      toast.success("Image details updated successfully!");
    } catch (error: any) {
      console.error("Error updating image:", error);
      toast.error(error.message || "Failed to update image.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Image Details</DialogTitle>
          <DialogDescription>
            Make changes to the image title and categories here. Click save when
            you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="col-span-3"
              disabled={isSaving}
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right mt-2">Categories</Label>
            <div className="col-span-3 grid grid-cols-2 gap-2">
              {loadingCategories ? (
                <div className="flex items-center text-muted-foreground col-span-2">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
                </div>
              ) : allCategories.length === 0 ? (
                <p className="text-muted-foreground col-span-2">
                  No categories found.
                </p>
              ) : (
                allCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`edit-category-${category.id}`}
                      checked={selectedCategoryIds.includes(category.id)}
                      onCheckedChange={(checked) =>
                        handleCategoryChange(category.id, !!checked)
                      }
                      disabled={isSaving}
                    />
                    <Label htmlFor={`edit-category-${category.id}`}>
                      {category.name}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
