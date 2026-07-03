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

export const getVolunteerFeed = async (event: any) => {
    try {
        const volunteerId = event.requestContext?.authorizer?.claims?.sub;
        if (!volunteerId) return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };

        const feed = await getActiveFeed();
        return { statusCode: 200, body: JSON.stringify(feed) };
    } catch (error: any) {
        console.error("DEBUG ERROR:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch feed", details: error.message }) };
    }
};
export const claimDonation = async (event: any) => {
    try {
        const volunteerId = event.requestContext?.authorizer?.claims?.sub;
        if (!volunteerId) return { statusCode: 401, body: 'Unauthorized' };

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

export const getOngoingTasks = async (event: any) => {
    try {
        const volunteerId = event.requestContext?.authorizer?.claims?.sub;
        if (!volunteerId) return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };

        const tasks = await getOngoingTasksByVolunteer(volunteerId);
        return { statusCode: 200, body: JSON.stringify(tasks) };
    } catch (error: any) {
        console.error("Error fetching ongoing tasks:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch ongoing tasks", details: error.message }) };
    }
};

export const pickupDonation = async (event: any) => {
    try {
        const volunteerId = event.requestContext?.authorizer?.claims?.sub;
        if (!volunteerId) return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };

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

export const getVolunteerInventory = async (event: any) => {
    try {
        const volunteerId = event.requestContext?.authorizer?.claims?.sub;
        if (!volunteerId) return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };

        const inventory = await getInventoryByVolunteer(volunteerId);
        return { statusCode: 200, body: JSON.stringify(inventory) };
    } catch (error: any) {
        console.error("Error fetching inventory:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch inventory", details: error.message }) };
    }
};

export const confirmRequest = async (event: any) => {
    try {
        const volunteerId = event.requestContext?.authorizer?.claims?.sub;
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

export const deliverDonation = async (event: any) => {
    try {
        const volunteerId = event.requestContext?.authorizer?.claims?.sub;
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

export const getVolunteerHistory = async (event: any) => {
    try {
        const volunteerId = event.requestContext?.authorizer?.claims?.sub;
        const history = await getHistoryByVolunteer(volunteerId);
        
        return { statusCode: 200, body: JSON.stringify(history) };
    } catch (error: any) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};