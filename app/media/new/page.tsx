// app/page.tsx
import { Uploader } from "@/components/web/Uploader"; // Assuming Uploader is in this path

export default function Home() {
  return (
    <div className="-mx-auto max-w-7xl">
      <div className="flex flex-col items-center justify-center w-full p-4">
        <h1 className="text-4xl font-bold pb-10 text-center">
          Your Media Manager 📂
        </h1>
        <Uploader />
      </div>
    </div>
  );
}
