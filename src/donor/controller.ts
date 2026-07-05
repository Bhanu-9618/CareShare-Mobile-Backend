import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
(global as any).crypto = crypto;
import { createDonationRecord, getDonationsByStatus, getDonationsExcludeStatuses } from './service';
import { attachImageUrls } from "../lib/imageProcessor";
import { withRole } from '../common/middleware';
import { DonationStatus } from "../common/types";

const createDonationHandler = async (event: any) => { 
  const donorId = event.user.userId; 
  const { foodName, quantity, location, expiryTime, imageKey } = JSON.parse(event.body);
  const expiryTimestamp = Math.floor(new Date(expiryTime).getTime() / 1000);
  const newDonation = {
    donationId: uuidv4(),
    donorId,
    foodName,
    quantity,
    location,
    imageKey,
    status: DonationStatus.ACTIVE,
    createdAt: new Date().toISOString(),
    expiryAt: expiryTimestamp
  };

  await createDonationRecord(newDonation);
  return { statusCode: 201, body: JSON.stringify(newDonation) };
};

export const createDonation = withRole(['DONOR'], createDonationHandler);
const getAllDonationsHandler = async (event: any) => { 
  const donorId = event.user.userId;
  const result = await getDonationsExcludeStatuses(donorId, DonationStatus.COMPLETED, DonationStatus.EXPIRED);
  const feedWithImages = await attachImageUrls(result.Items || []);
  return { statusCode: 200, body: JSON.stringify(feedWithImages) };
};

export const getAllDonations = withRole(['DONOR'], getAllDonationsHandler);
const getDonationHistoryHandler = async (event: any) => { 
  const donorId = event.user.userId;
  const result = await getDonationsByStatus(donorId, DonationStatus.COMPLETED);
  const historyWithImages = await attachImageUrls(result.Items || []);
  return { statusCode: 200, body: JSON.stringify(historyWithImages) };
};

export const getDonationHistory = withRole(['DONOR'], getDonationHistoryHandler);