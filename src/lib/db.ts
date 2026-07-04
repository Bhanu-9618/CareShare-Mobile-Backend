import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-southeast-1" });
export const dynamoDB = DynamoDBDocumentClient.from(ddbClient);
