require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const http = require('http'); // Add HTTP server
const { Server } = require('socket.io'); // Add Socket.io

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3002;

// Create HTTP server and Socket.io instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004'],
    methods: ['GET', 'POST']
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected for real-time updates', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

// Global object to track active calls
const activeCallsTranscripts = {};

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

// Serve test files for Bland.ai webhook testing
app.get('/test-bland-webhook', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-bland-webhook.html'));
});

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

// New endpoint for Bland AI streaming API
app.post('/api/bland-stream', express.json(), (req, res) => {
  try {
    const { call_id, transcript_segment, type } = req.body;
    
    // Log incoming stream data
    console.log(`Received stream data for call ${call_id}, type: ${type}`);
    
    // Initialize transcript array if this is a new call
    if (!activeCallsTranscripts[call_id]) {
      activeCallsTranscripts[call_id] = [];
    }
    
    // Add new segment to the transcript
    if (transcript_segment) {
      activeCallsTranscripts[call_id].push(transcript_segment);
      
      // Emit to all connected clients
      io.emit('transcript_update', {
        call_id,
        transcript_segment
      });
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling stream data:', error);
    res.status(200).json({ success: false, error: 'Error processing stream data' });
  }
});

// Add a test endpoint to simulate transcript updates
app.post('/api/test-transcript-stream', express.json(), (req, res) => {
  try {
    const { call_id, text, speaker } = req.body;
    
    if (!call_id || !text) {
      return res.status(400).json({ error: 'call_id and text are required' });
    }
    
    const transcriptSegment = {
      speaker: speaker || 'ai',
      text,
      timestamp: new Date().toISOString()
    };
    
    // Emit to connected clients
    io.emit('transcript_update', {
      call_id,
      transcript_segment: transcriptSegment
    });
    
    // Initialize if not exists
    if (!activeCallsTranscripts[call_id]) {
      activeCallsTranscripts[call_id] = [];
    }
    
    // Add to active calls
    activeCallsTranscripts[call_id].push(transcriptSegment);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in test transcript:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Add endpoint to handle Bland AI webhooks
app.post('/api/bland-webhook', express.json(), (req, res) => {
  try {
    const payload = req.body;
    
    // Log webhook data for debugging
    console.log('Received Bland AI webhook on backend:', payload);
    
    // Check if this is a valid webhook with a call_id
    if (!payload.call_id) {
      console.warn('Invalid webhook data: missing call_id');
      return res.status(400).json({ error: 'Missing call_id' });
    }
    
    // Initialize call transcript if needed
    if (!activeCallsTranscripts[payload.call_id]) {
      activeCallsTranscripts[payload.call_id] = [];
    }
    
    // Handle different webhook events
    const eventType = payload.event || '';
    
    switch(eventType) {
      case 'call.started':
        console.log(`Call started: ${payload.call_id}`);
        // Emit call started event
        io.emit('call_status', {
          call_id: payload.call_id,
          status: 'started'
        });
        break;
        
      case 'transcript.partial':
        console.log(`Partial transcript for call: ${payload.call_id}`);
        
        // If we have a transcript segment, emit it
        if (payload.transcript_segment) {
          const transcriptSegment = {
            speaker: payload.transcript_segment.speaker || 'ai',
            text: payload.transcript_segment.text,
            timestamp: payload.transcript_segment.timestamp || new Date().toISOString()
          };
          
          // Add to active calls transcript
          activeCallsTranscripts[payload.call_id].push(transcriptSegment);
          
          // Emit to all connected clients
          io.emit('transcript_update', {
            call_id: payload.call_id,
            transcript_segment: transcriptSegment
          });
        }
        break;
        
      case 'call.in_progress':
        console.log(`Call in progress: ${payload.call_id}`);
        // Emit call in progress event
        io.emit('call_status', {
          call_id: payload.call_id,
          status: 'in_progress'
        });
        break;
        
      case 'call.completed':
        console.log(`Call completed: ${payload.call_id}`);
        
        // Emit call completed event
        io.emit('call_status', {
          call_id: payload.call_id,
          status: 'completed',
          transcript: payload.transcript
        });
        
        break;
        
      default:
        console.log(`Received event type: ${eventType}`);
    }
    
    // Return success response
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling Bland AI webhook on backend:', error);
    // Still return 200 to prevent Bland AI from retrying
    return res.status(200).json({ success: false, error: 'Internal server error' });
  }
});

// Also add the same endpoint without the /api prefix
app.post('/bland-webhook', express.json(), (req, res) => {
  try {
    const payload = req.body;
    
    // Log webhook data for debugging
    console.log('Received Bland AI webhook on root endpoint:', payload);
    
    // Check if this is a valid webhook with a call_id
    if (!payload.call_id) {
      console.warn('Invalid webhook data: missing call_id');
      return res.status(400).json({ error: 'Missing call_id' });
    }
    
    // Initialize call transcript if needed
    if (!activeCallsTranscripts[payload.call_id]) {
      activeCallsTranscripts[payload.call_id] = [];
    }
    
    // Handle different webhook events
    const eventType = payload.event || '';
    
    switch(eventType) {
      case 'call.started':
        console.log(`Call started: ${payload.call_id}`);
        // Emit call started event
        io.emit('call_status', {
          call_id: payload.call_id,
          status: 'started'
        });
        break;
        
      case 'transcript.partial':
        console.log(`Partial transcript for call: ${payload.call_id}`);
        
        // If we have a transcript segment, emit it
        if (payload.transcript_segment) {
          const transcriptSegment = {
            speaker: payload.transcript_segment.speaker || 'ai',
            text: payload.transcript_segment.text,
            timestamp: payload.transcript_segment.timestamp || new Date().toISOString()
          };
          
          // Add to active calls transcript
          activeCallsTranscripts[payload.call_id].push(transcriptSegment);
          
          // Emit to all connected clients
          io.emit('transcript_update', {
            call_id: payload.call_id,
            transcript_segment: transcriptSegment
          });
        }
        break;
        
      case 'call.in_progress':
        console.log(`Call in progress: ${payload.call_id}`);
        // Emit call in progress event
        io.emit('call_status', {
          call_id: payload.call_id,
          status: 'in_progress'
        });
        break;
        
      case 'call.completed':
        console.log(`Call completed: ${payload.call_id}`);
        
        // Emit call completed event
        io.emit('call_status', {
          call_id: payload.call_id,
          status: 'completed',
          transcript: payload.transcript
        });
        
        break;
        
      default:
        console.log(`Received event type: ${eventType}`);
    }
    
    // Return success response
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling Bland AI webhook on root endpoint:', error);
    // Still return 200 to prevent Bland AI from retrying
    return res.status(200).json({ success: false, error: 'Internal server error' });
  }
});

// Add a health endpoint for the webhook
app.get('/bland-webhook-health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Bland webhook endpoint is ready',
    timestamp: new Date().toISOString()
  });
});

// Modify the existing Bland AI call endpoint to enable streaming
app.post('/api/bland-call', async (req, res) => {
  try {
    // Extract customer information from request without default fallbacks
    // This ensures we use the client-provided data instead of creating a new user
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
    if (!imageSummary) {
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

    // Get the host from request to dynamically set webhook URL
    const host = req.headers.host || req.headers['x-forwarded-host'];
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    
    // Check if this is from ngrok
    const isNgrok = host && host.includes('ngrok');
    
    // First check if we're explicitly being told about the ngrok URL
    const ngrokUrl = req.headers['x-ngrok-url'] || process.env.NGROK_URL;
    
    // Base URL determination:
    // 1. Use the provided ngrok URL if available
    // 2. If the host contains 'ngrok', use https with that host
    // 3. Otherwise use the protocol and host as normal
    let baseUrl;
    if (ngrokUrl) {
      baseUrl = ngrokUrl;
    } else if (isNgrok) {
      baseUrl = `https://${host}`;
    } else {
      // This is likely a local request - check if we're running via localhost
      if (host && host.includes('localhost')) {
        // For local development, prefer using ngrok URL if we know about a running tunnel
        try {
          // Try to fetch info from the ngrok API
          const axios = require('axios');
          const ngrokApiResponse = await axios.get('http://localhost:4040/api/tunnels');
          if (ngrokApiResponse.data && ngrokApiResponse.data.tunnels && ngrokApiResponse.data.tunnels.length > 0) {
            // Use the first tunnel's public URL
            baseUrl = ngrokApiResponse.data.tunnels[0].public_url;
            console.log('Detected ngrok tunnel:', baseUrl);
          } else {
            baseUrl = `${protocol}://${host}`;
          }
        } catch (error) {
          // If we can't reach the ngrok API or something else went wrong, use the default
          console.log('Could not detect ngrok tunnel, using standard URL');
          baseUrl = `${protocol}://${host}`;
        }
      } else {
        baseUrl = `${protocol}://${host}`;
      }
    }
    
    // Complete webhook URL - always use the ngrok URL if available
    const webhookUrl = `${baseUrl}/bland-webhook`;
    // Stream URL for real-time transcription
    const streamUrl = `${baseUrl}/api/bland-stream`;
    console.log('Using webhook URL:', webhookUrl);
    console.log('Using stream URL:', streamUrl);

    const headers = {
      'Authorization': `Bearer ${blandApiKey}`,
      'Content-Type': 'application/json'
    };

    const data = {
      "phone_number": customerPhone.startsWith('+') ? customerPhone : `+${customerPhone}`,
      "voice": "Paige",
      "wait_for_greeting": false,
      "record": true,
      "amd": false,
      "answered_by_enabled": false,
      "noise_cancellation": false,
      "interruption_threshold": 100,
      "block_interruptions": false,
      "max_duration": 12,
      "model": "base",
      "language": "en",
      "background_track": "none",
      "endpoint": "https://api.bland.ai",
      "voicemail_action": "hangup",
      "webhook_url": webhookUrl, // Add webhook URL to receive callbacks
      "task": `You are the FormelD Road Assistance AI agent. A customer named ${customerName || 'the customer'} with a ${customerVehicle || 'vehicle'} has requested roadside assistance from ${customerLocation || 'their current location'}. They have reported the following issue: "${customerIssue || 'a vehicle issue'}".
      
      This is what we know about the customer from their history:
      ${historyText}
      
      Introduce yourself as the FormelD Road Assistance AI. ${customerName ? `Acknowledge that you're speaking with ${customerName}` : 'Ask for the customer\'s name'} and mention that you have access to their customer profile.
      
      ${customerHistory.membership ? `Briefly reference their membership level (${customerHistory.membership})` : ''} ${customerHistory.previousIssues.length > 0 ? 'and recent service history' : ''} to personalize the conversation. Then confirm their current location and the issue they're experiencing with their vehicle.
      
      If their reported issue matches their image analysis summary, acknowledge this consistency. Ask them if there are any additional details about their situation they'd like to add.
      
      Inform them that you are creating a ticket for their issue and will dispatch assistance to their location. 
      
      Estimate an arrival time of 30-45 minutes for assistance. Ask if they require any immediate emergency services (like police or ambulance). If they do, advise them to hang up and call emergency services directly.
      
      Before ending the call, summarize the information collected and confirm the next steps. Provide a ticket number (use a random 6-digit number) for reference and let them know they will receive updates via SMS.
      
      Thank them for using FormelD Road Assistance and end the call politely.`,
      "json_mode_enabled": false,
      "streaming": true,
      "stream_url": streamUrl,
      "webhook_events": ['call.started', 'transcript.partial', 'call.in_progress', 'call.completed']
    };

    // Make API request to Bland.ai
    const axios = require('axios');
    
    // Log the API request for debugging (remove sensitive data in production)
    console.log('Sending Bland.ai API request:', {
      url: 'https://api.bland.ai/v1/calls',
      headers: { 'Content-Type': headers['Content-Type'] }, // Don't log the actual API key
      data: { ...data, phone_number: '****', webhook_url: webhookUrl } // Include webhook in logs but mask phone
    });
    
    const blandResponse = await axios.post('https://api.bland.ai/v1/calls', data, { headers });

    // Return call_id and status to client along with customer info that was used
    res.status(200).json({ 
      callId: blandResponse.data.call_id,
      status: blandResponse.data.status,
      message: 'Call initiated successfully',
      webhookUrl: webhookUrl, // Return webhook URL for confirmation
      customerInfo: {
        name: customerName,
        phone: customerPhone.replace(/\d(?=\d{4})/g, '*'), // Mask most digits except last 4
        vehicle: customerVehicle,
        location: customerLocation,
        issue: customerIssue,
        membershipLevel: customerHistory.membership
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
  console.log(`Server running with Socket.io on port ${PORT}`);
}); 