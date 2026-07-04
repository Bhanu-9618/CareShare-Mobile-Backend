export const withRole = (allowedRoles: string[], handler: Function) => {
    return async (event: any, context: any) => {
        try {
            const claims = event.requestContext?.authorizer?.claims;
            
            if (!claims) {
                return { 
                    statusCode: 401, 
                    body: JSON.stringify({ error: "Unauthorized: No token provided or invalid token." }) 
                };
            }

            const userRole = claims['custom:role'];

            if (!userRole || !allowedRoles.includes(userRole)) {
                return { 
                    statusCode: 403, 
                    body: JSON.stringify({ error: `Forbidden: Access denied. Requires one of roles: ${allowedRoles.join(', ')}` }) 
                };
            }

            event.user = {
                email: claims.email,
                role: userRole,
                userId: claims.sub 
            };

            return await handler(event, context);
            
        } catch (error: any) {
            console.error("Middleware Error:", error);
            return { 
                statusCode: 500, 
                body: JSON.stringify({ error: "Internal Server Error in Authorization" }) 
            };
        }
    };
};