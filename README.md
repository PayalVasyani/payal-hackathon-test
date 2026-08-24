# LoadFlow 

A next-generation Freight Brokerage Platform built to streamline logistics, enhance compliance, and bring AI-powered insights to freight management. 

##  Key Features

###  AI Route & Weather Advisor (Powered by Google Gemini)
LoadFlow leverages the cutting-edge **Google Gemini** model to instantly synthesize and provide intelligent route and weather conditions for active freight loads. Brokers and carriers can instantly get AI-driven advice for specific origin-destination pairs directly in the dashboard, improving safety and logistical planning without manual research.

### Enterprise-Grade Compliance & RBAC
- **Strict Role-Based Access Control:** Distinct roles for Shippers, Brokers, and Carriers, ensuring users only see and interact with what they are authorized to.
- **Automated Compliance Engine:** Hard blocks on carrier assignment if DOT authority is inactive, insurance is expired, or equipment is unauthorized (with secure override capabilities).

### Seamless Load Management Lifecycle
- Post, manage, and track loads from creation to delivery.
- **Dynamic Rate Confirmation:** Negotiate and confirm draft rates securely.
- **Digital Proof of Delivery (POD):** Carriers can easily upload digital PODs for rapid verification and invoicing.

## Technology Stack
- **Frontend:** Angular, Vanilla CSS, TypeScript
- **Backend:** NestJS, TypeScript, Prisma (ORM)
- **Database:** PostgreSQL (hosted via Supabase)
- **AI Integration:** `@google/genai` (Gemini API)

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Google Gemini API Key

### Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Configure your environment variables in `backend/.env`:
   ```env
   DATABASE_URL="your-database-url"
   GEMINI_API_KEY="your-gemini-api-key"
   ```
4. Run the server: `npm run start:dev`

### Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Run the development server: `npm start`
4. The application will be available at `http://localhost:4200`

## Hackathon Notes
This project was designed with a focus on **modern aesthetics, robust security, and practical AI application**. The integration of Gemini AI solves a real-world problem for logistics coordinators by eliminating the manual friction of route condition analysis.
