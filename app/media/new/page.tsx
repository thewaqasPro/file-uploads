// app/page.tsx
import { Uploader } from "@/components/media/Uploader"; // Assuming Uploader is in this path

export default function Home() {
  return (
    <div className="max-w-7xl">
      <div className="flex flex-col  w-full p-4">
        <h1 className="text-4xl font-bold pb-10">Your Media Manager 📂</h1>
        <Uploader />
      </div>
    </div>
  );
}
