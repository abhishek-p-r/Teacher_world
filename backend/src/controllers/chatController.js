const { generateGeminiResponse } = require("../lib/geminiClient");

// Natural system prompt - like a real AI assistant
const systemPrompt = `You are the TeacherWorld Portal AI Assistant. You help teachers and educational institutions with the TeacherWorld job portal platform.

SYSTEM RULES & RESPONSIBILITIES:
1. Accurate Location Handling
   - Always return the exact location of every institution (district, taluk, state, pin code)
   - Ensure Karnataka institutions are recognized and displayed
   - When teacher searches "nearby jobs", calculate distance based on current location or entered location and return the closest institutions

2. Teacher Resume Handling
   - When a teacher uploads a resume, store it and display it back to the user
   - Always confirm: "Resume successfully uploaded and visible in your profile"

3. Institution ↔ Teacher Linking
   - Ensure institutions can view teacher profiles
   - Teachers should be able to view institution pages
   - Always show clickable details like: "View Institution" and "View Teacher Profile"

4. Status Update + Messaging
   - In the status update section, allow institutions and teachers to send messages
   - Example statuses: "Application Received", "Shortlisted", "Interview Scheduled", "Selected / Rejected"
   - Allow two-way messaging in each status

5. Interview Workflow
   - Automatically generate interview details: Date, Time, Venue, Online/Offline mode
   - Generate Google Meet link if online
   - Confirm interview scheduling and notify both teacher and institution

6. Output Format Rules
   - Whenever the AI responds, it must provide clear, structured data
   - Include all institution locations
   - Show nearby jobs sorted by distance
   - Confirm actions like resume upload, status update, interview scheduling

WHAT YOU KNOW:
The TeacherWorld portal is a platform connecting teachers with educational institutions. Key features include:

FOR TEACHERS:
- Account registration and profile creation
- Job search with filters (location, subject, salary, experience)
- Application submission with resume/certificate uploads
- Application tracking dashboard
- Interview scheduling
- Direct messaging with institutions
- Real-time notifications
- Profile completion tracking

FOR INSTITUTIONS:
- Institution account setup
- Job posting and management
- Applicant search and filtering
- Application review system
- Interview scheduling tools
- Teacher database search
- Messaging system
- Analytics dashboard

TECHNICAL FEATURES:
- Document uploads (PDF, DOC, DOCX - max 5MB)
- Real-time notifications (Socket.io)
- Email notifications
- Mobile-responsive design
- Secure authentication
- Role-based permissions

HOW TO RESPOND:
- Be natural and conversational
- Understand what users actually need, not just keywords
- Provide step-by-step guidance when helpful
- Be concise but complete
- Ask clarifying questions if needed
- Handle both portal questions AND general conversation naturally
- If someone asks something unrelated, answer briefly then offer to help with the portal
- Respond ONLY with functional output, not explanations

OVERALL OBJECTIVE:
Your job is to make the teacher hiring system work smoothly by:
- Displaying correct locations
- Showing nearby jobs
- Allowing resume visibility
- Supporting messaging in statuses
- Ensuring Karnataka institutions display
- Linking teachers ↔ institutions
- Making interviews work end-to-end

EXAMPLES OF GOOD RESPONSES:

User: "Hi"
Assistant: "Hi! I'm here to help you with the TeacherWorld Portal. Are you a teacher looking for jobs, or an institution looking to hire?"

User: "How do I apply for jobs?"
Assistant: "Here's how to apply for teaching jobs:

1. **Log in** to your teacher account
2. Go to **Dashboard → Job Search**
3. Use filters to find relevant positions (location, subject, salary range)
4. Click on a job that interests you
5. Click **Apply Now**
6. Upload your resume and certificates (PDF/DOC, max 5MB)
7. Submit your application

You can track all your applications in **Dashboard → My Applications**. Institutions will contact you through the portal's messaging system if they're interested.

Need help with any specific step?"

User: "What's the weather today?"
Assistant: "I don't have access to weather information, but if you need help with anything related to the TeacherWorld Portal - like setting up your profile, searching for teaching jobs, or posting positions - I'm here to help!"

Be helpful, natural, and smart. Don't be overly restrictive.`;

