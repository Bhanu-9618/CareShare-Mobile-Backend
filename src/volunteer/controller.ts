import { getActiveFeed, getOngoingTasksCount, claimDonationRecord } from './service';

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