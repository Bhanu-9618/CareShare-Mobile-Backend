import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDB } from "../lib/db";
const TABLE_NAME = process.env.DONATIONS_TABLE || "DonationsTable";

export const createDonationRecord = async (donation: any) => {
  return await dynamoDB.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: donation
  }));
};
import { DonationStatus } from "../common/types";

export const getDonationsByStatus = async (donorId: string, status: DonationStatus) => {

  return await dynamoDB.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: "DonorIndex",
    KeyConditionExpression: "donorId = :did",
    FilterExpression: "#s = :status",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":did": donorId, ":status": status }
  }));
};