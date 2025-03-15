"use client"

import { useState, useRef, useEffect } from "react"
import { useAppContext } from "./app-context"
import { FormeldLogo } from "./formeld-logo"
import { MapPin, Battery, Camera, ArrowLeft, Phone, Info, CheckCircle, AlertTriangle } from "lucide-react"
import CustomerSwitcher from "./customer-switcher"
import Image from "next/image"

// A simple markdown renderer component
const MarkdownRenderer = ({ content }: { content: string }) => {
  // Convert bullet points
  const withBullets = content.replace(/(\d+\.\s|\*\s)(.*?)(?=\n|$)/g, (match, bullet, text) => {
    return `<div class="flex items-start mb-2">
      <span class="text-bmw-blue mr-2 mt-0.5 flex-shrink-0">${bullet.includes('*') ? '•' : bullet}</span>
      <span>${text}</span>
    </div>`;
  });
  
  // Convert headings
  const withHeadings = withBullets.replace(/(?:^|\n)(#{1,3})\s+(.*?)(?=\n|$)/g, (match, level, text) => {
    const headingClass = level === '#' 
      ? 'text-lg font-semibold mb-2 text-bmw-blue' 
      : 'text-base font-medium mb-1';
    return `<div class="${headingClass}">${text}</div>`;
  });
  
  // Add paragraph spacing
  const withParagraphs = withHeadings.replace(/(?:\n{2,})/g, '</p><p class="mb-2">');
  
  // Highlight important phrases in **bold** or *italic*
  const withFormatting = withParagraphs
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-bmw-blue">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');

  return (
    <div 
      className="markdown-content text-sm text-gray-700" 
      dangerouslySetInnerHTML={{ __html: `<p class="mb-2">${withFormatting}</p>` }}
    />
  );
};

// Customer app header component
const CustomerAppHeader = ({ showBackButton = false, title = "", onBack = () => {} }) => {
  const { currentCustomer } = useAppContext()
  
  return (
    <div className="bg-white p-4 flex items-center justify-between border-b border-gray-200 mb-4">
      <div className="flex items-center">
        {showBackButton && (
          <button onClick={onBack} className="mr-3">
            <ArrowLeft className="text-gray-600" />
          </button>
        )}
        {title ? (
          <h1 className="text-lg font-semibold">{title}</h1>
        ) : (
          <div>
            <h1 className="text-lg font-semibold">Hello, {currentCustomer.name}</h1>
            <p className="text-sm text-gray-600">Vehicle: {currentCustomer.vehicle.model}</p>
          </div>
        )}
      </div>
      <CustomerSwitcher />
    </div>
  )
}

