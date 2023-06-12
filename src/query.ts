import { OpenAI } from 'langchain/llms/openai';
import { loadQAStuffChain } from 'langchain/chains';

import { logger } from './logger';
import { config } from './config';
import { PineconeDB } from './pinecone';

async function main() {
  try {
    const query = process.argv[2];
    const llm = new OpenAI({
      openAIApiKey: config.OPENAI_API_KEY, 
      temperature: 0.9,
      modelName: "gpt-3.5-turbo",
    });
    const chain = await loadQAStuffChain(llm);
    const db = new PineconeDB();

    await db.init({
      apiKey: config.PINECONE_API_KEY,
      environment: config.PINECONE_ENVIRONMENT,
    });

    const text = await db.query(chain, config.PINECONE_INDEX, query);

    logger.info(`Answer: ${text}`);
  } catch (error) {
    logger.error(error);
  }
}

main().catch(console.error);
