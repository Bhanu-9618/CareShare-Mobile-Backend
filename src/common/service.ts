import { GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDB } from "../lib/db";
import { DonationStatus } from "./types";

const USERS_TABLE = process.env.USERS_TABLE || "UsersTable";
const DONATIONS_TABLE = process.env.DONATIONS_TABLE || "DonationsTable";

export const getUserDataRecord = async (userId: string) => {
    const result = await dynamoDB.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId }
    }));
    return result.Item;
};

export const getExpiredDonationsRecords = async (userId: string, role: string) => {
    let indexName = "";
    let keyCondition = "";

    if (role === "DONOR") {
        indexName = "DonorIndex";
        keyCondition = "donorId = :userId";
    } else if (role === "VOLUNTEER") {
        indexName = "VolunteerIndex";
        keyCondition = "volunteerId = :userId";
    } else {
        throw new Error("Role not supported for this action");
    }

    const params = {
        TableName: DONATIONS_TABLE,
        IndexName: indexName,
        KeyConditionExpression: keyCondition,
        FilterExpression: "#status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
            ":userId": userId,
            ":status": DonationStatus.EXPIRED
        }
    };

    const result = await dynamoDB.send(new QueryCommand(params));
    return result.Items;
};

export const updateUserDataRecord = async (userId: string, updateExpression: string, expressionAttributeNames: any, expressionAttributeValues: any) => {
    const result = await dynamoDB.send(new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { userId },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW"
    }));
    return result.Attributes;
};

export const getDonationHistoryRecords = async (userId: string, role: string) => {
    let indexName = "";
    let keyCondition = "";

    if (role === "DONOR") {
        indexName = "DonorIndex";
        keyCondition = "donorId = :userId";
    } else if (role === "RECEIVER") {
        indexName = "ReceiverIndex";
        keyCondition = "receiverId = :userId";
    } else if (role === "VOLUNTEER") {
        indexName = "VolunteerIndex";
        keyCondition = "volunteerId = :userId";
    } else {
        throw new Error("Role not supported for this action");
    }

    const params = {
        TableName: DONATIONS_TABLE,
        IndexName: indexName,
        KeyConditionExpression: keyCondition,
        FilterExpression: "#status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
            ":userId": userId,
            ":status": DonationStatus.COMPLETED
        }
    };

    const result = await dynamoDB.send(new QueryCommand(params));
    return result.Items;
};
