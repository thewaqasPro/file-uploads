import "server-only";

import { S3Client } from "@aws-sdk/client-s3";

// export const S3 = new S3Client({
//   region: "auto",
//   endpoint: "https://t3.storage.dev",
//   forcePathStyle: false,
// });

// import { S3Client } from "@aws-sdk/client-s3";

export const S3 = new S3Client({
  endpoint: "https://minio.waqas.pro", // or your server IP
  region: "us-east-1",
  credentials: {
    accessKeyId: "AZzLppRosfvmCxb7",
    secretAccessKey: "TZ5NMcqWXLVoqLm8DLLZpp3sxW3LrVTE",
  },
  forcePathStyle: true, // Important for MinIO
});