export default function CustomerApp() {
  const {
    customerScreen,
    setCustomerScreen,
    createNewTicket,
    uploadPhoto,
    selectedTicketId,
    tickets,
    currentCustomer,
    simulateCall,
    goBack,
    userAnalysisResults,
  } = useAppContext()

  const [category, setCategory] = useState("")
  const [details, setDetails] = useState("")
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [showDialogueModal, setShowDialogueModal] = useState(false)
  const [showCarStatusModal, setShowCarStatusModal] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<Array<{file: File | null, preview: string, processed: boolean}>>([])
  const [combinedAnalysis, setCombinedAnalysis] = useState<string>("")
  const [apiConnectionError, setApiConnectionError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedTicket = selectedTicketId ? tickets.find((t) => t.id === selectedTicketId) : null

  // Check server connection at component mount
  useEffect(() => {
    const controller = new AbortController();
    // Don't use setTimeout to abort directly - it's causing issues
    // Instead, use a separate cleanup flag
    let isComponentMounted = true;
    
    const checkServerConnection = async (retryCount = 0) => {
      if (!isComponentMounted) return; // Don't proceed if component unmounted
      
      try {
        console.log(`Attempting to connect to backend (attempt ${retryCount + 1})...`);
        
        const response = await fetch('http://localhost:3002/api/ping', {
          signal: controller.signal,
          cache: 'no-store'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Backend server ping response:', data);
          setApiConnectionError(false);
          console.log('Backend server is reachable');
        } else {
          throw new Error(`Server responded with status: ${response.status}`);
        }
      } catch (error: unknown) {
        // Only handle errors if component is still mounted
        if (!isComponentMounted) return;
        
        // Don't log abort errors as they're expected during cleanup
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Connection error:', error);
          setApiConnectionError(true);
          
          // Retry logic - try up to 3 times with increasing delay
          if (retryCount < 2) {
            const retryDelay = (retryCount + 1) * 2000; // 2s, 4s
            console.log(`Retrying in ${retryDelay/1000} seconds...`);
            setTimeout(() => {
              if (isComponentMounted) {
                checkServerConnection(retryCount + 1);
              }
            }, retryDelay);
          } else {
            console.error('Failed to connect to backend server after multiple attempts');
          }
        }
      }
    };
    
    checkServerConnection();
    
    return () => {
      isComponentMounted = false;
      controller.abort();
    };
  }, []);

  // When switching users, get their previous analysis if available
  useEffect(() => {
    if (userAnalysisResults[currentCustomer.id]) {
      setCombinedAnalysis(userAnalysisResults[currentCustomer.id].analysis);
      
      // If the user had previously uploaded images, display them
      if (userAnalysisResults[currentCustomer.id].images && userAnalysisResults[currentCustomer.id].images.length > 0) {
        const existingImages = uploadedImages.map(img => img.preview);
        
        // Only add images that aren't already displayed
        const newImages = userAnalysisResults[currentCustomer.id].images.filter(img => !existingImages.includes(img))
          .map(preview => ({
            file: null, // We don't have the file objects anymore
            preview,
            processed: true // These are already processed
          }));
          
        if (newImages.length > 0) {
          setUploadedImages(prev => [...prev, ...newImages]);
        }
      }
    }
  }, [currentCustomer.id, userAnalysisResults, uploadedImages]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map(file => ({
        file: file,
        preview: URL.createObjectURL(file),
        processed: false
      }))
      
      // Update state with new images
      setUploadedImages(prev => [...prev, ...newImages])
      
      try {
        // Create form data with all images
        const formData = new FormData()
        
        // Validate we have at least one valid image
        const validImages = newImages.filter(img => img.file)
        if (validImages.length === 0) {
          throw new Error('No valid image files found')
        }
        
        // Add all valid images to form data
        validImages.forEach(img => {
          if (img.file) formData.append('images', img.file)
        })
        
        // Create AbortController for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 25000)
        
        // Call our backend API
        const response = await fetch('http://localhost:3002/api/analyze-image', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`)
        }
        
        const data = await response.json()
        
        // Update state with analysis results
        setCombinedAnalysis(data.analysis)
        
        // Mark all images as processed
        setUploadedImages(current => {
          return current.map(img => ({
            ...img,
            processed: true
          }))
        })
      } catch (error) {
        console.error('Error processing images:', error)
        
        // Mark all new images as processed
        setUploadedImages(current => {
          return current.map(img => ({
            ...img,
            processed: true
          }))
        })
        
        // Set an error message for the analysis
        setCombinedAnalysis('An error occurred while analyzing your images. Please try again.')
      } finally {
        // Clear the file input to allow re-uploading the same file
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    }
  }
  
  // This function calls our backend API to interpret the image using OpenAI
  /* Commenting out unused function
  const interpretImage = async (imageSrc: string, fileObject?: File): Promise<string> => {
    try {
      // Note: This function is now primarily used for single-image analysis when needed
      // For multiple images, we use the combined approach in handleImageUpload
      
      // For images from file input, they'll be in Blob form
      // We need to send the actual file to our backend
      if (imageSrc.startsWith('blob:') && fileObject) {
        // Use the file object directly passed to this function
        const formData = new FormData()
        formData.append('images', fileObject)
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        try {
  */

  const removeImage = (previewUrl: string) => {
    // First remove the image from state
    setUploadedImages(prevImages => {
      const updatedImages = prevImages.filter(img => img.preview !== previewUrl)
      
      // If no images remain, clear the analysis
      if (updatedImages.length === 0) {
        setCombinedAnalysis('')
        return updatedImages
      }
      
      // Re-analyze the remaining images
      const reanalyzeImages = async () => {
        try {
          // Create form data with all remaining images
          const formData = new FormData()
          const validImages = updatedImages.filter(img => img.file)
          
          if (validImages.length === 0) {
            setCombinedAnalysis('')
            return
          }
          
          validImages.forEach(img => {
            if (img.file) formData.append('images', img.file)
          })
          
          // Create AbortController for timeout
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 25000)
          
          // Call our backend API with remaining images
          const response = await fetch('http://localhost:3002/api/analyze-image', {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          })
          
          clearTimeout(timeoutId)
          
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`)
          }
          
          const data = await response.json()
          setCombinedAnalysis(data.analysis)
        } catch (error) {
          console.error('Error re-analyzing images after removal:', error)
          // Keep existing analysis or set an error message
        }
      }
      
      // Only re-analyze if we have images left and they're different from before
      if (updatedImages.length > 0) {
        reanalyzeImages()
      }
      
      return updatedImages
    })
  }

  // Show the loading indicator if THIS user has a processing request
  const showLoading = false;

  const renderScreen = () => {
    switch (customerScreen) {
      case "home":
        return (
          <div className="flex flex-col h-full">
            <CustomerAppHeader />
            
            <div className="mb-4 bg-white p-4 rounded-lg shadow-sm border-l-4 border-bmw-blue">
              <div className="flex items-center mt-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 text-bmw-blue mr-1"
                >
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"></path>
                  <circle cx="7" cy="17" r="2"></circle>
                  <path d="M9 17h6"></path>
                  <circle cx="17" cy="17" r="2"></circle>
                </svg>
                <p className="text-sm text-gray-600">Your Roadside Assistance is always ready for you</p>
              </div>
            </div>
            
            {/* Expandable Car Info Section */}
            <div className="mb-4">
              <button 
                onClick={() => {
                  const carInfoContent = document.getElementById('car-info-content');
                  if (carInfoContent) {
                    carInfoContent.classList.toggle('hidden');
                    // Toggle the icon between + and -
                    const expandIcon = document.getElementById('car-info-expand-icon');
                    if (expandIcon) {
                      expandIcon.textContent = expandIcon.textContent === '+' ? '−' : '+';
                    }
                  }
                }}
                className="w-full bg-white p-4 rounded-lg shadow-md border border-gray-100 flex justify-between items-center"
              >
                <div className="flex items-center">
                  <h3 className="text-sm font-medium text-bmw-blue uppercase tracking-wide">Car info</h3>
                </div>
                <span id="car-info-expand-icon" className="text-gray-500 text-xl font-medium">+</span>
              </button>
              
              <div id="car-info-content" className="hidden bg-white px-5 pb-5 pt-2 rounded-b-lg shadow-md border-x border-b border-gray-100">
                <div className="flex items-start justify-between mt-2">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">{currentCustomer.vehicle.model}</h2>
                    <div className="flex items-center mt-1">
                      <div className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded">
                        {currentCustomer.vehicle.licensePlate}
                      </div>
                      <div className="bg-gray-50 px-2 py-1 rounded text-xs font-medium text-gray-600 ml-2">
                        {currentCustomer.vehicle.year}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="flex items-center space-x-2">
                      <div className="relative w-14 h-5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`absolute left-0 top-0 h-full ${
                            currentCustomer?.vehicle?.fuelStatus?.includes("75%") 
                              ? "w-3/4 bg-green-500" 
                              : currentCustomer?.vehicle?.fuelStatus?.includes("50%") 
                                ? "w-1/2 bg-yellow-500" 
                                : currentCustomer?.vehicle?.fuelStatus?.includes("25%") 
                                  ? "w-1/4 bg-red-500" 
                                  : "w-full bg-green-500"
                          }`}
                        ></div>
                      </div>
                      <div className="flex items-center">
                        <Battery 
                          className={`${
                            currentCustomer?.vehicle?.fuelStatus?.includes("75%") 
                              ? "text-green-500" 
                              : currentCustomer?.vehicle?.fuelStatus?.includes("50%") 
                                ? "text-yellow-500" 
                                : currentCustomer?.vehicle?.fuelStatus?.includes("25%") 
                                  ? "text-red-500" 
                                  : "text-green-500"
                          }`} 
                          size={18} 
                        />
                        <span className="text-sm font-medium ml-1">{currentCustomer?.vehicle?.fuelStatus}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {currentCustomer?.vehicle?.fuelStatus?.includes("25%") 
                        ? "Low battery warning" 
                        : "Battery status normal"}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                  <MapPin size={16} className="mr-1 text-bmw-blue" />
                  <span>Current Location, Cambridge, MA</span>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-2 rounded-md">
                    <p className="text-xs text-gray-500 mb-1">Tire Pressure</p>
                    <p className="text-sm font-medium">32 PSI</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-md">
                    <p className="text-xs text-gray-500 mb-1">Oil Type</p>
                    <p className="text-sm font-medium">Synthetic 5W-30</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-md">
                    <p className="text-xs text-gray-500 mb-1">Battery Type</p>
                    <p className="text-sm font-medium">12V AGM</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-md">
                    <p className="text-xs text-gray-500 mb-1">Last Service</p>
                    <p className="text-sm font-medium">March 2023</p>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => simulateCall()}
              className="bg-bmw-blue text-white py-4 px-8 rounded-lg font-bold text-xl shadow-lg hover:bg-bmw-blue-dark transition-colors mt-6 w-full max-w-md mx-auto flex items-center justify-center"
            >
              <Phone size={24} className="mr-3" />
              Request Assistance
            </button>
            
            <div className="mt-6 bg-white p-4 rounded-lg shadow-sm w-full max-w-md mx-auto">
              <div className="mb-3">
                <h3 className="text-lg font-medium mb-2">Need to share your situation?</h3>
                <p className="text-sm text-gray-600 mb-4">Directly upload images of the situation to share with Road Assistance</p>
                
                <div className="border border-dashed border-gray-300 rounded-lg p-4">
                  <div className="flex flex-col items-center justify-center">
                    <Camera size={24} className="text-bmw-blue mb-2" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      id="image-upload-home"
                      onChange={handleImageUpload}
                    />
                    <label
                      htmlFor="image-upload-home"
                      className="bg-white border border-bmw-blue text-bmw-blue py-2 px-4 rounded-lg hover:bg-gray-50 cursor-pointer mb-3"
                    >
                      Upload Images
                    </label>
                    
                    {showLoading && (
                      <div className="text-center mt-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bmw-blue mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Analyzing images with AI...</p>
                      </div>
                    )}
                    
                    {uploadedImages.length > 0 && (
                      <div className="mt-3 w-full">
                        <h4 className="font-medium text-sm mb-2">Uploaded Images ({uploadedImages.length})</h4>
                        
                        {combinedAnalysis && (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-3">
                            <div className="flex items-start mb-2">
                              {combinedAnalysis.includes("not") || combinedAnalysis.includes("error") ? (
                                <AlertTriangle size={16} className="text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                              ) : (
                                <CheckCircle size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                              )}
                              <h6 className="text-sm font-medium">Analysis Result</h6>
                            </div>
                            <MarkdownRenderer content={combinedAnalysis} />
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          {uploadedImages.map((img, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="text-sm font-medium">Image {index + 1}</h5>
                                <button 
                                  onClick={() => removeImage(img.preview)}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                </button>
                              </div>
                              <div className="relative">
                                <Image 
                                  src={img.preview} 
                                  alt={`Uploaded ${index + 1}`} 
                                  width={320}
                                  height={240}
                                  className="w-full h-32 object-cover rounded-lg mb-2"
                                />
                                {!img.processed && (
                                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto text-center text-sm text-gray-500">
              <p className="mb-2">Our Roadside Assistance is available 24/7</p>
              <p>Tap the button above to get help immediately</p>
            </div>
          </div>
        )

      case "request":
        return (
          <div className="flex flex-col h-full">
            <CustomerAppHeader 
              showBackButton={true} 
              title="Request Assistance" 
              onBack={goBack} 
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">What&apos;s the issue?</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-bmw-blue focus:border-bmw-blue"
              >
                <option value="">Select an issue</option>
                <option value="Vehicle won&apos;t start">Vehicle won&apos;t start</option>
                <option value="Flat tire">Flat tire</option>
                <option value="Accident">Accident</option>
                <option value="Locked out">Locked out</option>
                <option value="Other mechanical issue">Other mechanical issue</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional details</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-bmw-blue focus:border-bmw-blue"
                placeholder="Please provide any additional details about your issue..."
              ></textarea>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Images</label>
              <div className="border border-dashed border-gray-300 rounded-lg p-4">
                <div className="flex flex-col items-center justify-center">
                  <Camera size={24} className="text-bmw-blue mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Directly upload images of the situation to share with Road Assistance</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    id="image-upload"
                    onChange={handleImageUpload}
                  />
                  <label
                    htmlFor="image-upload"
                    className="bg-white border border-bmw-blue text-bmw-blue py-2 px-4 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    Select Images
                  </label>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setCustomerScreen("photo")}
                className="flex items-center justify-center bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
              >
                <Camera size={18} className="mr-2" />
                Add Photos
              </button>
            </div>

            <button
              onClick={() => {
                if (category && details) {
                  createNewTicket(category, details)
                }
              }}
              disabled={!category || !details}
              className={`bg-bmw-blue text-white py-4 rounded-lg font-medium text-lg shadow-md transition-colors ${
                !category || !details ? "opacity-50 cursor-not-allowed" : "hover:bg-bmw-blue-dark"
              }`}
            >
              Submit Request
            </button>
          </div>
        )

      case "photo":
        return (
          <div className="flex flex-col h-full">
            <CustomerAppHeader 
              showBackButton={true} 
              title="Upload Photos" 
              onBack={goBack} 
            />
            
            {showLoading && (
              <div className="text-center mb-4 p-4 bg-blue-50 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bmw-blue mx-auto mb-2"></div>
                <p className="text-sm text-gray-700">Analyzing images with AI...</p>
              </div>
            )}

            {uploadedImages.length > 0 ? (
              <div className="space-y-4 mb-6">
                {combinedAnalysis && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex items-start mb-2">
                      {combinedAnalysis.includes("not") || combinedAnalysis.includes("error") ? (
                        <AlertTriangle size={16} className="text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                      ) : (
                        <CheckCircle size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      )}
                      <h6 className="text-sm font-medium">AI Analysis Result</h6>
                    </div>
                    <MarkdownRenderer content={combinedAnalysis} />
                  </div>
                )}
                
                {uploadedImages.map((img, index) => (
                  <div key={index} className="bg-white shadow-sm rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium">Image {index + 1}</h5>
                      <button 
                        onClick={() => removeImage(img.preview)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                    <div className="relative">
                      <Image 
                        src={img.preview} 
                        alt={`Uploaded ${index + 1}`} 
                        width={320}
                        height={240}
                        className="w-full rounded-lg mb-3 max-h-64 object-contain"
                      />
                      {!img.processed && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg h-64 mb-6 flex items-center justify-center">
                <div className="text-center">
                  <Camera size={32} className="mx-auto mb-2 text-bmw-blue" />
                  <p className="text-sm text-gray-600">No photos uploaded yet</p>
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4 mb-6">
              <div
                className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-300"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
              >
                <Camera size={24} className="text-gray-500" />
              </div>
              <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-300">
                <span className="text-3xl text-gray-500">+</span>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              id="photo-screen-upload"
              onChange={handleImageUpload}
            />

            <button
              onClick={() => setCustomerScreen("support")}
              className="bg-bmw-blue text-white py-4 rounded-lg font-medium text-lg shadow-md hover:bg-bmw-blue-dark transition-colors"
            >
              Continue to Support
            </button>
          </div>
        )

      case "support":
        if (!selectedTicket) return <div>No active request</div>

        return (
          <div className="flex flex-col h-full">
            <CustomerAppHeader 
              showBackButton={true} 
              title="Support Ticket" 
              onBack={goBack} 
            />
            
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">Support Session</h2>
                  <p className="text-gray-500 text-sm">
                    {selectedTicket.id} • <span suppressHydrationWarning>{formatTime(selectedTicket.createdAt)}</span>
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(selectedTicket.status)}`}
                >
                  {selectedTicket.status}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100">
              <div className="flex items-start">
                <Info className="text-bmw-blue mt-0.5 mr-2 flex-shrink-0" size={18} />
                <p className="text-sm text-gray-700">
                  Your request has been received and is being processed. Our AI assistant is analyzing your issue and will help you resolve it.
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <button 
                onClick={() => setShowSummaryModal(true)}
                className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center hover:bg-gray-50"
              >
                <Info size={32} className="text-bmw-blue mb-3" />
                <span className="text-base font-medium mb-2">Support Summary</span>
                <p className="text-xs text-gray-500 text-center">View details about your current support request</p>
              </button>
              
              <button 
                onClick={() => setShowDialogueModal(true)}
                className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center hover:bg-gray-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg" 
                  width="32" 
                  height="32" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="text-bmw-blue mb-3"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span className="text-base font-medium mb-2">View Conversation</span>
                <p className="text-xs text-gray-500 text-center">Check your chat history with support</p>
              </button>
              
              <button 
                onClick={() => setShowCarStatusModal(true)}
                className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center hover:bg-gray-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-bmw-blue mb-3"
                >
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"></path>
                  <circle cx="7" cy="17" r="2"></circle>
                  <path d="M9 17h6"></path>
                  <circle cx="17" cy="17" r="2"></circle>
                </svg>
                <span className="text-base font-medium mb-2">Car Status</span>
                <p className="text-xs text-gray-500 text-center">Check your vehicle&apos;s current information</p>
              </button>
            </div>

            {/* Spacer div to maintain layout */}
            <div className="flex-1 mb-4"></div>

            <div className="p-4 bg-white rounded-lg shadow-sm mb-4">
              <div className="flex flex-col items-center">
                <div className="w-full p-3 border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
                  <Camera size={24} className="text-bmw-blue mb-2" />
                  <p className="text-sm text-gray-600 text-center mb-3">
                    You can upload images to provide more context to our support team
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    id="support-image-upload"
                    onChange={handleImageUpload}
                  />
                  <label
                    htmlFor="support-image-upload"
                    className="bg-white border border-bmw-blue text-bmw-blue py-2 px-4 rounded-lg hover:bg-gray-50 cursor-pointer mb-3"
                  >
                    Upload Images
                  </label>

                  {showLoading && (
                    <div className="text-center mt-3 w-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bmw-blue mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Analyzing images with AI...</p>
                    </div>
                  )}

                  {uploadedImages.length > 0 && (
                    <div className="mt-3 w-full">
                      <h4 className="font-medium text-sm mb-2">Uploaded Images ({uploadedImages.length})</h4>
                      
                      {combinedAnalysis && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-3">
                          <div className="flex items-start mb-2">
                            {combinedAnalysis.includes("not") || combinedAnalysis.includes("error") ? (
                              <AlertTriangle size={16} className="text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                            ) : (
                              <CheckCircle size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                            )}
                            <h6 className="text-sm font-medium">Analysis Result</h6>
                          </div>
                          <MarkdownRenderer content={combinedAnalysis} />
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        {uploadedImages.map((img, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="text-sm font-medium">Image {index + 1}</h5>
                              <button 
                                onClick={() => removeImage(img.preview)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                            </div>
                            <div className="relative">
                              <Image 
                                src={img.preview} 
                                alt={`Uploaded ${index + 1}`} 
                                width={320}
                                height={240}
                                className="w-full h-32 object-cover rounded-lg mb-2"
                              />
                              {!img.processed && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button className="bg-gray-100 text-gray-800 py-3 px-6 rounded-lg font-medium text-base shadow-sm hover:bg-gray-200 transition-colors w-full mx-auto mb-2 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 mr-2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Speak to Human
            </button>
            <p className="text-center text-xs text-gray-500 mb-3">
              You are currently being supported by our AI Agent. Press above to speak to a human.
            </p>

            {/* Support Summary Modal */}
            {showSummaryModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">Support Summary</h3>
                    <button onClick={() => setShowSummaryModal(false)} className="text-gray-500 hover:text-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-1">Issue</h4>
                      <p className="text-gray-800">{selectedTicket.issue}</p>
                    </div>
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-1">Category</h4>
                      <p className="text-gray-800">{selectedTicket.category}</p>
                    </div>
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-1">Status</h4>
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(selectedTicket.status)}`}>
                        {selectedTicket.status}
                      </div>
                    </div>
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-1">Time Reported</h4>
                      <p className="text-gray-800"><span suppressHydrationWarning>{formatTime(selectedTicket.createdAt)}</span></p>
                    </div>
                    {selectedTicket.messages.find((m) => m.imageUrl) && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-700 mb-1">Uploaded Image</h4>
                        <Image
                          src={selectedTicket.messages.find((m) => m.imageUrl)?.imageUrl || "/placeholder.svg"}
                          alt="Uploaded"
                          width={320}
                          height={240}
                          className="w-full max-h-60 object-contain rounded mt-2"
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t bg-gray-50">
                    <button 
                      onClick={() => setShowSummaryModal(false)} 
                      className="w-full py-2 bg-bmw-blue text-white rounded-lg"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dialogue Modal */}
            {showDialogueModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                  <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">Conversation History</h3>
                    <button onClick={() => setShowDialogueModal(false)} className="text-gray-500 hover:text-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedTicket.messages.map((message) => (
                      <div 
                        key={message.id} 
                        className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`rounded-lg p-3 max-w-[85%] ${
                            message.sender === 'customer' 
                              ? 'bg-bmw-blue text-white rounded-tr-none' 
                              : message.sender === 'ai' 
                                ? 'bg-gray-100 text-gray-800 rounded-tl-none' 
                                : 'bg-yellow-50 text-gray-800 rounded-tl-none border border-yellow-200'
                          }`}
                        >
                          {message.imageUrl && (
                            <div className="mb-2">
                              <Image 
                                src={message.imageUrl} 
                                alt="Uploaded" 
                                width={320}
                                height={240}
                                className="rounded max-h-40 w-auto"
                              />
                            </div>
                          )}
                          <p className={message.isProcessing ? "animate-pulse" : ""}>{message.content}</p>
                          <p className="text-xs opacity-70 mt-1 text-right">
                            {message.sender === 'ai' ? 'AI Support Agent' : 
                             message.sender === 'agent' ? 'Human Agent' : 'You'} • <span suppressHydrationWarning>{formatTime(message.timestamp)}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t bg-gray-50">
                    <button 
                      onClick={() => setShowDialogueModal(false)} 
                      className="w-full py-2 bg-bmw-blue text-white rounded-lg"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Car Status Modal */}
            {showCarStatusModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">Vehicle Status</h3>
                    <button onClick={() => setShowCarStatusModal(false)} className="text-gray-500 hover:text-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-lg">{currentCustomer.vehicle.model}</h4>
                          <p className="text-gray-500">{currentCustomer.vehicle.licensePlate}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Battery className="text-green-500" size={20} />
                          <span className="text-sm font-medium">{currentCustomer.vehicle.fuelStatus}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Location</h5>
                          <div className="flex items-center text-gray-800">
                            <MapPin size={16} className="mr-1 text-bmw-blue" />
                            <span>Current Location, Cambridge, MA</span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Owner</h5>
                          <p className="text-gray-800">{currentCustomer.name}</p>
                          <p className="text-gray-500 text-sm">{currentCustomer.phone}</p>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Vehicle Details</h5>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs text-gray-500">Model</p>
                              <p className="text-gray-800">{currentCustomer.vehicle.model}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Year</p>
                              <p className="text-gray-800">{currentCustomer.vehicle.year}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">License</p>
                              <p className="text-gray-800">{currentCustomer.vehicle.licensePlate}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Fuel</p>
                              <p className="text-gray-800">{currentCustomer.vehicle.fuelStatus}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-t bg-gray-50">
                    <button 
                      onClick={() => setShowCarStatusModal(false)} 
                      className="w-full py-2 bg-bmw-blue text-white rounded-lg"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case "call":
        return (
          <div className="flex flex-col h-full">
            <CustomerAppHeader 
              title="Calling Assistance" 
            />
            
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center mb-8">
                <Phone size={64} className="mx-auto mb-4 text-bmw-blue animate-pulse" />
                <h2 className="text-2xl font-bold">Calling Roadside Assistance</h2>
                <p className="text-gray-600 mt-2">Please wait while we connect you...</p>
                
                {apiConnectionError && (
                  <div className="mt-4 bg-yellow-50 p-4 rounded-lg max-w-md text-left border border-yellow-200">
                    <div className="flex items-start">
                      <AlertTriangle size={20} className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-yellow-800">Connection Issue</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          We&apos;re having trouble connecting to our call service. We&apos;ll create a support ticket for you instead.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {!apiConnectionError && (
                  <div className="mt-6 bg-blue-50 p-4 rounded-lg max-w-md text-left border border-blue-100">
                    <h3 className="text-sm font-medium text-bmw-blue mb-2">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        Voice Assistant Details
                      </div>
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4 text-bmw-blue mr-2"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        <span>Calling <strong>{currentCustomer.phone}</strong></span>
                      </li>
                      <li className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4 text-bmw-blue mr-2"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>Estimated wait time: <strong>&lt;2 seconds</strong></span>
                      </li>
                      <li className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor" 
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4 text-bmw-blue mr-2"
                        >
                          <path d="M20 7h-8.586L8.707 4.293A1 1 0 0 0 8 4H4a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1z"></path>
                        </svg>
                        <span>Vehicle: <strong>{currentCustomer.vehicle.model}</strong></span>
                      </li>
                    </ul>
                    <div className="mt-4 text-xs text-gray-500">
                      <p>Our AI assistant will collect details about your issue and dispatch the appropriate help.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                className="bg-red-500 text-white py-2 px-6 rounded-full flex items-center"
                onClick={() => goBack()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                  <line x1="22" y1="2" x2="2" y2="22" />
                </svg>
                Cancel Call
              </button>
            </div>
          </div>
        )

      default:
        return <div>Unknown screen</div>
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="bg-bmw-blue text-white p-4 flex items-center">
        <FormeldLogo className="h-10" />
        <h1 className="text-xl font-semibold ml-4">Roadside Assistance</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4">{renderScreen()}</main>
    </div>
  )
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date)
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "AI Agent Support":
      return "bg-blue-100 text-blue-800"
    case "Requires Human":
      return "bg-yellow-100 text-yellow-800"
    case "In Progress":
      return "bg-green-100 text-green-800"
    case "Resolved":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

