import { CognitoIdentityProviderClient, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: "ap-southeast-1" });

export const register = async (event: any) => {
  const { email, password, name, role, address } = JSON.parse(event.body);

  const params = {
    ClientId: process.env.COGNITO_CLIENT_ID!,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: "name", Value: name },
      { Name: "custom:role", Value: role },
      { Name: "address", Value: address }
    ]
  };

  try {
    const command = new SignUpCommand(params);
    await client.send(command);
    return { statusCode: 201, body: JSON.stringify({ message: "User registered successfully!" }) };
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }) };
  }
};