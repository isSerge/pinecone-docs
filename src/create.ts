import { TextLoader } from 'langchain/document_loaders/fs/text'
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory'

import { logger } from "./logger"
import { config } from "./config"
import { PineconeDB } from "./pinecone"

async function main() {
  const loader = new DirectoryLoader('./documents', {
    ".md": (path) => new TextLoader(path)
  })
  const vectorDimensions = 1536
  const indexName = config.PINECONE_INDEX;
  const db = new PineconeDB();

  try {
    const docs = await loader.load()
    await db.init({
      apiKey: config.PINECONE_API_KEY,
      environment: config.PINECONE_ENVIRONMENT,
    });
    await db.createIndex(indexName, vectorDimensions);
    await db.updateIndex(indexName, docs);
  } catch (err) {
    logger.error('error: ', err)
  }
}

main();
