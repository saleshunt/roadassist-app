# RoadAssist App

A roadside assistance application for vehicle diagnostics and emergency assistance.

## Project Structure

- **roadassist-app**: The main Next.js application frontend
- **roadassist-backend**: Backend server for API integration and OpenAI processing

## Features

- Real-time vehicle diagnostics
- Emergency roadside assistance
- AI-powered support
- Image recognition for vehicle issues
- Location tracking and service dispatch
- Customer ticket management
- AI voice calling integration with Bland.ai

## Key Features

- AI-powered roadside assistance
- Real-time call transcription
- Image analysis for vehicle issues
- Agent dashboard for support personnel
- Customer mobile interface
- User management system with CRUD operations
- Ticket tracking and management

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

3. Set up backend environment:

   ```bash
   # From the project root
   cp roadassist-backend/.env roadassist-backend/.env.bak
   ```

   Update the backend `.env` file:

   - `PORT`: Should be set to 3002
   - `OPENAI_API_KEY`: Your OpenAI API key

4. For Vercel deployment, add these environment variables in your project settings.

> Note: The `.env` files are ignored in version control to prevent sensitive data from being committed.

## Environment Variables

### Frontend (Next.js)

The frontend application uses the following environment variables:

- `NEXT_PUBLIC_BACKEND_URL`: URL of the backend server (default: `http://localhost:3002`)
- `BLAND_WEBHOOK_URL`: URL for Bland AI webhook callbacks
- `BLAND_API_KEY`: Your Bland AI API key
- `BLAND_WEBHOOK_SECRET`: Your Bland AI webhook secret
- `NEXT_PUBLIC_ENABLE_TESTING_TOOLS`: Enable testing tools (set to `"true"` to enable)

Create or edit `.env.local` file in the `roadassist-app` directory to set these variables.

### Backend (Express)

The backend server uses the following environment variables:

- `PORT`: Port number for the server (default: `3002`)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS (default: localhost origins)
- `BLAND_API_KEY`: Your Bland AI API key
- `BLAND_WEBHOOK_SECRET`: Your Bland AI webhook secret
- `BLAND_WEBHOOK_URL`: URL for Bland AI webhook callbacks

Create or edit `.env` file in the `roadassist-backend` directory to set these variables.

## Development Best Practices

- Never hardcode backend URLs, API keys, or other configuration values in your code
- Always use environment variables for configuration
- For local development, use `.env.local` files (which are gitignored)
- For production, set environment variables in your hosting environment

## Running the Project

### Running the Backend Server

Navigate to the backend directory from the project root:

```bash
cd roadassist-backend
```

Start the backend server using Node.js:

```bash
node server.js
```

For development with automatic restart:

```bash
npm run dev
```

You should see the message "Server running on port 3002" indicating that the backend is running successfully.

### Running the Frontend Application

In a separate terminal, navigate to the frontend directory from the project root:

```bash
cd roadassist-app
```

Start the Next.js development server:

```bash
npm run dev
```

The frontend application will be available at http://localhost:3000

### Running Both Services Concurrently

You can use a package like `concurrently` to run both services with a single command. First, install it in the root directory:

```bash
npm install --save-dev concurrently
```

Then, add a script to the root `package.json` (or create one if it doesn't exist):

```json
{
  "name": "roadassist",
  "scripts": {
    "dev": "concurrently \"cd roadassist-backend && npm run dev\" \"cd roadassist-app && npm run dev\""
  },
  "devDependencies": {
    "concurrently": "^8.0.0"
  }
}
```

Now you can run both services with:

```bash
npm run dev
```

### Important Notes

- Both servers (frontend and backend) need to be running simultaneously for the application to work properly
- The frontend makes API calls to the backend on port 3002
- Make sure you're in the correct directory when running each command
- If you encounter "module not found" errors, verify you're in the correct directory

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
