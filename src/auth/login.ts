import { InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import { cognitoClient as client } from "../lib/cognito";

export const login = async (event: any) => {
  const { email, password } = JSON.parse(event.body);
  
  const params = {
    AuthFlow: "USER_PASSWORD_AUTH" as const,
    ClientId: process.env.COGNITO_CLIENT_ID!,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password
    }
  };

  try {
    const command = new InitiateAuthCommand(params);
    const response = await client.send(command);
    return { statusCode: 200, body: JSON.stringify(response.AuthenticationResult) };
  } catch (error) {
    return { statusCode: 401, body: JSON.stringify({ error: "Invalid credentials" }) };
  }
};