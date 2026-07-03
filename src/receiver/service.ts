import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ap-southeast-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DONATIONS_TABLE || "DonationsTable";

export const getLiveDonations = async () => {
    const params = {
        TableName: TABLE_NAME,
        IndexName: "StatusIndex",
        KeyConditionExpression: "#status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": "LIVE" }
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
            ":newStatus": "REQUESTED", 
            ":rid": receiverId,
            ":expectedStatus": "LIVE" 
        },
        ReturnValues: "ALL_NEW" as const
    };
    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
};

export const getDonationsByReceiverAndStatus = async (receiverId: string, status: string) => {
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