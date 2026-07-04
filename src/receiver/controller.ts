import { getLiveDonations, requestDonationRecord, getDonationsByReceiverAndStatus } from './service';
import { attachImageUrls } from "../lib/imageProcessor";

export const getLiveFeed = async () => {
    try {
        const feed = await getLiveDonations();
        const feedWithImages = await attachImageUrls(feed || []);
        return { statusCode: 200, body: JSON.stringify(feedWithImages) };
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
        const pendingWithImages = await attachImageUrls(pending || []);
        return { statusCode: 200, body: JSON.stringify(pendingWithImages) };
    } catch (error: any) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

export const getReceiverHub = async (event: any) => {
    try {
        const receiverId = event.requestContext?.authorizer?.claims?.sub;
        const allRequested = await getDonationsByReceiverAndStatus(receiverId, "REQUESTED");
        
        const hubItems = allRequested.filter(item => item.generated_otp);
        const feedWithImages = await attachImageUrls(hubItems || []);
        return { statusCode: 200, body: JSON.stringify(feedWithImages) };
    } catch (error: any) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

export const getReceiverHistory = async (event: any) => {
    try {
        const receiverId = event.requestContext?.authorizer?.claims?.sub;
        const history = await getDonationsByReceiverAndStatus(receiverId, "COMPLETED");
        const historyWithImages = await attachImageUrls(history || []);
        return { statusCode: 200, body: JSON.stringify(historyWithImages) };
    } catch (error: any) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};