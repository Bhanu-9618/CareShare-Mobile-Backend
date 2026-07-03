import { getLiveDonations, requestDonationRecord, getDonationsByReceiverAndStatus } from './service';

export const getLiveFeed = async () => {
    try {
        const feed = await getLiveDonations();
        return { statusCode: 200, body: JSON.stringify(feed) };
    } catch (error: any) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

export const requestDonation = async (event: any) => {
    try {
        const receiverId = event.requestContext?.authorizer?.claims?.sub;
        const donationId = event.pathParameters?.id;
        
        if (!donationId) return { statusCode: 400, body: JSON.stringify({ error: "Donation ID is required" }) };

        const updated = await requestDonationRecord(donationId, receiverId);
        return { statusCode: 200, body: JSON.stringify({ message: "Food requested successfully!", donation: updated }) };
    } catch (error: any) {
        if (error.name === "ConditionalCheckFailedException") {
            return { statusCode: 400, body: JSON.stringify({ message: "Sorry, this item is no longer live." }) };
        }
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

export const getPendingRequests = async (event: any) => {
    try {
        const receiverId = event.requestContext?.authorizer?.claims?.sub;
        const allRequested = await getDonationsByReceiverAndStatus(receiverId, "REQUESTED");
        
        const pending = allRequested.filter(item => !item.generated_otp);
        
        return { statusCode: 200, body: JSON.stringify(pending) };
    } catch (error: any) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

export const getReceiverHub = async (event: any) => {
    try {
        const receiverId = event.requestContext?.authorizer?.claims?.sub;
        const allRequested = await getDonationsByReceiverAndStatus(receiverId, "REQUESTED");
        
        const hubItems = allRequested.filter(item => item.generated_otp);
        
        return { statusCode: 200, body: JSON.stringify(hubItems) };
    } catch (error: any) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

export const getReceiverHistory = async (event: any) => {
    try {
        const receiverId = event.requestContext?.authorizer?.claims?.sub;
        const history = await getDonationsByReceiverAndStatus(receiverId, "COMPLETED");
        
        return { statusCode: 200, body: JSON.stringify(history) };
    } catch (error: any) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};