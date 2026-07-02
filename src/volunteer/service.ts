import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({ region: "ap-southeast-1" });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = process.env.DONATIONS_TABLE || "DonationsTable";

export const getActiveFeed = async () => {
    const params = {
        TableName: TABLE_NAME,
        IndexName: "StatusIndex",
        KeyConditionExpression: "#status = :status",
        ExpressionAttributeNames: {
            "#status": "status"
        },
        ExpressionAttributeValues: {
            ":status": "ACTIVE"
        }
    };
    const result = await docClient.send(new QueryCommand(params));
    return result.Items;
};

export const getOngoingTasksCount = async (volunteerId: string) => {
    const params = {
        TableName: TABLE_NAME,
        IndexName: "VolunteerIndex",
        KeyConditionExpression: "volunteerId = :vid",
        FilterExpression: "#status = :status",
        ExpressionAttributeNames: {
            "#status": "status"
        },
        ExpressionAttributeValues: {
            ":vid": volunteerId,
            ":status": "ACCEPTED"
        }
    };
    const result = await docClient.send(new QueryCommand(params));
    return result.Items?.length || 0;
};

export const claimDonationRecord = async (donationId: string, volunteerId: string) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { donationId },
        UpdateExpression: "SET #status = :newStatus, volunteerId = :vid",
        ConditionExpression: "attribute_exists(donationId) AND #status = :expectedStatus",
        ExpressionAttributeNames: {
            "#status": "status"
        },
        ExpressionAttributeValues: {
            ":newStatus": "ACCEPTED",
            ":vid": volunteerId,
            ":expectedStatus": "ACTIVE"
        },
        ReturnValues: "ALL_NEW" as const
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
};