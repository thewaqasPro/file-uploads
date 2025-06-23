// components/web/MediaLibrary.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Loader2, Trash2, Image as ImageIcon, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EditImageDialog } from "./EditImageDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"; // Assuming you have these shadcn/ui Select components

// Define the interface for an image object received from the API
interface Category {
  id: number;
  name: string;
}

interface Image {
  id: number;
  title: string;
  s3Key: string;
  url: string;
  createdAt: string; // ISO 8601 string
  categories?: Category[]; // Include categories, as we will fetch them
}

// Props for the MediaLibrary component
interface MediaLibraryProps {
  isOpen?: boolean;
  onClose?: () => void;
  onImageSelect: (imageUrl: string) => void;
  isStandalone?: boolean;
}

const IMAGES_PER_LOAD = 15;

export function MediaLibrary({
  isOpen = false,
  onClose = () => {},
  onImageSelect,
  isStandalone = false,
}: MediaLibraryProps) {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // States for image editing functionality
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [imageToEdit, setImageToEdit] = useState<Image | null>(null);

  // States for category filtering
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  ); // Storing as string to match Select component value
  const [fetchingCategories, setFetchingCategories] = useState(true);

  // Function to fetch all categories
  const fetchAllCategories = useCallback(async () => {
    setFetchingCategories(true);
    try {
      const response = await fetch("/api/media/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data: Category[] = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories for filter:", error);
      toast.error("Failed to load categories for filtering.");
    } finally {
      setFetchingCategories(false);
    }
  }, []);

  // Function to fetch images from the API with pagination and filter
  const fetchImages = useCallback(
    async (
      currentOffset: number,
      append: boolean = true,
      categoryFilterId: string | null
    ) => {
      setLoading(true);
      try {
        let url = `/api/media/images?limit=${IMAGES_PER_LOAD}&offset=${currentOffset}`;
        if (categoryFilterId && categoryFilterId !== "all") {
          url += `&categoryId=${categoryFilterId}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch images");
        }
        const data: Image[] = await response.json();

        if (append) {
          setImages((prevImages) => [...prevImages, ...data]);
        } else {
          setImages(data);
        }

        setHasMore(data.length === IMAGES_PER_LOAD);
        setOffset(currentOffset + data.length);
      } catch (error) {
        console.error("Error fetching images:", error);
        toast.error("Failed to load media library.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Effect hook to fetch initial images and categories when the dialog opens or component mounts
  useEffect(() => {
    if (isStandalone || isOpen) {
      fetchAllCategories(); // Fetch all categories
      // Reset state and fetch initial images based on selected category (or 'all')
      setImages([]);
      setOffset(0);
      setHasMore(true);
      fetchImages(0, false, selectedCategoryId); // Initial fetch
    }
  }, [
    isStandalone,
    isOpen,
    fetchImages,
    fetchAllCategories,
    selectedCategoryId,
  ]); // Added selectedCategoryId to dependencies

  // Handle category filter change
  const handleCategoryFilterChange = (value: string) => {
    setSelectedCategoryId(value);
    // Reset images and offset when filter changes, then re-fetch
    setImages([]);
    setOffset(0);
    setHasMore(true);
    fetchImages(0, false, value);
  };

  // Function to handle image deletion
  const handleDeleteImage = async (imageId: number, s3Key: string) => {
    setDeletingImageId(imageId);
    try {
      const response = await fetch("/api/media/s3/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: s3Key }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      setImages((prevImages) => prevImages.filter((img) => img.id !== imageId));
      toast.success("Image deleted successfully.");
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image.");
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleLoadMore = () => {
    fetchImages(offset, true, selectedCategoryId); // Load more with current filter
  };

  // Function to open the edit dialog
  const handleEditClick = (image: Image) => {
    setImageToEdit(image);
    setIsEditDialogOpen(true);
  };

  // Callback after an image is updated in the EditImageDialog
  const handleImageUpdated = (updatedImage: Image) => {
    // Update the image in the local state, considering its new categories
    setImages((prevImages) =>
      prevImages.map((img) => (img.id === updatedImage.id ? updatedImage : img))
    );
    setIsEditDialogOpen(false);
    setImageToEdit(null);
    toast.success("Image updated successfully!");
    // If categories were changed, a full re-fetch might be more reliable
    // to ensure filtering works correctly, especially for filter combinations.
    // For now, we rely on direct state update.
  };

  const content = (
    <div className={cn("flex flex-col", isStandalone ? "h-full" : "h-[70vh]")}>
      <Dialog>
        <DialogHeader className={isStandalone ? "mb-4" : ""}>
          <DialogTitle>
            {isStandalone ? "Your Media Library" : "Media Library"}
          </DialogTitle>
          <DialogDescription>
            {isStandalone
              ? "Browse, edit, and delete your media assets."
              : "Select from previously uploaded images or delete them."}
          </DialogDescription>
        </DialogHeader>
      </Dialog>

      {/* Category Filter */}
      <div className="w-full mb-4">
        {fetchingCategories ? (
          <div className="flex items-center text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading
            categories...
          </div>
        ) : (
          <Select
            onValueChange={handleCategoryFilterChange}
            value={selectedCategoryId || "all"}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {images.length === 0 && loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading images...</p>
        </div>
      ) : images.length === 0 && !loading && !hasMore ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <ImageIcon className="h-12 w-12 mb-4" />
          <p>No images uploaded yet.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative aspect-square rounded-lg overflow-hidden border border-border group"
              >
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 cursor-pointer"
                  onClick={() => onImageSelect(image.url)}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://placehold.co/150x150/e0e0e0/000000?text=Image+Error`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p className="text-white text-xs truncate">{image.title}</p>
                  {isStandalone && (
                    <div className="absolute top-2 right-2 flex space-x-2">
                      <Button
                        variant="default"
                        size="icon"
                        className="rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(image);
                        }}
                        title="Edit Image"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(image.id, image.s3Key);
                        }}
                        disabled={deletingImageId === image.id}
                        title="Delete Image"
                      >
                        {deletingImageId === image.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    className="mt-2 text-xs w-full"
                    onClick={() => onImageSelect(image.url)}
                  >
                    Select
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button onClick={handleLoadMore} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Load More
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Edit Image Dialog */}
      {isEditDialogOpen && imageToEdit && (
        <EditImageDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          image={imageToEdit}
          onImageUpdated={handleImageUpdated}
        />
      )}
    </div>
  );

  if (isStandalone) {
    return content;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[70vh] flex flex-col">
        {content}
      </DialogContent>
    </Dialog>
  );
}
