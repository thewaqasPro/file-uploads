// components/web/MediaLibrary.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog"; // Assuming you have these Radix UI Dialog components
import { Button } from "../ui/button";
import {
  Loader2,
  Trash2,
  Library,
  CheckCircle,
  Image as ImageIcon,
} from "lucide-react"; // Import Library and CheckCircle icons
import { toast } from "sonner";
import { cn } from "@/lib/utils"; // For Tailwind class merging

// Define the interface for an image object received from the API
interface Image {
  id: number;
  title: string;
  s3Key: string;
  url: string;
  createdAt: string; // ISO 8601 string
}

// Props for the MediaLibrary component
interface MediaLibraryProps {
  isOpen: boolean; // Controls the visibility of the dialog
  onClose: () => void; // Callback function when the dialog is closed
  onImageSelect: (imageUrl: string) => void; // Callback function when an image is selected
}

const IMAGES_PER_LOAD = 15; // Define how many images to fetch per "load more"

export function MediaDialog({
  isOpen,
  onClose,
  onImageSelect,
}: MediaLibraryProps) {
  const [images, setImages] = useState<Image[]>([]); // State to store fetched images
  const [loading, setLoading] = useState<boolean>(false); // Loading state for initial fetch or load more
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null); // State to track which image is being deleted
  const [offset, setOffset] = useState<number>(0); // Current offset for pagination
  const [hasMore, setHasMore] = useState<boolean>(true); // Indicates if there are more images to load

  // Function to fetch images from the API with pagination
  const fetchImages = useCallback(
    async (currentOffset: number, append: boolean = true) => {
      setLoading(true); // Set loading to true before fetching
      try {
        const response = await fetch(
          `/api/media/images?limit=${IMAGES_PER_LOAD}&offset=${currentOffset}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch images");
        }
        const data: Image[] = await response.json(); // Parse the JSON response

        if (append) {
          setImages((prevImages) => [...prevImages, ...data]); // Append new images
        } else {
          setImages(data); // Replace images (for initial load when opening modal)
        }

        // Determine if there are more images to load
        setHasMore(data.length === IMAGES_PER_LOAD);
        setOffset(currentOffset + data.length); // Update the offset for the next load
      } catch (error) {
        console.error("Error fetching images:", error); // Log the error
        toast.error("Failed to load media library."); // Show a toast notification
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    },
    []
  );

  // Effect hook to fetch initial images when the dialog opens
  useEffect(() => {
    if (isOpen) {
      // Reset state when opening the modal to fetch from scratch
      setImages([]);
      setOffset(0);
      setHasMore(true);
      fetchImages(0, false); // Fetch initial set, do not append
    }
  }, [isOpen, fetchImages]);

  // Function to handle image deletion
  const handleDeleteImage = async (imageId: number, s3Key: string) => {
    setDeletingImageId(imageId); // Set the ID of the image being deleted
    try {
      const response = await fetch("/api/media/s3/delete", {
        method: "DELETE", // Use DELETE HTTP method
        headers: { "Content-Type": "application/json" }, // Specify content type
        body: JSON.stringify({ key: s3Key }), // Send the S3 key in the request body
      });

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      // Filter out the deleted image from the current state
      setImages((prevImages) => prevImages.filter((img) => img.id !== imageId));
      toast.success("Image deleted successfully."); // Show success toast
      // After deleting, you might want to re-evaluate if "load more" is needed
      // or simply fetch more images if the list becomes too short.
      // For now, we just remove it from the view.
    } catch (error) {
      console.error("Error deleting image:", error); // Log the error
      toast.error("Failed to delete image."); // Show error toast
    } finally {
      setDeletingImageId(null); // Reset deleting state
    }
  };

  const handleLoadMore = () => {
    fetchImages(offset, true); // Fetch next set of images and append
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
          <DialogDescription>
            Select from previously uploaded images or delete them.
          </DialogDescription>
        </DialogHeader>

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
                    onClick={() => onImageSelect(image.url)} // Call onImageSelect on click
                    onError={(e) => {
                      // Fallback for broken images: show a generic icon or placeholder
                      e.currentTarget.onerror = null; // Prevent infinite loop
                      e.currentTarget.src = `https://placehold.co/150x150/e0e0e0/000000?text=Image+Error`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <p className="text-white text-xs truncate">{image.title}</p>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 rounded-full"
                      onClick={() => handleDeleteImage(image.id, image.s3Key)}
                      disabled={deletingImageId === image.id}
                    >
                      {deletingImageId === image.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
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
      </DialogContent>
    </Dialog>
  );
}
