import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    console.log("getFiles Event:", JSON.stringify(event));

    try {
        const userId = event.requestContext.authorizer?.claims?.sub;
        if (!userId) {
            console.warn("Unauthorized access attempt");
            return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }), headers: { "Access-Control-Allow-Origin": "*" } };
        }

        console.log(`Fetching files for user: ${userId}`);

        const result = await ddbDocClient.send(new QueryCommand({
            TableName: process.env.FILES_TABLE,
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ":userId": userId
            }
        }));

        const files = result.Items || [];

        // Aggregating analytics
        const analytics = {
            totalUploads: files.length,
            totalDownloads: files.reduce((sum, file) => sum + (file.downloadCount || 0), 0),
            storageUsed: files.reduce((sum, file) => sum + (file.fileSize || 0), 0)
        };

        console.log("Analytics summary:", analytics);

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ files, analytics })
        };

    } catch (error) {
        console.error("Error fetching files:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "Failed to fetch files" })
        };
    }
};
