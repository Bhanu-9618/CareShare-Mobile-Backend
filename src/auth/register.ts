import { CognitoIdentityProviderClient, SignUpCommand, AdminConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new CognitoIdentityProviderClient({ region: "ap-southeast-1" });
const ddbClient = new DynamoDBClient({ region: "ap-southeast-1" });
const dynamoDB = DynamoDBDocumentClient.from(ddbClient);

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

    await client.send(new AdminConfirmSignUpCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email
    }));

    if (cognitoResponse.UserSub) {
      await dynamoDB.send(new PutCommand({
        TableName: "UsersTable",
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