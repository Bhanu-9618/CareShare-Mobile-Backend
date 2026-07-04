import {
    getActiveFeed,
    getOngoingTasksCount,
    claimDonationRecord,
    getOngoingTasksByVolunteer,
    pickupDonationRecord,
    getInventoryByVolunteer,
    confirmDonationRequestRecord,
    getDonationById,
    completeDonationRecord,
    getHistoryByVolunteer   
} from './service';
import { attachImageUrls } from "../lib/imageProcessor";
import { withRole } from '../common/middleware';

const getVolunteerFeedHandler = async (event: any) => {
    try {
        const feed = await getActiveFeed();
        const feedWithImages = await attachImageUrls(feed || []);
        return { statusCode: 200, body: JSON.stringify(feedWithImages) };
    } catch (error: any) {
        console.error("DEBUG ERROR:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch feed", details: error.message }) };
    }
};

export const getVolunteerFeed = withRole(['VOLUNTEER'], getVolunteerFeedHandler);

const claimDonationHandler = async (event: any) => {
    try {
        const volunteerId = event.user.userId;
        const donationId = event.pathParameters?.id;
        if (!donationId) return { statusCode: 400, body: JSON.stringify({ error: "Donation ID is required" }) };

        const ongoingCount = await getOngoingTasksCount(volunteerId);
        if (ongoingCount >= 5) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "You have reached the maximum limit of 5 ongoing tasks." })
            };
        }
        const updatedDonation = await claimDonationRecord(donationId, volunteerId);
        
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                message: "Donation claimed successfully!", 
                donation: updatedDonation 
            })
        };
    } catch (error: any) {
        if (error.name === "ConditionalCheckFailedException") {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Sorry, this donation is no longer available or already claimed." })
            };
        }
        console.error(error);
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to claim donation" }) };
    }
};

export const claimDonation = withRole(['VOLUNTEER'], claimDonationHandler);

const getOngoingTasksHandler = async (event: any) => {
    try {
        const volunteerId = event.user.userId;
        const tasks = await getOngoingTasksByVolunteer(volunteerId);
        const feedWithImages = await attachImageUrls(tasks || []);
        return { statusCode: 200, body: JSON.stringify(feedWithImages) };
    } catch (error: any) {
        console.error("Error fetching ongoing tasks:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch ongoing tasks", details: error.message }) };
    }
};

export const getOngoingTasks = withRole(['VOLUNTEER'], getOngoingTasksHandler);

const pickupDonationHandler = async (event: any) => {
    try {
        const volunteerId = event.user.userId;
        const donationId = event.pathParameters?.id;
        if (!donationId) return { statusCode: 400, body: JSON.stringify({ error: "Donation ID is required" }) };

        const updatedDonation = await pickupDonationRecord(donationId, volunteerId);
        
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                message: "Donation picked up successfully! It is now LIVE.", 
                donation: updatedDonation 
            })
        };
    } catch (error: any) {
        console.error("Error picking up donation:", error);
        if (error.name === "ConditionalCheckFailedException") {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid action. The donation might not belong to you or is not in 'ACCEPTED' status." })
            };
        }
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to pickup donation", details: error.message }) };
    }
};

export const pickupDonation = withRole(['VOLUNTEER'], pickupDonationHandler);

const getVolunteerInventoryHandler = async (event: any) => {
    try {
        const volunteerId = event.user.userId;
        const inventory = await getInventoryByVolunteer(volunteerId);
        const feedWithImages = await attachImageUrls(inventory || []);
        return { statusCode: 200, body: JSON.stringify(feedWithImages) };
    } catch (error: any) {
        console.error("Error fetching inventory:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch inventory", details: error.message }) };
    }
};

export const getVolunteerInventory = withRole(['VOLUNTEER'], getVolunteerInventoryHandler);

const confirmRequestHandler = async (event: any) => {
    try {
        const volunteerId = event.user.userId;
        const donationId = event.pathParameters?.id;

        if (!donationId) return { statusCode: 400, body: JSON.stringify({ error: "Donation ID is required" }) };

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const updated = await confirmDonationRequestRecord(donationId, volunteerId, otp);

        return { statusCode: 200, body: JSON.stringify({ message: "Request confirmed", donation: updated }) };
    } catch (error: any) {
        if (error.name === "ConditionalCheckFailedException") {
            return { statusCode: 400, body: JSON.stringify({ message: "Invalid action" }) };
        }
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

export const confirmRequest = withRole(['VOLUNTEER'], confirmRequestHandler);

const deliverDonationHandler = async (event: any) => {
    try {
        const volunteerId = event.user.userId;
        const donationId = event.pathParameters?.id;
        
        if (!donationId) return { statusCode: 400, body: JSON.stringify({ error: "Donation ID is required" }) };

        const body = JSON.parse(event.body || "{}");
        const { otp } = body;

        if (!otp) return { statusCode: 400, body: JSON.stringify({ error: "OTP is required" }) };

        const donation = await getDonationById(donationId);

        if (!donation) return { statusCode: 404, body: JSON.stringify({ error: "Donation not found" }) };
        if (donation.volunteerId !== volunteerId) return { statusCode: 403, body: JSON.stringify({ error: "Unauthorized" }) };
        if (donation.generated_otp !== otp) return { statusCode: 400, body: JSON.stringify({ error: "Invalid OTP" }) };

        const updated = await completeDonationRecord(donationId, volunteerId);

        return { statusCode: 200, body: JSON.stringify({ message: "Delivery completed successfully", donation: updated }) };
    } catch (error: any) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

export const deliverDonation = withRole(['VOLUNTEER'], deliverDonationHandler);

const getVolunteerHistoryHandler = async (event: any) => {
    try {
        const volunteerId = event.user.userId;
        const history = await getHistoryByVolunteer(volunteerId);
        const historyWithImages = await attachImageUrls(history || []);
        return { statusCode: 200, body: JSON.stringify(historyWithImages) };
    } catch (error: any) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

export const getVolunteerHistory = withRole(['VOLUNTEER'], getVolunteerHistoryHandler);