import { TextLoader } from 'langchain/document_loaders/fs/text'
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory'

import { logger } from "./logger"
import { config } from "./config"
import { PineconeDB } from "./pinecone"
import { ChromaDB } from './chroma'
import { FaissDB } from './faiss'

async function main() {
  const loader = new DirectoryLoader('./documents', {
    ".md": (path) => new TextLoader(path)
  });

  const docs = await loader.load();

  try {
    if (config.DB_TYPE === 'pinecone') {
      const vectorDimension = 1536
      const indexName = config.PINECONE_INDEX;
      const db = new PineconeDB();
      await db.init({
        apiKey: config.PINECONE_API_KEY,
        environment: config.PINECONE_ENVIRONMENT,
      });
      await db.createIndex(indexName, vectorDimension);
      await db.updateIndex(indexName, docs);
    } else {
      const db = config.DB_TYPE === 'faiss' ? new FaissDB() : new ChromaDB();
      await db.init(docs);
    }
  } catch (err) {
    logger.error(err, 'error: ')
  }
}

main();
