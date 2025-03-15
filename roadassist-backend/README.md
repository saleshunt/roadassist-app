# RoadAssist Backend

This is the backend server for the RoadAssist application, providing API endpoints for image analysis using OpenAI's API.

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Create a `.env` file in the root directory with the following content:

   ```
   PORT=3001
   OPENAI_API_KEY=your_openai_api_key_here
   ```

   Replace `your_openai_api_key_here` with your actual OpenAI API key.

3. Start the server:

   ```
   npm start
   ```

   For development with automatic restart:

   ```
   npm run dev
   ```

## API Endpoints

### Health Check

- **URL**: `/api/health`
- **Method**: `GET`
- **Response**: `{ status: 'ok', message: 'Server is running' }`

### Analyze Image

- **URL**: `/api/analyze-image`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `image`: The image file to analyze
  - `question` (optional): The question to ask about the image
- **Response**:
  ```json
  {
    "analysis": "Description of the image from OpenAI",
    "imagePath": "path/to/saved/image"
  }
  ```

## Integration with Frontend

The frontend should use `FormData` to send the image to the backend:

```javascript
const formData = new FormData();
formData.append("image", imageFile);
formData.append(
  "question",
  "What issues or problems can you identify in this vehicle image?"
);

const response = await fetch("http://localhost:3001/api/analyze-image", {
  method: "POST",
  body: formData,
});

const data = await response.json();
console.log(data.analysis);
```