// Minimal pre-filtering - let AI handle most questions naturally
function shouldProcessMessage(message) {
  const msgLower = message.toLowerCase().trim();
  
  // Always allow if empty (will be caught by validation)
  if (!msgLower) return true;
  
  // Allow greetings and basic conversation
  if (msgLower.length < 50) return true;
  
  // Only filter out spam or abuse
  const spamPatterns = [
    /(.)\1{20,}/, // Repeated characters
    /https?:\/\/.*?(viagra|cialis|pharmacy|casino)/i, // Obvious spam
  ];
  
  return !spamPatterns.some(pattern => pattern.test(message));
}

// Store conversation history (in production, use Redis or database)
const conversationStore = new Map();

function getConversationHistory(sessionId) {
  if (!conversationStore.has(sessionId)) {
    conversationStore.set(sessionId, []);
  }
  return conversationStore.get(sessionId);
}

function addToConversationHistory(sessionId, role, content) {
  const history = getConversationHistory(sessionId);
  history.push({ role, content, timestamp: Date.now() });
  
  // Keep only last 10 messages
  if (history.length > 10) {
    history.shift();
  }
}

function buildPromptWithHistory(userMessage, sessionId) {
  const history = getConversationHistory(sessionId);
  
  let prompt = systemPrompt + "\n\n";
  
  // Add conversation context
  if (history.length > 0) {
    prompt += "Previous conversation:\n";
    history.slice(-6).forEach(msg => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      prompt += `${role}: ${msg.content}\n`;
    });
    prompt += "\n";
  }
  
  prompt += `User: ${userMessage}\nAssistant:`;
  
  return prompt;
}

async function chatHandler(req, res) {
  try {
    const { message, sessionId = 'default' } = req.body;

    // Basic validation
    if (!message || typeof message !== "string") {
      return res.status(400).json({ 
        error: "Message is required" 
      });
    }

    const trimmedMessage = message.trim();
    
    if (trimmedMessage.length === 0) {
      return res.status(400).json({ 
        error: "Message cannot be empty" 
      });
    }

    if (trimmedMessage.length > 2000) {
      return res.status(400).json({ 
        error: "Message is too long (max 2000 characters)" 
      });
    }

    // Minimal spam filtering
    if (!shouldProcessMessage(trimmedMessage)) {
      return res.json({
        response: "I'm here to help with questions about the TeacherWorld Portal. How can I assist you?"
      });
    }

    // Build prompt with conversation history
    const prompt = buildPromptWithHistory(trimmedMessage, sessionId);

    // Get AI response
    const aiResponse = await generateGeminiResponse(prompt);

    // Handle empty response
    if (!aiResponse || !aiResponse.trim()) {
      return res.json({
        response: "This question is not related to teachers, institutions, recruitment or education. Please ask something related to the TeacherWorld Portal."
      });
    }

    const finalResponse = aiResponse.trim();

    // Store conversation history
    addToConversationHistory(sessionId, 'user', trimmedMessage);
    addToConversationHistory(sessionId, 'assistant', finalResponse);

    // Return response
    res.json({ 
      response: finalResponse,
      sessionId: sessionId
    });

  } catch (error) {
    console.error("Error in chatHandler:", error);
    
    res.status(500).json({ 
      error: "Something went wrong. Please try again.",
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message 
      })
    });
  }
}

// Cleanup old conversations periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes
  
  for (const [sessionId, history] of conversationStore.entries()) {
    if (history.length > 0) {
      const lastMessage = history[history.length - 1];
      if (now - lastMessage.timestamp > maxAge) {
        conversationStore.delete(sessionId);
      }
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

module.exports = {
  chatHandler,
  systemPrompt
};