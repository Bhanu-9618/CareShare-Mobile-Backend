import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({ region: "ap-southeast-1" });
const dynamoDB = DynamoDBDocumentClient.from(ddbClient);
const TABLE_NAME = "DonationsTable";

export const createDonationRecord = async (donation: any) => {
  return await dynamoDB.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: donation
  }));
};

export const getDonationsByStatus = async (donorId: string, status: string) => {

  return await dynamoDB.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: "DonorIndex",
    KeyConditionExpression: "donorId = :did",
    FilterExpression: "#s = :status",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":did": donorId, ":status": status }
  }));
};