import { QueryCommand, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDB as docClient } from "../lib/db";
import { DonationStatus } from "../common/types";

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
            ":status": DonationStatus.ACTIVE
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
            ":status": DonationStatus.ACCEPTED
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
            ":newStatus": DonationStatus.ACCEPTED,
            ":vid": volunteerId,
            ":expectedStatus": DonationStatus.ACTIVE
        },
        ReturnValues: "ALL_NEW" as const
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
};

export const getOngoingTasksByVolunteer = async (volunteerId: string) => {
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
            ":status": DonationStatus.ACCEPTED
        }
    };
    const result = await docClient.send(new QueryCommand(params));
    return result.Items;
};

export const pickupDonationRecord = async (donationId: string, volunteerId: string) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { donationId },
        UpdateExpression: "SET #status = :newStatus",
        ConditionExpression: "attribute_exists(donationId) AND volunteerId = :vid AND #status = :expectedStatus",
        ExpressionAttributeNames: {
            "#status": "status"
        },
        ExpressionAttributeValues: {
            ":newStatus": DonationStatus.LIVE,
            ":vid": volunteerId,
            ":expectedStatus": DonationStatus.ACCEPTED
        },
        ReturnValues: "ALL_NEW" as const
    };
    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
};

export const getInventoryByVolunteer = async (volunteerId: string) => {
    const params = {
        TableName: TABLE_NAME,
        IndexName: "VolunteerIndex",
        KeyConditionExpression: "volunteerId = :vid",
        FilterExpression: "#status IN (:status1, :status2)",
        ExpressionAttributeNames: {
            "#status": "status"
        },
        ExpressionAttributeValues: {
            ":vid": volunteerId,
            ":status1": DonationStatus.LIVE,
            ":status2": DonationStatus.REQUESTED
        }
    };
    const result = await docClient.send(new QueryCommand(params));
    return result.Items;
};

export const confirmDonationRequestRecord = async (donationId: string, volunteerId: string, otp: string) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { donationId },
        UpdateExpression: "SET generated_otp = :otp",
        ConditionExpression: "volunteerId = :vid AND #status = :expectedStatus",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
            ":otp": otp,
            ":vid": volunteerId,
            ":expectedStatus": DonationStatus.REQUESTED
        },
        ReturnValues: "ALL_NEW" as const
    };
    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
};

export const cancelReceiverRequestRecord = async (donationId: string, volunteerId: string) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { donationId },
        UpdateExpression: "SET #status = :newStatus REMOVE receiverId",
        ConditionExpression: "volunteerId = :vid AND #status = :expectedStatus",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
            ":newStatus": DonationStatus.LIVE,
            ":vid": volunteerId,
            ":expectedStatus": DonationStatus.REQUESTED
        },
        ReturnValues: "ALL_NEW" as const
    };
    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
};

export const getDonationById = async (donationId: string) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { donationId }
    };
    const result = await docClient.send(new GetCommand(params));
    return result.Item;
};

export const completeDonationRecord = async (donationId: string, volunteerId: string) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { donationId },
        UpdateExpression: "SET #status = :newStatus",
        ConditionExpression: "volunteerId = :vid AND #status = :expectedStatus",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
            ":newStatus": DonationStatus.COMPLETED,
            ":vid": volunteerId,
            ":expectedStatus": DonationStatus.REQUESTED
        },
        ReturnValues: "ALL_NEW" as const
    };
    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
};
