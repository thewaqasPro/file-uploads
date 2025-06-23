// components/web/Uploader.tsx
"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { FileRejection, useDropzone } from "react-dropzone";
import { useCallback, useState, useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Loader2, Trash2, Library, CheckCircle } from "lucide-react";
import { MediaLibrary } from "./MediaLibrary";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import NextImage from "next/image";

// Define the interface for a category object (matching your API response)
interface Category {
  id: number;
  name: string;
}

export function Uploader() {
  const [files, setFiles] = useState<
    Array<{
      id: string;
      file: File; // This will be the optimized file after processing
      originalFile: File; // Keep a reference to the original file for debugging/logging
      uploading: boolean;
      progress: number;
      key?: string;
      isDeleting: boolean;
      error: boolean;
      objectUrl?: string; // Client-side URL for preview (of optimized image)
    }>
  >([]);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // New state for categories and selected categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [fetchingCategories, setFetchingCategories] = useState(true);

  // Function to fetch all categories from the API
  const fetchCategories = useCallback(async () => {
    setFetchingCategories(true);
    try {
      const response = await fetch("/api/media/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data: Category[] = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories for selection.");
    } finally {
      setFetchingCategories(false);
    }
  }, []);

  // Effect hook to fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle checkbox change for categories
  const handleCategoryChange = (categoryId: number, isChecked: boolean) => {
    setSelectedCategoryIds((prev) =>
      isChecked ? [...prev, categoryId] : prev.filter((id) => id !== categoryId)
    );
  };

  /**
   * Optimizes an image for web by resizing and compressing it.
   * Converts to WebP format. Skips optimization for SVG and GIF files.
   * @param {File} imageFile - The original image file.
   * @param {number} maxWidth - The maximum width for the output image.
   * @param {number} quality - WebP compression quality (0.0 to 1.0).
   * @returns {Promise<File>} A promise that resolves to the optimized image file or the original file if not optimized.
   */
  const optimizeImage = useCallback(
    (
      imageFile: File,
      maxWidth: number,
      quality: number = 0.8
    ): Promise<File> => {
      return new Promise((resolve, reject) => {
        // Skip optimization for SVG and GIF files
        if (
          imageFile.type === "image/svg+xml" ||
          imageFile.type === "image/gif"
        ) {
          resolve(imageFile); // Resolve with the original file
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onload = (event) => {
          const img = new window.Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions to fit within maxWidth while maintaining aspect ratio
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
            // If you wanted to constrain by height as well:
            // if (height > maxHeight) {
            //   width = Math.round((width * maxHeight) / height);
            //   height = maxHeight;
            // }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Could not get canvas context."));
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);

            // Determine the new filename with .webp extension
            const originalNameParts = imageFile.name.split(".");
            const nameWithoutExtension = originalNameParts
              .slice(0, -1)
              .join(".");
            const newFileName = `${nameWithoutExtension}.webp`;

            // Convert canvas content to Blob, then to File
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const optimizedFile = new File([blob], newFileName, {
                    // Use newFileName
                    type: "image/webp", // Force WEBP for better compression
                    lastModified: Date.now(),
                  });
                  resolve(optimizedFile);
                } else {
                  reject(new Error("Canvas to Blob conversion failed."));
                }
              },
              "image/webp",
              quality
            ); // Use image/webp for compression
          };
          img.onerror = (error: any) => reject(error);
        };
        reader.onerror = (error) => reject(error);
      });
    },
    []
  );

  // Function to remove a file from S3 and local state
  async function removeFile(fileId: string) {
    try {
      const fileToRemove = files.find((f) => f.id === fileId);
      if (!fileToRemove) {
        console.warn("File to remove not found in state:", fileId);
        return;
      }

      // Revoke the object URL immediately to free up memory
      if (fileToRemove.objectUrl) {
        URL.revokeObjectURL(fileToRemove.objectUrl);
      }

      setFiles((prevFiles) =>
        prevFiles.map((f) => (f.id === fileId ? { ...f, isDeleting: true } : f))
      );

      // Call the API to delete the file from S3 and database
      const response = await fetch("/api/media/s3/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: fileToRemove.key }), // Ensure key exists
      });

      if (!response.ok) {
        toast.error("Failed to remove file from storage.");
        // Revert isDeleting state and show error if deletion fails
        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.id === fileId ? { ...f, isDeleting: false, error: true } : f
          )
        );
        return;
      }

      // If successful, remove the file from the local state
      setFiles((prevFiles) => prevFiles.filter((f) => f.id !== fileId));
      toast.success("File removed successfully");
    } catch (error) {
      console.error("Error during file removal:", error);
      toast.error("Failed to remove file from storage.");
      // Ensure state is reset even on unexpected errors
      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === fileId ? { ...f, isDeleting: false, error: true } : f
        )
      );
    }
  }

  // Function to upload a single file to S3 via presigned URL
  const uploadFile = async (file: File, originalFile: File) => {
    // Mark the file as uploading in the state
    setFiles(
      (prevFiles) =>
        prevFiles.map((f) =>
          f.file === originalFile ? { ...f, uploading: true } : f
        ) // Use originalFile for matching
    );

    try {
      // 1. Get presigned URL from our API
      const presignedResponse = await fetch("/api/media/s3/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          title: file.name, // Default title to filename for now
          categoryIds: selectedCategoryIds, // Pass selected category IDs
        }),
      });

      if (!presignedResponse.ok) {
        toast.error("Failed to get presigned URL");
        // Update file state to reflect error
        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.file === originalFile // Match by original file
              ? { ...f, uploading: false, progress: 0, error: true }
              : f
          )
        );
        return;
      }

      const { presignedUrl, key, imageUrl } = await presignedResponse.json();

      // 2. Upload file directly to S3 using the presigned URL
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            // Update progress in the file state
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.file === originalFile // Match by original file
                  ? { ...f, progress: Math.round(percentComplete), key: key }
                  : f
              )
            );
          }
        };

        // Handle successful upload
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 204) {
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.file === originalFile // Match by original file
                  ? {
                      ...f,
                      progress: 100,
                      uploading: false,
                      error: false,
                      key: key,
                      objectUrl: imageUrl,
                      file: file,
                    } // Update file to optimized and objectUrl to S3 URL
                  : f
              )
            );
            toast.success("File uploaded successfully");
            resolve();
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };

        // Handle upload errors
        xhr.onerror = () => {
          reject(new Error("Upload failed"));
        };

        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });
    } catch (error) {
      console.error("Error during upload process:", error);
      toast.error("Something went wrong during upload.");
      // Update file state to reflect error
      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.file === originalFile // Match by original file
            ? { ...f, uploading: false, progress: 0, error: true }
            : f
        )
      );
    }
  };

  // Callback for when files are dropped or selected
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length) {
        const filesToProcess = acceptedFiles.map((file) => ({
          id: uuidv4(),
          file: file, // Initially, this is the original file
          originalFile: file, // Keep reference to original
          uploading: false,
          progress: 0,
          isDeleting: false,
          error: false,
          objectUrl: URL.createObjectURL(file), // Create a temporary object URL for immediate preview of original
        }));
        setFiles((prevFiles) => [...prevFiles, ...filesToProcess]);

        // Process and upload each file
        for (const fileItem of filesToProcess) {
          try {
            // Optimize the image before proceeding with upload
            // You can choose 1920 or 1080 for maxWidth
            const optimizedFile = await optimizeImage(fileItem.file, 1920, 0.8); // Max 1920px width, 80% quality
            // Revoke the original object URL to free memory, create new for optimized
            URL.revokeObjectURL(fileItem.objectUrl);
            const newObjectUrl = URL.createObjectURL(optimizedFile);

            // Update the fileItem in state to reference the optimized file and its URL
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.id === fileItem.id
                  ? { ...f, file: optimizedFile, objectUrl: newObjectUrl }
                  : f
              )
            );

            // Now upload the optimized file
            uploadFile(optimizedFile, fileItem.originalFile); // Pass original for state matching
          } catch (error) {
            console.error("Error optimizing image:", error);
            toast.error(`Failed to optimize ${fileItem.file.name}`);
            // Mark as error if optimization fails
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.id === fileItem.id
                  ? { ...f, error: true, uploading: false }
                  : f
              )
            );
          }
        }
      }
    },
    [selectedCategoryIds, optimizeImage, uploadFile]
  );

  // Callback for when files are rejected (e.g., too many, too large)
  const rejectedFiles = useCallback((fileRejection: FileRejection[]) => {
    if (fileRejection.length) {
      const tooManyFiles = fileRejection.find(
        (rejection) => rejection.errors[0].code === "too-many-files"
      );

      const fileSizeTooBig = fileRejection.find(
        (rejection) => rejection.errors[0].code === "file-too-large"
      );

      if (tooManyFiles) {
        toast.error("Too many files selected, max is 5");
      }

      if (fileSizeTooBig) {
        toast.error("File size exceeds 10mb limit"); // Updated message to match max size
      }
    }
  }, []);

  // Configure react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: rejectedFiles,
    maxFiles: 5, // Maximum 5 files at a time
    maxSize: 1024 * 1024 * 10, // 10mb limit for original file size
    accept: {
      "image/*": [], // Only accept image files (any type will be converted to webp)
    },
  });

  // Cleanup object URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        // Only revoke if it's a temporary client-side URL (not yet uploaded to S3)
        // or if it was the original objectUrl that has now been replaced by optimized one
        if (file.objectUrl && !file.key) {
          URL.revokeObjectURL(file.objectUrl);
        }
      });
    };
  }, [files]);

  // Handle image selection from Media Library
  const handleImageSelectFromLibrary = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl); // Set the selected image URL
    setIsMediaLibraryOpen(false); // Close the Media Library modal
    toast.success("Image selected from media library!");
    // Here you could add logic to display this image, perhaps in a preview area
    // or pass it up to a parent component.
  };

  return (
    <>
      <Card
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed transition-colors duration-200 ease-in-out w-full h-64",
          isDragActive
            ? "border-primary bg-primary/10 border-solid"
            : "border-border hover:border-primary"
        )}
      >
        <CardContent className="flex items-center justify-center h-full w-full">
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-center text-muted-foreground">
              Drop your files here ...
            </p>
          ) : (
            <div className="flex flex-col items-center gap-y-3">
              <p className="text-center text-muted-foreground">
                Drag &apos;n&apos; drop some files here, or click to select
                files
              </p>
              <Button>Select Files</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Selection */}
      <div className="w-full max-w-2xl mt-4 p-4 bg-card rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-3">Select Categories:</h3>
        {fetchingCategories ? (
          <div className="flex items-center text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading
            categories...
          </div>
        ) : categories.length === 0 ? (
          <p className="text-muted-foreground">
            No categories available. Please add some on the Categories page.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedCategoryIds.includes(category.id)}
                  onCheckedChange={(checked) =>
                    handleCategoryChange(category.id, !!checked)
                  }
                />
                <Label htmlFor={`category-${category.id}`}>
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center mt-4">
        <Button
          onClick={() => setIsMediaLibraryOpen(true)}
          variant="secondary"
          className="flex items-center gap-2"
        >
          <Library className="h-5 w-5" /> Open Media Library
        </Button>
      </div>

      {selectedImageUrl && (
        <div className="mt-6 p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-800 dark:text-green-200">
            Selected Image URL:{" "}
            <a
              href={selectedImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-600 dark:text-blue-400 break-all"
            >
              {selectedImageUrl}
            </a>
          </p>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
          {files.map(
            ({
              id,
              file,
              uploading,
              progress,
              isDeleting,
              error,
              objectUrl,
            }) => {
              return (
                <div key={id} className="flex flex-col gap-1">
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    {/* Display image preview, fall back to placeholder if objectUrl is missing */}
                    <NextImage
                      src={
                        objectUrl ||
                        `https://placehold.co/150x150/e0e0e0/000000?text=No+Preview`
                      }
                      alt={file.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback for broken image previews
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://placehold.co/150x150/e0e0e0/000000?text=Error`;
                      }}
                    />

                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 rounded-full"
                      onClick={() => removeFile(id)}
                      disabled={isDeleting || uploading} // Disable delete during upload or when already deleting
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                    {uploading && !isDeleting && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-white font-medium text-lg">
                          {progress}%
                        </div>
                      </div>
                    )}
                    {error && (
                      <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                        <div className="text-white font-medium">Error</div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate px-1">
                    {file.name}
                  </p>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* Media Library Component */}
      <MediaLibrary
        isOpen={isMediaLibraryOpen}
        onClose={() => setIsMediaLibraryOpen(false)}
        onImageSelect={handleImageSelectFromLibrary}
      />
    </>
  );
}
