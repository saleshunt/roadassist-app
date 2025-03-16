require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const http = require('http'); // Add HTTP server

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3002;

// Create HTTP server (without Socket.io)
const server = http.createServer(app);

// Configure OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Ensure data directories exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const analysisStorageFile = path.join(dataDir, 'image-analyses.json');
if (!fs.existsSync(analysisStorageFile)) {
  fs.writeFileSync(analysisStorageFile, JSON.stringify({}), 'utf8');
}

// Helper function to save image analysis
function saveImageAnalysis(imageIds, analysis) {
  try {
    let analysisData = {};
    if (fs.existsSync(analysisStorageFile)) {
      const fileContent = fs.readFileSync(analysisStorageFile, 'utf8');
      analysisData = JSON.parse(fileContent);
    }
    
    // Generate a unique ID for this analysis
    const analysisId = Date.now().toString();
    
    // Store the analysis with timestamp and image references
    analysisData[analysisId] = {
      timestamp: new Date().toISOString(),
      imageIds: imageIds,
      analysis: analysis,
    };
    
    // Save back to file
    fs.writeFileSync(analysisStorageFile, JSON.stringify(analysisData, null, 2), 'utf8');
    
    return analysisId;
  } catch (error) {
    console.error('Error saving image analysis:', error);
    return null;
  }
}

// Helper function to get image analysis by ID
function getImageAnalysis(analysisId) {
  try {
    if (fs.existsSync(analysisStorageFile)) {
      const fileContent = fs.readFileSync(analysisStorageFile, 'utf8');
      const analysisData = JSON.parse(fileContent);
      return analysisData[analysisId] || null;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving image analysis:', error);
    return null;
  }
}

// Helper function to get the most recent image analysis
function getLatestImageAnalysis() {
  try {
    if (fs.existsSync(analysisStorageFile)) {
      const fileContent = fs.readFileSync(analysisStorageFile, 'utf8');
      const analysisData = JSON.parse(fileContent);
      
      // Find the most recent analysis by timestamp
      const analysisIds = Object.keys(analysisData);
      if (analysisIds.length === 0) return null;
      
      const latestId = analysisIds.reduce((latest, current) => {
        return !latest || new Date(analysisData[current].timestamp) > new Date(analysisData[latest].timestamp) 
          ? current 
          : latest;
      }, null);
      
      return latestId ? analysisData[latestId] : null;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving latest image analysis:', error);
    return null;
  }
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadsDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
      }
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  })
});

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Simple ping test endpoint
app.get('/api/ping', (req, res) => {
  res.status(200).json({ 
    message: 'pong',
    timestamp: new Date().toISOString(),
    cors: 'enabled' 
  });
});

// Endpoint for image analysis
app.post('/api/analyze-image', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    // Prepare all images for processing
    const imageContents = [];
    const imagePaths = [];
    
    // Process all images and add them to the content array
    for (const file of req.files) {
      const imageBuffer = fs.readFileSync(file.path);
      const base64Image = imageBuffer.toString('base64');
      
      // Add the image to the content array
      imageContents.push({ 
        type: "image_url", 
        image_url: { 
          url: `data:image/${path.extname(file.path).substring(1)};base64,${base64Image}`
        }
      });
      
      // Store the path for the response
      imagePaths.push(file.path.replace(/\\/g, '/'));
    }

    const question = req.body.question || `
      You are FormelD's AI Road Assistant, integrated into the in-car and app-based roadside assistance functionality. 
      Your task is to analyze ${req.files.length > 1 ? 'these uploaded images' : 'this uploaded image'} and generate a structured, one-paragraph summary of the vehicle's situation. 
      The ${req.files.length > 1 ? 'images' : 'image'} could contain a wide range of content, such as geographical or location information, car specifics, warning lights, 
      mechanical issues, accidents, or other road assistance-related details.
      
      Your response must always:
      - Clearly identify yourself as FormelD's AI Road Assistant.
      - Be written in a single, structured paragraph.
      - Start with: "Thank you for sharing ${req.files.length > 1 ? 'these images' : 'this image'}."
      - Provide a clear, concise analysis based on the ${req.files.length > 1 ? 'images' : 'image'}.
      - End with an explanation of how this analysis will assist the support team.

      ### Response Structure:
      1. **Acknowledgment** – Always begin with: "Thank you for sharing ${req.files.length > 1 ? 'these images' : 'this image'}."
      2. **Situation Summary** – Describe the key issues visible in the ${req.files.length > 1 ? 'images' : 'image'}.
      3. **Relevant Details** – If applicable, include:
         - **Vehicle Information** – Make, model, color, visible license plate (if legible).
         - **Warning Indicators** – Any dashboard alerts (e.g., check engine, battery, oil pressure).
         - **Accident or Damage Details** – Visible dents, broken lights, deployed airbags, fluid leaks, etc.
         - **Location Context** – Road conditions, landmarks, weather, traffic, or other relevant surroundings.
      4. **Conclusion** – End with how this information will help the support team provide better assistance.
      
      ${req.files.length > 1 ? 'Look at all images together to provide a complete picture. Compare and contrast details across images if they show different aspects of the same situation.' : ''}
    `;

    // Prepare the content array for the API call with text first, then all images
    const contentArray = [
      { type: "text", text: question },
      ...imageContents
    ];
    
    // Call OpenAI API with all images
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: contentArray
        }
      ],
      max_tokens: 500  // Increased token limit for multiple image analysis
    });

    // Extract the analysis from the response
    const analysis = response.choices[0].message.content;
    
    // Save the analysis locally with references to the image paths
    const analysisId = saveImageAnalysis(imagePaths, analysis);

    // Return the analysis along with the image paths and analysis ID
    res.status(200).json({
      analysis: analysis,
      imagePaths: imagePaths,
      analysisId: analysisId
    });
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: 'Failed to analyze image', details: error.message });
  }
});

