// lib/db.ts
// import { PrismaClient } from "@prisma/client";
import { PrismaClient } from "./generated/prisma";

// Declare a global variable for PrismaClient to avoid multiple instantiations in development
// This is necessary for Next.js hot-reloading to prevent issues with multiple PrismaClient instances
declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

// Check if a PrismaClient instance already exists globally (for development hot-reloading)
if (process.env.NODE_ENV === "production") {
  // In production, always create a new instance
  prisma = new PrismaClient();
} else {
  // In development, use the global instance if it exists, otherwise create a new one
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

// Export the PrismaClient instance for use throughout the application
export { prisma };
