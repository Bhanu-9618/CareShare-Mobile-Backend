import { getSignedUploadUrl } from "../lib/s3";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";
(global as any).crypto = crypto;
import { ConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import { cognitoClient as cognito } from "../lib/cognito";
import { withRole } from './middleware';
import { attachImageUrls } from "../lib/imageProcessor";
import { getUserDataRecord, getExpiredDonationsRecords, updateUserDataRecord } from "./service";

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

        const item = await getUserDataRecord(userId);

        if (!item) {
            return { statusCode: 404, body: JSON.stringify({ error: "User not found" }) };
        }

        const { address, email, name, role } = item;

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

const getExpiredDonationsHandler = async (event: any) => {
    try {
        const { userId, role } = event.user;
        const items = await getExpiredDonationsRecords(userId, role);
        const expiredWithImages = await attachImageUrls(items || []);
        
        return { statusCode: 200, body: JSON.stringify(expiredWithImages) };
    } catch (error: any) {
        if (error.message === "Role not supported for this action") {
            return { statusCode: 403, body: JSON.stringify({ error: error.message }) };
        }
        console.error("Get expired donations error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch expired donations" }) };
    }
};

export const getExpiredDonations = withRole(['DONOR', 'VOLUNTEER'], getExpiredDonationsHandler);

const updateUserDataHandler = async (event: any) => {
    try {
        const userId = event.pathParameters?.id;
        if (!userId) {
            return { statusCode: 400, body: JSON.stringify({ error: "User ID is required" }) };
        }
        if (event.user.userId !== userId) {
            return { statusCode: 403, body: JSON.stringify({ error: "Forbidden: You can only update your own profile" }) };
        }

        let body;
        try {
            body = JSON.parse(event.body || "{}");
        } catch {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
        }

        const { name, address } = body;
        if (!name && !address) {
            return { statusCode: 400, body: JSON.stringify({ error: "At least one of 'name' or 'address' is required to update" }) };
        }

        let updateExpression = "SET";
        const expressionAttributeNames: any = {};
        const expressionAttributeValues: any = {};

        if (name) {
            updateExpression += " #n = :name";
            expressionAttributeNames["#n"] = "name";
            expressionAttributeValues[":name"] = name;
        }

        if (address) {
            if (name) updateExpression += ",";
            updateExpression += " #a = :address";
            expressionAttributeNames["#a"] = "address";
            expressionAttributeValues[":address"] = address;
        }

        const updatedUser = await updateUserDataRecord(userId, updateExpression, expressionAttributeNames, expressionAttributeValues) || {};
        
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                message: "Profile updated successfully", 
                user: {
                    name: updatedUser.name,
                    address: updatedUser.address,
                    email: updatedUser.email,
                    role: updatedUser.role
                }
            })
        };
    } catch (error: any) {
        console.error("Update user error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to update user data" })
        };
    }
};

export const updateUserData = withRole(['DONOR', 'RECEIVER', 'VOLUNTEER'], updateUserDataHandler);