import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("No GEMINI_API_KEY found in .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const modelsToTest = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
];

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const response = await model.generateContent("hello");
    console.log(`✓ Model "${modelName}" succeeded: "${response.response.text().trim()}"`);
    return true;
  } catch (err) {
    console.log(`✗ Model "${modelName}" failed: ${err.message}`);
    return false;
  }
}

async function run() {
  console.log("Testing available Gemini models...");
  for (const model of modelsToTest) {
    await testModel(model);
  }
}

run();
