import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const s3Client = new S3Client({});
const dbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(dbClient);

export const handler = async (event) => {
    console.log("generateDownloadUrl Event:", JSON.stringify(event));

    try {
        const { userId, fileId } = event.pathParameters || {};

        if (!userId || !fileId) {
            console.warn("Missing path parameters");
            return { statusCode: 400, body: JSON.stringify({ error: "Missing userId or fileId" }), headers: { "Access-Control-Allow-Origin": "*" } };
        }

        console.log(`Fetching metadata for user ${userId}, file ${fileId}`);

        // First, verify the file exists
        const getResult = await ddbDocClient.send(new GetCommand({
            TableName: process.env.FILES_TABLE,
            Key: { userId, fileId }
        }));

        if (!getResult.Item) {
            console.warn("File not found in DynamoDB");
            return { statusCode: 404, body: JSON.stringify({ error: "File not found" }), headers: { "Access-Control-Allow-Origin": "*" } };
        }

        const fileMeta = getResult.Item;
        console.log("File metadata retrieved:", fileMeta);

        // Increment download count
        await ddbDocClient.send(new UpdateCommand({
            TableName: process.env.FILES_TABLE,
            Key: { userId, fileId },
            UpdateExpression: "SET downloadCount = if_not_exists(downloadCount, :zero) + :inc",
            ExpressionAttributeValues: {
                ":zero": 0,
                ":inc": 1
            }
        }));
        console.log("Download count incremented");

        // Generate S3 presigned GET URL
        const command = new GetObjectCommand({
            Bucket: process.env.UPLOAD_BUCKET,
            Key: fileMeta.s3Key,
            ResponseContentDisposition: `attachment; filename="${fileMeta.fileName}"`,
        });

        const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        console.log("Generated presigned download URL");

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ downloadUrl, fileMeta })
        };

    } catch (error) {
        console.error("Error generating download URL:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "Failed to generate download URL" })
        };
    }
};
