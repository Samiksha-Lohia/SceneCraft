import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import config from '../config/env.js';
import logger from '../utilities/logger.js';

// Initialize Generative AI clients
const genAI = config.ai.gemini?.apiKey ? new GoogleGenerativeAI(config.ai.gemini.apiKey) : null;
const groq = config.ai.groq?.apiKey ? new Groq({ apiKey: config.ai.groq.apiKey }) : null;

/**
 * Helper function to execute a function with exponential backoff.
 * Retries up to 3 times for transient failures.
 * Does not retry on auth errors or syntax errors.
 */
const retryWithBackoff = async (fn, attempts = 3, initialDelay = 1000) => {
  let delay = initialDelay;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Determine if error is a non-retryable error
      const isAuthError = 
        error.status === 401 || 
        error.status === 403 || 
        error.message?.includes('API_KEY_INVALID') || 
        error.message?.includes('API key not valid') ||
        error.message?.includes('invalid API key') ||
        error.message?.includes('Unauthorized');
      
      const isSyntaxError = error instanceof SyntaxError;

      if (isAuthError) {
        logger.error(`AI Provider Authentication Error: ${error.message}`);
        throw new Error(`AI Provider Authentication Failed: ${error.message}`);
      }

      if (isSyntaxError) {
        logger.error(`AI Provider JSON Syntax Error: ${error.message}`);
        throw error;
      }

      // Check if we have exhausted all attempts
      if (attempt === attempts) {
        logger.error(`AI Provider failed after ${attempts} attempts. Error: ${error.message}`);
        throw error;
      }

      // Check for rate-limiting
      if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Quota exceeded')) {
        logger.warn(`AI Provider rate-limited (attempt ${attempt}/${attempts}). Retrying in ${delay}ms...`);
      } else {
        logger.warn(`AI Provider call failed (attempt ${attempt}/${attempts}). Retrying in ${delay}ms... Error: ${error.message}`);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

/**
 * Generates structured JSON from a text prompt.
 *
 * @param {string} prompt - Prompt to pass to the model
 * @param {object} [schemaHint] - Optional JSON schema object or structural hint
 * @returns {Promise<object>} Parsed JSON response
 */
export const generateJSON = async (prompt, schemaHint = null) => {
  const provider = config.ai.provider || 'gemini';

  if (provider === 'groq') {
    if (!groq) {
      throw new Error('Groq client is not initialized. Please verify GROQ_API_KEY in .env');
    }

    const modelName = 'llama-3.3-70b-versatile';
    
    const result = await retryWithBackoff(async () => {
      let formattedPrompt = prompt;
      if (!/json/i.test(formattedPrompt)) {
        formattedPrompt += '\n\nIMPORTANT: Return the response as a valid JSON object.';
      }

      const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: formattedPrompt }],
        model: modelName,
        response_format: { type: 'json_object' }
      });

      const textResponse = response.choices[0]?.message?.content;
      if (!textResponse) {
        throw new Error('Received empty response from Groq model');
      }

      try {
        return JSON.parse(textResponse.trim());
      } catch (parseError) {
        throw new SyntaxError(`Failed to parse Groq response as JSON: ${parseError.message}. Response: ${textResponse}`);
      }
    });

    return result;
  }

  // Default fallback: Gemini
  if (!genAI) {
    throw new Error('Gemini client is not initialized. Please verify GEMINI_API_KEY in .env');
  }

  const modelName = 'gemini-2.0-flash';
  const model = genAI.getGenerativeModel({ model: modelName });

  const generationConfig = {
    responseMimeType: 'application/json',
  };

  if (schemaHint) {
    generationConfig.responseSchema = schemaHint;
  }

  const result = await retryWithBackoff(async () => {
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });
    
    const textResponse = response.response.text();
    if (!textResponse) {
      throw new Error('Received empty response from Gemini model');
    }

    try {
      return JSON.parse(textResponse.trim());
    } catch (parseError) {
      throw new SyntaxError(`Failed to parse Gemini response as JSON: ${parseError.message}. Response: ${textResponse}`);
    }
  });

  return result;
};

/**
 * Generates vector embedding for the given text.
 *
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} Array representing the embedding vector
 */
export const embedText = async (text) => {
  if (!genAI) {
    throw new Error('Gemini client is not initialized for embeddings. Please verify GEMINI_API_KEY in .env');
  }

  const modelName = config.ai.embeddingModel || 'text-embedding-004';
  const model = genAI.getGenerativeModel({ model: modelName });

  const result = await retryWithBackoff(async () => {
    const response = await model.embedContent({
      content: { parts: [{ text }] },
    });
    
    if (!response?.embedding?.values) {
      throw new Error('Invalid embedding response from model');
    }
    return response.embedding.values;
  });

  return result;
};
