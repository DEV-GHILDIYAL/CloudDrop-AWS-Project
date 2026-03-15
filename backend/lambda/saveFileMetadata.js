import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    console.log("saveFileMetadata Event:", JSON.stringify(event));

    try {
        const userId = event.requestContext.authorizer?.claims?.sub;
        if (!userId) {
            console.warn("Unauthorized access attempt");
            return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }), headers: { "Access-Control-Allow-Origin": "*" } };
        }

        const { fileId, fileName, s3Key, fileSize, fileType } = JSON.parse(event.body || "{}");

        if (!fileId || !fileName || !s3Key || !fileSize) {
            console.warn("Missing required metadata fields");
            return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }), headers: { "Access-Control-Allow-Origin": "*" } };
        }

        const createdAt = new Date().toISOString();
        // 30 days expiration for Dynamodb TTL
        const expiresAt = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

        const item = {
            userId,
            fileId,
            fileName,
            s3Key,
            fileSize,
            fileType: fileType || 'application/octet-stream',
            createdAt,
            expiresAt,
            downloadCount: 0
        };

        console.log("Saving metadata to DynamoDB:", item);

        await ddbDocClient.send(new PutCommand({
            TableName: process.env.FILES_TABLE,
            Item: item
        }));

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "Metadata saved successfully", file: item })
        };

    } catch (error) {
        console.error("Error saving metadata:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "Failed to save file metadata" })
        };
    }
};
