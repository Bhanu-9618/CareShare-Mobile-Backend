# CareShare - Backend Architecture

CareShare is a serverless platform built to reduce food waste by connecting food donors, volunteers, and receivers in a seamless, real-time marketplace.

---

## 🛠️ Tech Stack & Infrastructure

* **Language:** TypeScript / Node.js (Node 22.x)
* **Framework:** Serverless Framework (Infrastructure as Code)
* **Compute:** AWS Lambda
* **Routing & API:** AWS API Gateway
* **Database:** AWS DynamoDB (NoSQL, Pay-Per-Request)
* **Authentication:** AWS Cognito (User Pools, JWT, Role-Based Access Control)
* **Storage:** AWS S3 (Secure Presigned URLs for Image Storage)
* **Tooling & Build:** `esbuild` for ultra-fast transpilation and bundling, using modular `AWS SDK v3` for optimized cold starts.

---

## 🚀 Engineering Highlights

* **100% Serverless:** The platform automatically scales based on demand, ensuring zero maintenance costs and high reliability.
* **Optimized Database Queries:** By using data denormalization in DynamoDB, we bypass complex database joins, ensuring instant data retrieval for every user request.
* **Strict Role Management:** Integrated JWT-based middleware ensures that Donors, Volunteers, and Receivers only access their authorized endpoints.
* **Task Limiting:** To prevent volunteer task hoarding, the system enforces a dynamic rule where no volunteer can hold more than 5 active tasks simultaneously.
* **Secure Delivery:** Handoffs are protected by an OTP-based verification system, ensuring that food is delivered only to the verified receiver.

---

## 🔄 How the System Works

The backend handles a three-way interaction lifecycle:

### 1. Donor (Creation)
Donors authenticate via Cognito, upload food photos directly to S3 using secure presigned URLs, and create an **ACTIVE** donation listing.

### 2. Volunteer (Logistics)
Volunteers browse available donations, claim them (if they have capacity), and update the status to **ACCEPTED**. Once they pick up the food, the status becomes **LIVE**, signaling availability for receivers.

### 3. Receiver (Delivery)
Receivers request **LIVE** donations. The backend securely locks the transaction until the volunteer confirms delivery using a One-Time Password (OTP) provided by the receiver. Once verified, the donation status is marked **COMPLETED**.