// Endpoint to get the latest image analysis
app.get('/api/latest-image-analysis', (req, res) => {
  try {
    const analysis = getLatestImageAnalysis();
    
    if (!analysis) {
      return res.status(404).json({ error: 'No analysis found' });
    }
    
    res.status(200).json(analysis);
  } catch (error) {
    console.error('Error retrieving latest image analysis:', error);
    res.status(500).json({ error: 'Failed to retrieve latest image analysis', details: error.message });
  }
});

// Endpoint to get image analysis by ID
app.get('/api/image-analysis/:id', (req, res) => {
  try {
    const analysisId = req.params.id;
    const analysis = getImageAnalysis(analysisId);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    res.status(200).json(analysis);
  } catch (error) {
    console.error('Error retrieving image analysis:', error);
    res.status(500).json({ error: 'Failed to retrieve image analysis', details: error.message });
  }
});

// Modify the Bland AI call endpoint to remove webhook and streaming configuration
app.post('/api/bland-call', async (req, res) => {
  try {
    // Extract customer information from request
    if (!req.body.phone_number) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    const customerPhone = req.body.phone_number;
    const customerName = req.body.customer_name;
    const customerLocation = req.body.location;
    const customerVehicle = req.body.vehicle;
    const customerIssue = req.body.issue;
    
    // Get customer history/context if available
    let imageSummary = req.body.image_summary;
    
    // If no image summary was provided in the request, try to get the latest analysis
    if (!imageSummary && !req.body.pathway_id) { // Skip if using a pathway
      const latestAnalysis = getLatestImageAnalysis();
      if (latestAnalysis) {
        imageSummary = latestAnalysis.analysis;
        console.log('Using latest image analysis from:', latestAnalysis.timestamp);
      } else {
        imageSummary = "No image analysis available.";
      }
    }
    
    // Use provided customer history or default to empty data if not present
    const customerHistory = {
      previousIssues: req.body.previous_issues || [],
      lastServiceDate: req.body.last_service_date || "Not available",
      membership: req.body.membership || "Standard",
      imageSummary: imageSummary
    };
    
    // Format customer history into a readable string
    const historyText = `
      Customer Name: ${customerName || 'Not provided'}
      Previous Issues: ${customerHistory.previousIssues.length > 0 ? customerHistory.previousIssues.join(', ') : 'None recorded'}
      Last Service Date: ${customerHistory.lastServiceDate}
      Membership Level: ${customerHistory.membership}
      Image Analysis Summary: ${customerHistory.imageSummary}
    `;

    // Prepare Bland.ai API request
    const blandApiKey = process.env.BLAND_API_KEY;
    if (!blandApiKey) {
      return res.status(500).json({ error: 'Bland API key not configured' });
    }

    const headers = {
      'Authorization': `Bearer ${blandApiKey}`,
      'Content-Type': 'application/json'
    };

    // Initialize the basic Bland.ai API call parameters
    const data = {
      "phone_number": customerPhone.startsWith('+') ? 
        customerPhone.replace(/[\(\)\s-]/g, '') : // Remove brackets, spaces, and hyphens
        `+${customerPhone.replace(/[\(\)\s-]/g, '')}`, // Add + if needed and remove formatting
      "voice": "Paige",
      "wait_for_greeting": false,
      "record": true,
      "amd": false,
      "answered_by_enabled": false,
      "noise_cancellation": false,
      "interruption_threshold": 100,
      "block_interruptions": false,
      "max_duration": 12,
      "model": "enhanced", // Using the recommended enhanced model
      "language": req.body.language || "en", // Use customer's language preference if available
      "background_track": "none",
      "endpoint": "https://api.bland.ai",
      "voicemail_action": "hangup",
      "json_mode_enabled": false
    };
    
    // Check if we're using a Conversational Pathway
    if (req.body.pathway_id) {
      console.log(`Using Conversational Pathway: ${req.body.pathway_id}`);
      // Set the pathway_id
      data.pathway_id = req.body.pathway_id;
      
      // If variables were explicitly provided in the request, use those
      if (req.body.variables) {
        data.variables = req.body.variables;
        console.log('Using provided variables for pathway');
        
        // If the customer has a preferred language in variables, update the main language setting
        if (data.variables.preferred_language) {
          data.language = data.variables.preferred_language;
          console.log(`Using customer's preferred language: ${data.language}`);
        }
      } else {
        // If no variables were explicitly provided but we have customer info,
        // create default variables from the available customer information
        console.log('Creating default variables from customer info');
        data.variables = {
          customer_name: customerName,
          vehicle_model: customerVehicle,
          location: customerLocation,
          issue: customerIssue,
          membership_level: customerHistory.membership,
          last_service_date: customerHistory.lastServiceDate,
          image_analysis: imageSummary,
          preferred_language: req.body.language || 'en' // Add customer's language preference
        };
        
        // Update the main language setting with customer's preference
        if (req.body.language) {
          data.language = req.body.language;
          console.log(`Using customer's preferred language: ${data.language}`);
        }
        
        // Include any additional customer data as variables that might be useful
        if (req.body.vehicle_year) {
          data.variables.vehicle_year = req.body.vehicle_year;
        }
        if (req.body.license_plate) {
          data.variables.license_plate = req.body.license_plate;
        }
      }
    } else {
      // If not using a Pathway, use the standard task/prompt approach
      data.task = `You are the FormelD Road Assistance AI agent. A customer named ${customerName || 'the customer'} with a ${customerVehicle || 'vehicle'} has requested roadside assistance from ${customerLocation || 'their current location'}. They have reported the following issue: "${customerIssue || 'a vehicle issue'}".
      
      This is what we know about the customer from their history:
      ${historyText}
      
      Introduce yourself as the FormelD Road Assistance AI. ${customerName ? `Acknowledge that you're speaking with ${customerName}` : 'Ask for the customer\'s name'} and mention that you have access to their customer profile.
      
      ${customerHistory.membership ? `Briefly reference their membership level (${customerHistory.membership})` : ''} ${customerHistory.previousIssues.length > 0 ? 'and recent service history' : ''} to personalize the conversation. Then confirm their current location and the issue they're experiencing with their vehicle.
      
      If their reported issue matches their image analysis summary, acknowledge this consistency. Ask them if there are any additional details about their situation they'd like to add.
      
      Inform them that you are creating a ticket for their issue and will dispatch assistance to their location. 
      
      Estimate an arrival time of 30-45 minutes for assistance. Ask if they require any immediate emergency services (like police or ambulance). If they do, advise them to hang up and call emergency services directly.
      
      Before ending the call, summarize the information collected and confirm the next steps. Provide a ticket number (use a random 6-digit number) for reference and let them know they will receive updates via SMS.
      
      Thank them for using FormelD Road Assistance and end the call politely.`;
    }

    // Make API request to Bland.ai
    const axios = require('axios');
    
    // Log the API request for debugging (remove sensitive data in production)
    console.log('Sending Bland.ai API request:', {
      url: 'https://api.bland.ai/v1/calls',
      headers: { 'Content-Type': headers['Content-Type'] }, // Don't log the actual API key
      data: { 
        ...data, 
        phone_number: '****',  // Mask phone
        pathway_id: data.pathway_id ? 'Using Pathway ID: ' + data.pathway_id : 'No pathway'
      }
    });
    
    const blandResponse = await axios.post('https://api.bland.ai/v1/calls', data, { headers });

    // Return call_id and status to client along with customer info that was used
    res.status(200).json({ 
      callId: blandResponse.data.call_id,
      status: blandResponse.data.status,
      message: 'Call initiated successfully',
      customerInfo: {
        name: customerName,
        phone: customerPhone.replace(/\d(?=\d{4})/g, '*').replace(/\(\d\)/, '(*)')  // Mask digits and ensure bracket format is preserved
                .replace(/\s\d\d\d\d\d/, ' *****'), // Mask first part of number
        vehicle: customerVehicle,
        location: customerLocation,
        issue: customerIssue,
        membershipLevel: customerHistory.membership,
        usingPathway: !!data.pathway_id
      }
    });
  } catch (error) {
    console.error('Error initiating Bland.ai call:', error);
    
    // Provide more detailed error information
    let errorDetails = error.message;
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Bland.ai API error response:', {
        status: error.response.status,
        data: error.response.data
      });
      errorDetails = `API responded with status ${error.response.status}: ${JSON.stringify(error.response.data)}`;
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Bland.ai API no response:', error.request);
      errorDetails = 'No response received from Bland.ai API';
    }
    
    res.status(500).json({ 
      error: 'Failed to initiate call', 
      details: errorDetails
    });
  }
});

// Use the HTTP server instead
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 