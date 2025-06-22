import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { S3 } from "@/lib/S3Client";

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const key = body.key;

    // return NextResponse.json(body);
    console.log("Step # 1");

    if (!key || typeof key !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid object key." },
        { status: 400 }
      );
    }

    console.log("Step # 2");

    const command = new DeleteObjectCommand({
      Bucket: "goodguitarist",
      Key: key,
    });

    console.log("Step # 3");

    await S3.send(command);

    console.log("Step # 4");

    return NextResponse.json(
      { message: "File deleted successfully" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to delete file." },
      { status: 500 }
    );
  }
}
