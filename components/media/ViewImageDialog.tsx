// components/web/ViewImageDialog.tsx
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Pencil } from "lucide-react";

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
  categories?: Category[];
}

interface ViewImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  image: Image; // The image object to be viewed
  onEditClick: (image: Image) => void; // Callback to open the edit dialog
}

export function ViewImageDialog({
  isOpen,
  onClose,
  image,
  onEditClick,
}: ViewImageDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-screen-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{image.title}</DialogTitle>
          <DialogDescription>Full-size view of your image.</DialogDescription>
        </DialogHeader>

        <div className="flex-grow flex items-center justify-center overflow-hidden p-2">
          <img
            src={image.url}
            alt={image.title}
            className="max-w-full max-h-[70vh] object-contain rounded-md shadow-lg"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `https://placehold.co/600x400/e0e0e0/000000?text=Image+Load+Error`;
            }}
          />
        </div>

        <DialogFooter className="mt-4 flex flex-col sm:flex-row sm:justify-end sm:space-x-2">
          {image.categories && image.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-2 sm:mb-0 sm:mr-auto">
              Categories:
              {image.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-xs"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            className="flex items-center gap-2 mb-2 sm:mb-0"
            onClick={() => onEditClick(image)} // Call the prop to open edit dialog
          >
            <Pencil className="h-4 w-4" /> Edit Image
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
