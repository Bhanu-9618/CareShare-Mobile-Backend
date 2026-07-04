import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDB as docClient } from "../lib/db";
import { DonationStatus } from "../common/types";
const TABLE_NAME = process.env.DONATIONS_TABLE || "DonationsTable";

export const getLiveDonations = async () => {
    const params = {
        TableName: TABLE_NAME,
        IndexName: "StatusIndex",
        KeyConditionExpression: "#status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": DonationStatus.LIVE }
    };
    const result = await docClient.send(new QueryCommand(params));
    return result.Items;
};

export const requestDonationRecord = async (donationId: string, receiverId: string) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { donationId },
        UpdateExpression: "SET #status = :newStatus, receiverId = :rid",
        ConditionExpression: "#status = :expectedStatus",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { 
            ":newStatus": DonationStatus.REQUESTED, 
            ":rid": receiverId,
            ":expectedStatus": DonationStatus.LIVE 
        },
        ReturnValues: "ALL_NEW" as const
    };
    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
};

export const getDonationsByReceiverAndStatus = async (receiverId: string, status: DonationStatus) => {
    const params = {
        TableName: TABLE_NAME,
        IndexName: "ReceiverIndex",
        KeyConditionExpression: "receiverId = :rid",
        FilterExpression: "#status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
            ":rid": receiverId,
            ":status": status
        }
    };
    const result = await docClient.send(new QueryCommand(params));
    return result.Items || [];
};