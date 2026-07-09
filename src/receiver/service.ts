import { QueryCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
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

export const expireOldDonationsRecords = async (currentTimestamp: number) => {
    const scanParams = {
        TableName: TABLE_NAME,
        FilterExpression: "expiryAt <= :now AND #status <> :completed AND #status <> :expired",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { 
            ":now": currentTimestamp,
            ":completed": DonationStatus.COMPLETED,
            ":expired": DonationStatus.EXPIRED
        }
    };
    
    const result = await docClient.send(new ScanCommand(scanParams));
    const expiredItems = result.Items || [];

    const expiredPromises = expiredItems.map(item => 
        docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { donationId: item.donationId },
            UpdateExpression: "SET #status = :newStatus",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: { ":newStatus": DonationStatus.EXPIRED }
        }))
    );

    await Promise.allSettled(expiredPromises);
    return expiredItems.length;
};

export const requestDonationRecord = async (donationId: string, receiverId: string, receiverName: string, receiverAddress: string) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { donationId },
        UpdateExpression: "SET #status = :newStatus, receiverId = :rid, receiverName = :rname, receiverAddress = :raddress",
        ConditionExpression: "#status = :expectedStatus",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { 
            ":newStatus": DonationStatus.REQUESTED, 
            ":rid": receiverId,
            ":rname": receiverName,
            ":raddress": receiverAddress,
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