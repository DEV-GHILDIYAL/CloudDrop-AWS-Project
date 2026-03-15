import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({});

const MAX_SIZE = 100 * 1024 * 1024; // 100MB

export const handler = async (event) => {
  console.log("generateUploadUrl Event:", JSON.stringify(event));

  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      console.warn("Unauthorized access attempt");
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }), headers: { "Access-Control-Allow-Origin": "*" } };
    }

    const { fileName, fileType, fileSize } = JSON.parse(event.body || "{}");

    if (!fileName || !fileType || !fileSize) {
      console.warn("Missing file properties", { fileName, fileType, fileSize });
      return { statusCode: 400, body: JSON.stringify({ error: "fileName, fileType, and fileSize are required" }), headers: { "Access-Control-Allow-Origin": "*" } };
    }

    if (typeof fileType !== 'string' || !fileType.includes('/')) {
      console.warn("Invalid file type", fileType);
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid file type" }), headers: { "Access-Control-Allow-Origin": "*" } };
    }

    if (fileSize > MAX_SIZE) {
      console.warn("File size exceeded", fileSize);
      return { statusCode: 400, body: JSON.stringify({ error: "File size exceeds 100MB limit" }), headers: { "Access-Control-Allow-Origin": "*" } };
    }

    const fileId = uuidv4();
    const s3Key = `uploads/${userId}/${fileId}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    console.log(`Generating presigned URL for user ${userId}, key ${s3Key}`);

    const command = new PutObjectCommand({
      Bucket: process.env.UPLOAD_BUCKET,
      Key: s3Key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        uploadUrl,
        fileId,
        s3Key
      })
    };
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to generate upload URL" })
    };
  }
};
