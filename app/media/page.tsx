// app/media/page.tsx
"use client";

import { useState } from "react";
import { MediaLibrary } from "@/components/web/MediaLibrary"; // Import the MediaLibrary component
import { CheckCircle } from "lucide-react"; // Import CheckCircle icon for selected image display

export default function MediaPage() {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const handleImageSelect = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    // You can add more logic here, e.g., navigate to an image detail page
    // or update a form field with the selected image URL.
  };

  return (
    <div className="flex flex-col items-center p-4 bg-background max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">Your Media Assets</h1>

      {selectedImageUrl && (
        <div className="mt-4 mb-8 p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center gap-3 w-full max-w-7xl mx-auto">
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

      {/* Render the MediaLibrary component in standalone mode */}
      <div className="w-full flex-1">
        <MediaLibrary
          isStandalone={true} // Set to true to render directly on the page
          onImageSelect={handleImageSelect}
        />
      </div>
    </div>
  );
}
