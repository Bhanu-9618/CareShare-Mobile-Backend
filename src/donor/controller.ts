import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
(global as any).crypto = crypto;
import { createDonationRecord, getDonationsByStatus } from './service';

export const createDonation = async (event: any) => {
  const donorId = event.requestContext.authorizer?.claims?.sub || "test-donor";
  const { foodName, quantity, location } = JSON.parse(event.body);

  const newDonation = {
    donationId: uuidv4(),
    donorId,
    foodName,
    quantity,
    location,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    expiryAt: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  };

  await createDonationRecord(newDonation);
  return { statusCode: 201, body: JSON.stringify(newDonation) };
};

export const getActiveDonations = async (event: any) => {
  const donorId = event.requestContext.authorizer?.claims?.sub || "test-donor";
  const result = await getDonationsByStatus(donorId, "ACTIVE");
  return { statusCode: 200, body: JSON.stringify(result.Items) };
};

export const getDonationHistory = async (event: any) => {
  const donorId = event.requestContext.authorizer?.claims?.sub || "test-donor";
  const result = await getDonationsByStatus(donorId, "COMPLETED");
  return { statusCode: 200, body: JSON.stringify(result.Items) };
};