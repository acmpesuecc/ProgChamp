import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Test upload
const testUpload = async () => {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: "test/hello.txt",
    Body: "Hello from R2!",
    ContentType: "text/plain",
  });
  
  await client.send(command);
  console.log("✅ Upload successful!");
};

// Test list
const testList = async () => {
  const command = new ListObjectsV2Command({
    Bucket: process.env.R2_BUCKET_NAME!,
    MaxKeys: 10,
  });
  
  const response = await client.send(command);
  console.log("✅ List successful!");
  console.log("Files:", response.Contents?.length || 0);
};

testUpload().then(testList).catch(console.error);