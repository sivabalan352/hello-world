import { ChatMessage } from '../types';

const API_KEY = import.meta.env.VITE_AI_API_KEY;

// This is a mock service that simulates an AI response if no API key is provided
// or acts as a wrapper for OpenAI/Gemini if configured.
export const sendMessageToAI = async (messages: ChatMessage[]): Promise<string> => {
  if (!API_KEY || API_KEY === 'YOUR_API_KEY') {
    // Mock response for development/demo without billing
    await new Promise(resolve => setTimeout(resolve, 1000));
    return "I'm a simulated AI assistant. To get real responses, please configure the VITE_AI_API_KEY in your .env file with a valid OpenAI or Gemini API key. For now, I can tell you that I think your question is interesting!";
  }

  try {
    // Example implementation for OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // or gpt-4
        messages: messages,
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI Service Error:', error);
    return "Sorry, I'm having trouble connecting to my brain right now. Please try again later.";
  }
};
