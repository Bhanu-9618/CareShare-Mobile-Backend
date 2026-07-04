import { SignUpCommand, AdminConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { cognitoClient as client } from "../lib/cognito";
import { dynamoDB } from "../lib/db";

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
    const signUpCommand = new SignUpCommand(params);
    const cognitoResponse = await client.send(signUpCommand);

    if (cognitoResponse.UserSub) {
      await dynamoDB.send(new PutCommand({
        TableName: process.env.USERS_TABLE || "UsersTable",
        Item: {
          userId: cognitoResponse.UserSub,
          email: email,
          name: name,
          role: role,
          address: address,
          createdAt: new Date().toISOString()
        }
      }));
    }

    return { statusCode: 201, body: JSON.stringify({ message: "User registered successfully!" }) };
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }) };
  }
};