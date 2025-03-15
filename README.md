# RoadAssist App

A roadside assistance application for vehicle diagnostics and emergency assistance.

## Project Structure

- **roadassist-app**: The main Next.js application frontend
- **roadassist-backend**: Backend server for API integration
- **roadassist-frontend**: Additional frontend components

## Features

- Real-time vehicle diagnostics
- Emergency roadside assistance
- AI-powered support
- Image recognition for vehicle issues
- Location tracking and service dispatch
- Customer ticket management
- AI voice calling integration with Bland.ai

## Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/roadassist-app.git

# Navigate to the project directory
cd roadassist-app

# Install dependencies for frontend
cd roadassist-app
npm install

# Install dependencies for backend
cd ../roadassist-backend
npm install
```

## Environment Setup

1. Copy the `.env` file and update it with your actual values:

   ```bash
   # From the project root
   cp roadassist-app/.env roadassist-app/.env.bak
   ```

2. Update the `.env` file with your actual values:

   - `BLAND_API_KEY`: Your Bland.ai API key
   - `BLAND_WEBHOOK_SECRET`: A secure random string for webhook signing
   - `BLAND_WEBHOOK_URL`: Your Vercel deployment URL + `/api/bland-webhook`

3. For Vercel deployment, add these environment variables in your project settings.

> Note: The `.env` file is ignored in version control to prevent sensitive data from being committed.

## Running the Project

```bash
# Start the backend server
cd roadassist-backend
npm run dev

# In a separate terminal, start the frontend
cd roadassist-app
npm run dev
```

The application will be available at http://localhost:3000

## Webhook Integration

This project integrates with Bland.ai for voice calling capabilities:

1. When a customer requests assistance, the app can initiate an AI phone call
2. The Bland.ai service will call the customer's phone number
3. The AI agent will gather information about the vehicle issue
4. Webhooks from Bland.ai will update the ticket in real-time
5. Call transcripts are saved and associated with the support ticket

## Deployment

1. Push your code to GitHub
2. Import the repository to Vercel
3. Set up environment variables in Vercel project settings
4. Deploy the project
5. Update the `BLAND_WEBHOOK_URL` environment variable with your deployed URL
6. Redeploy to apply the updated webhook URL

## License

MIT
