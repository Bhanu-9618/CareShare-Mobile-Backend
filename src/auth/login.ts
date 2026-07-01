import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: "ap-southeast-1" });

export const login = async (event: any) => {
  const { email, password } = JSON.parse(event.body);

  if (process.env.IS_OFFLINE) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Mock Login Successful",
        token: "mock-jwt-token-123456789",
        user: { email }
      })
    };
  }
  
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