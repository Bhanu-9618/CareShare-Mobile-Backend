export interface Donation {
  donationId: string;
  donorId: string;
  foodName: string;
  quantity: string;
  location: string;
  status: 'ACTIVE' | 'COMPLETED';
  createdAt: string;
  expiryAt: number;
}