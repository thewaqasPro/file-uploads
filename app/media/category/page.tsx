// app/categories/page.tsx
"use client";

import React, { useState, useEffect, useCallback, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Trash2, PlusCircle, LayoutList } from "lucide-react"; // Import necessary icons

// Define the interface for a category object
interface Category {
  id: number;
  name: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]); // State to store categories
  const [newCategoryName, setNewCategoryName] = useState<string>(""); // State for the new category input
  const [loading, setLoading] = useState<boolean>(true); // Loading state for fetching categories
  const [addingCategory, setAddingCategory] = useState<boolean>(false); // Loading state for adding a category
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(
    null
  ); // State to track which category is being deleted

  // Function to fetch all categories from the API
  const fetchCategories = useCallback(async () => {
    setLoading(true); // Set loading to true before fetching
    try {
      const response = await fetch("/api/media/categories"); // Call the API to get categories
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data: Category[] = await response.json(); // Parse the JSON response
      setCategories(data); // Update the categories state
    } catch (error) {
      console.error("Error fetching categories:", error); // Log the error
      toast.error("Failed to load categories."); // Show a toast notification
    } finally {
      setLoading(false); // Set loading to false after fetching
    }
  }, []);

  // Effect hook to fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]); // Dependency array ensures it runs once on mount and if fetchCategories changes

  // Function to handle adding a new category
  const handleAddCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission
    if (!newCategoryName.trim()) {
      toast.error("Category name cannot be empty.");
      return;
    }

    setAddingCategory(true); // Set loading state for adding
    try {
      const response = await fetch("/api/media/categories", {
        method: "POST", // Use POST HTTP method
        headers: { "Content-Type": "application/json" }, // Specify content type
        body: JSON.stringify({ name: newCategoryName.trim() }), // Send the new category name
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add category.");
      }

      const newCategory: Category = await response.json(); // Parse the new category from response
      setCategories((prevCategories) => [...prevCategories, newCategory]); // Add to the state
      setNewCategoryName(""); // Clear the input field
      toast.success("Category added successfully!"); // Show success toast
    } catch (error: any) {
      console.error("Error adding category:", error); // Log the error
      toast.error(error.message || "Failed to add category."); // Show error toast
    } finally {
      setAddingCategory(false); // Reset adding state
    }
  };

  // Function to handle deleting a category
  const handleDeleteCategory = async (categoryId: number) => {
    setDeletingCategoryId(categoryId); // Set the ID of the category being deleted
    try {
      const response = await fetch(`/api/media/categories/${categoryId}`, {
        method: "DELETE", // Use DELETE HTTP method
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete category.");
      }

      // Filter out the deleted category from the current state
      setCategories((prevCategories) =>
        prevCategories.filter((cat) => cat.id !== categoryId)
      );
      toast.success("Category deleted successfully."); // Show success toast
    } catch (error: any) {
      console.error("Error deleting category:", error); // Log the error
      toast.error(error.message || "Failed to delete category."); // Show error toast
    } finally {
      setDeletingCategoryId(null); // Reset deleting state
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-background">
      <h1 className="text-4xl font-bold mb-8 text-center">Category Manager</h1>

      {/* Add New Category Form */}
      <div className="w-full max-w-md bg-card p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Add New Category
        </h2>
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <Input
            type="text"
            placeholder="New category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            disabled={addingCategory}
            className="flex-grow"
          />
          <Button type="submit" disabled={addingCategory}>
            {addingCategory ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PlusCircle className="h-4 w-4 mr-2" />
            )}
            Add
          </Button>
        </form>
      </div>

      {/* List All Categories */}
      <div className="w-full max-w-md bg-card p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Existing Categories
        </h2>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <LayoutList className="h-12 w-12 mb-4" />
            <p>No categories found.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between bg-secondary p-3 rounded-md shadow-sm"
              >
                <span className="text-lg font-medium text-foreground">
                  {category.name}
                </span>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteCategory(category.id)}
                  disabled={
                    deletingCategoryId === category.id ||
                    category.name === "Uncategorized" // Disable deletion for "Uncategorized"
                  }
                  title={
                    category.name === "Uncategorized"
                      ? "Cannot delete Uncategorized"
                      : "Delete category"
                  }
                >
                  {deletingCategoryId === category.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
