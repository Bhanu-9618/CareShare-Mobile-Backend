import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
(global as any).crypto = crypto;
import { createDonationRecord, getDonationsByStatus } from './service';
import { attachImageUrls } from "../lib/imageProcessor";

export const createDonation = async (event: any) => {
  const donorId = event.requestContext?.authorizer?.claims?.sub;
  if (!donorId) {
    return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized: Invalid token or user ID missing' })
    };
  }
  const { foodName, quantity, location, expiryTime, imageKey } = JSON.parse(event.body);
  const expiryTimestamp = Math.floor(new Date(expiryTime).getTime() / 1000);
  
  const newDonation = {
    donationId: uuidv4(),
    donorId,
    foodName,
    quantity,
    location,
    imageKey,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    expiryAt: expiryTimestamp
  };

  await createDonationRecord(newDonation);
  return { statusCode: 201, body: JSON.stringify(newDonation) };
};

export const getActiveDonations = async (event: any) => {
  const donorId = event.requestContext?.authorizer?.claims?.sub;
  if (!donorId) {
    return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized: Invalid token or user ID missing' })
    };
  }
  const result = await getDonationsByStatus(donorId, "ACTIVE");
  const feedWithImages = await attachImageUrls(result.Items || []);
  return { statusCode: 200, body: JSON.stringify(feedWithImages) };
};

export const getDonationHistory = async (event: any) => {
  const donorId = event.requestContext?.authorizer?.claims?.sub;
  if (!donorId) {
    return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized: Invalid token or user ID missing' })
    };
  }
  const result = await getDonationsByStatus(donorId, "COMPLETED");
  const historyWithImages = await attachImageUrls(result.Items || []);
  return { statusCode: 200, body: JSON.stringify(historyWithImages) };
};