import { getSignedUploadUrl } from "../lib/s3";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";
(global as any).crypto = crypto;
import { CognitoIdentityProviderClient, ConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

const cognito = new CognitoIdentityProviderClient({});

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