// app/page.tsx
import { Button } from "@/components/ui/button";
import { Uploader } from "@/components/web/Uploader"; // Assuming Uploader is in this path
import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold pb-10 text-center">
        Your Media Manager 📂
      </h1>
      <Link href={"/media"}>
        <Button>Media Library</Button>
      </Link>
      {/* <Uploader /> */}
    </div>
  );
}
