import { generateJSON, embedText } from '../src/services/ai-provider.service.js';
import logger from '../src/utilities/logger.js';

async function main() {
  logger.info('Starting AI Ping test...');
  
  try {
    // 1. Test generateJSON
    logger.info('Testing generateJSON...');
    const testPrompt = 'Respond with a JSON object containing a "status" field set to "success" and a "message" field saying hello.';
    const schemaHint = {
      type: 'OBJECT',
      properties: {
        status: { type: 'STRING' },
        message: { type: 'STRING' }
      },
      required: ['status', 'message']
    };
    
    const jsonResult = await generateJSON(testPrompt, schemaHint);
    logger.info(`generateJSON result: ${JSON.stringify(jsonResult)}`);
    
    if (jsonResult && jsonResult.status === 'success') {
      logger.info('✓ generateJSON test passed!');
    } else {
      throw new Error('generateJSON did not return the expected JSON format');
    }
    
    // 2. Test embedText
    logger.info('Testing embedText...');
    const embedding = await embedText('SceneCraft AI Ping');
    logger.info(`embedText result: array of size ${embedding.length}`);
    
    if (Array.isArray(embedding) && embedding.length > 0) {
      logger.info('✓ embedText test passed!');
    } else {
      throw new Error('embedText did not return a valid array');
    }
    
    logger.info('=== All AI Ping tests passed successfully! ===');
    process.exit(0);
  } catch (error) {
    logger.error(`AI Ping test failed: ${error.message}`);
    process.exit(1);
  }
}

main();
