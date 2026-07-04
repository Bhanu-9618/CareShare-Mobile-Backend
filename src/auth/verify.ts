import { CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";
const cognito = new CognitoIdentityProvider({});

export const verifyEmail = async (event: any) => {
    const { email, code } = JSON.parse(event.body);
    try {
        await cognito.confirmSignUp({
            ClientId: process.env.COGNITO_CLIENT_ID!,
            Username: email,
            ConfirmationCode: code
        });
        return { statusCode: 200, body: JSON.stringify({ message: "Email verified successfully!" }) };
    } catch (error: any) {
        return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }
};