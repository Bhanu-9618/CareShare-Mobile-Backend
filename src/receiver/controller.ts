import { getLiveDonations, requestDonationRecord, getDonationsByReceiverAndStatus, expireOldDonationsRecords } from './service';
import { attachImageUrls } from "../lib/imageProcessor";
import { withRole } from '../common/middleware';
import { DonationStatus } from "../common/types";

const getLiveFeedHandler = async (event: any) => {
    try {
        const feed = await getLiveDonations();
        const feedWithImages = await attachImageUrls(feed || []);
        return { statusCode: 200, body: JSON.stringify(feedWithImages) };
    } catch (error: any) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

export const getLiveFeed = withRole(['RECEIVER'], getLiveFeedHandler);

const requestDonationHandler = async (event: any) => {
    try {
        const receiverId = event.user.userId;
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

export const requestDonation = withRole(['RECEIVER'], requestDonationHandler);

const getPendingRequestsHandler = async (event: any) => {
    try {
        const receiverId = event.user.userId;
        const allRequested = await getDonationsByReceiverAndStatus(receiverId, DonationStatus.REQUESTED);
        const pending = allRequested.filter(item => !item.generated_otp);
        const pendingWithImages = await attachImageUrls(pending || []);
        return { statusCode: 200, body: JSON.stringify(pendingWithImages) };
    } catch (error: any) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

export const getPendingRequests = withRole(['RECEIVER'], getPendingRequestsHandler);

const getReceiverHubHandler = async (event: any) => {
    try {
        const receiverId = event.user.userId;
        const allRequested = await getDonationsByReceiverAndStatus(receiverId, DonationStatus.REQUESTED);
        const hubItems = allRequested.filter(item => item.generated_otp);
        const feedWithImages = await attachImageUrls(hubItems || []);
        return { statusCode: 200, body: JSON.stringify(feedWithImages) };
    } catch (error: any) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

export const getReceiverHub = withRole(['RECEIVER'], getReceiverHubHandler);



const expireDonationsHandler = async (event: any) => {
    try {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const expiredCount = await expireOldDonationsRecords(currentTimestamp);
        
        return { 
            statusCode: 200, 
            body: JSON.stringify({ message: `Successfully checked and expired ${expiredCount} donations.` }) 
        };
    } catch (error: any) {
        console.error("Expire donations error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to expire donations" }) };
    }
};

export const expireDonations = withRole(['RECEIVER', 'DONOR', 'VOLUNTEER'], expireDonationsHandler);