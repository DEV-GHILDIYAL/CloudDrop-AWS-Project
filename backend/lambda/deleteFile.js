import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const s3Client = new S3Client({});
const dbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(dbClient);

export const handler = async (event) => {
    console.log("deleteFile Event:", JSON.stringify(event));

    try {
        const requestUserId = event.requestContext.authorizer?.claims?.sub;
        const { userId, fileId } = event.pathParameters || {};

        if (!requestUserId || requestUserId !== userId) {
            console.warn(`Unauthorized delete attempt: token user ${requestUserId} vs path user ${userId}`);
            return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }), headers: { "Access-Control-Allow-Origin": "*" } };
        }

        if (!userId || !fileId) {
            console.warn("Missing path parameters");
            return { statusCode: 400, body: JSON.stringify({ error: "Missing userId or fileId" }), headers: { "Access-Control-Allow-Origin": "*" } };
        }

        console.log(`Deleting file ${fileId} for user ${userId}`);

        // Fetch existing metadata to get s3Key
        const getResult = await ddbDocClient.send(new GetCommand({
            TableName: process.env.FILES_TABLE,
            Key: { userId, fileId }
        }));

        if (!getResult.Item) {
            console.warn("File not found in DynamoDB");
            return { statusCode: 404, body: JSON.stringify({ error: "File not found" }), headers: { "Access-Control-Allow-Origin": "*" } };
        }

        const { s3Key } = getResult.Item;
        console.log(`Found S3 Key to delete: ${s3Key}`);

        // Delete from S3
        await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.UPLOAD_BUCKET,
            Key: s3Key
        }));
        console.log("Deleted from S3");

        // Delete from DynamoDB
        await ddbDocClient.send(new DeleteCommand({
            TableName: process.env.FILES_TABLE,
            Key: { userId, fileId }
        }));
        console.log("Deleted from DynamoDB");

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "File deleted successfully" })
        };

    } catch (error) {
        console.error("Error deleting file:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "Failed to delete file" })
        };
    }
};
