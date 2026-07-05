import { getSignedUploadUrl } from "../lib/s3";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";
(global as any).crypto = crypto;
import { ConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import { cognitoClient as cognito } from "../lib/cognito";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDB } from "../lib/db";
import { withRole } from './middleware';

export const getUploadUrl = async (event: any) => {
    const filename = event.queryStringParameters?.filename || "image.jpg";
    const key = `donations/${uuidv4()}-${filename}`;
    const url = await getSignedUploadUrl(key);
    
    return {
        statusCode: 200,
        body: JSON.stringify({ uploadUrl: url, imageKey: key })
    };
};

export const verifyEmail = async (event: any) => {
    try {
        const { email, code } = JSON.parse(event.body);
        
        await cognito.send(new ConfirmSignUpCommand({
            ClientId: process.env.COGNITO_CLIENT_ID!,
            Username: email,
            ConfirmationCode: code
        }));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Email verified successfully!" })
        };
    } catch (error: any) {
        console.error("Verification error:", error);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: error.message || "Verification failed" })
        };
    }
};

const getUserDataHandler = async (event: any) => {
    try {
        const userId = event.pathParameters?.id;
        if (!userId) {
            return { statusCode: 400, body: JSON.stringify({ error: "User ID is required" }) };
        }

        const TABLE_NAME = process.env.USERS_TABLE || "UsersTable";
        const result = await dynamoDB.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { userId }
        }));

        if (!result.Item) {
            return { statusCode: 404, body: JSON.stringify({ error: "User not found" }) };
        }

        const { address, email, name, role } = result.Item;

        return {
            statusCode: 200,
            body: JSON.stringify({ address, email, name, role })
        };
    } catch (error: any) {
        console.error("Get user error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to fetch user data" })
        };
    }
};

export const getUserData = withRole(['DONOR', 'RECEIVER', 'VOLUNTEER'], getUserDataHandler);