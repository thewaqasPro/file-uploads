This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

File Uploads/
├── app/
│ ├── api/ # Top-level API routes (remain here for Next.js routing)
│ │ ├── categories/
│ │ │ ├── route.ts # GET/POST categories (API endpoint for category CRUD)
│ │ │ └── [id]/route.ts # DELETE category (API endpoint for single category deletion)
│ │ ├── images/
│ │ │ ├── route.ts # GET images (API endpoint for filtering/pagination)
│ │ │ └── [id]/route.ts # PATCH image details (API endpoint for updating image)
│ │ └── s3/
│ │ ├── upload/route.ts # POST for presigned S3 URL
│ │ └── delete/route.ts # DELETE S3 object and database entry
│ │
│ ├── media/ # The standalone Media Library page (uses the feature)
│ │ └── page.tsx
│ │
│ └── page.tsx # Your original Uploader page (uses the feature)
│
├── components/ # General/shared UI components (e.g., shadcn/ui)
│ └── ui/
│ ├── button.tsx
│ ├── dialog.tsx
│ ├── input.tsx
│ ├── label.tsx
│ ├── checkbox.tsx
│ └── select.tsx
│
├── features/ # Your new feature modules
│ └── media/ # The "Media Management" feature
│ ├── components/ # All reusable React components for the media UI
│ │ ├── MediaLibrary.tsx # The core media grid, filter, pagination, edit trigger
│ │ ├── EditImageDialog.tsx # The dialog for editing image details
│ │ └── Uploader.tsx # The file upload UI
│ │ └── index.ts # (Optional) Barrel file to easily export components
│ │
│ ├── lib/ # Media-specific utility functions or client-side logic
│ │ └── hooks/ # (Optional) Custom React hooks related to media
│ │ └── useMediaGallery.ts
│ │ └── utils.ts # Any other media-specific helper functions
│ │ └── index.ts # (Optional) Barrel file for lib exports
│ │
│ └── types/ # TypeScript interfaces/types specific to this feature
│ └── index.ts # Contains Image, Category, etc. interfaces
│
├── lib/ # Application-wide utilities (shared across features)
│ ├── db.ts # The single Prisma client instance setup
│ ├── S3Client.ts # Your S3 client instance
│ ├── utils.ts # General utility functions (e.g., cn for Tailwind)
│ └── index.ts # (Optional) Barrel file for lib exports
│
├── prisma/ # Prisma schema definition and migrations (global)
│ └── schema.prisma # Contains Image, ImageCategories models
│
├── public/ # Static assets
├── tsconfig.json
└── package.json
