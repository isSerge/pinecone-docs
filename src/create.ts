import { PineconeClient } from '@pinecone-database/pinecone'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import { TextLoader } from 'langchain/document_loaders/fs/text'
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory'

import { logger } from "./logger"
import { config } from "./config"

const CREATE_INDEX_TIMEOUT = 60000;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const createIndex = async (
  client: PineconeClient,
  indexName: string,
  vectorDimension: number,
) => {
  logger.info(`Creating index ${indexName}`);

  const existingIndexes = await client.listIndexes();

  logger.info(`Existing indexes: ${JSON.stringify(existingIndexes)}`);

  if (existingIndexes.includes(indexName)) {
    logger.info(`Index ${indexName} already exists`);
    return;
  }

  await client.createIndex({
    createRequest: {
      name: indexName,
      dimension: vectorDimension,
      metric: 'cosine',
    }
  });

  logger.info(`Created index ${indexName}`);

  await wait(CREATE_INDEX_TIMEOUT);
}

const updateIndex = async (
  client: PineconeClient,
  indexName: string,
  docs: Document[],
) => {
  const index = client.Index(indexName);

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
  });

  logger.info(`Updating index ${indexName}`);

  const batchSize = 100;

  for (const document of docs) {
    logger.info(`Adding document ${document.metadata} to index ${indexName}`);
    const txtPath = document.metadata.source;
    const text = document.pageContent;

    const chunks = (await textSplitter.createDocuments([text]));

    logger.info(`Adding ${chunks.length} chunks to index ${indexName}`);

    const texts = chunks.map(chunk => chunk.pageContent.replace(/\n/g, ' ')); // remove newlines

    const embeddings = await new OpenAIEmbeddings({ openAIApiKey: config.OPENAI_API_KEY }).embedDocuments(texts);

    let batch: any = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const vector = {
        id: `${txtPath}-${i}`,
        values: embeddings[i],
        metadata: {
          ...chunk.metadata,
          loc: JSON.stringify(chunk.metadata.loc),
          pageContent: chunk.pageContent,
          txtPath,
        }
      }

      batch.push(vector);

      if (batch.length === batchSize || i === chunks.length - 1) {
        await index.upsert({
          upsertRequest: {
            vectors: batch,
          }
        });

        batch = [];
      }
    }
  }
}

async function main() {
  const loader = new DirectoryLoader('./documents', {
    ".md": (path) => new TextLoader(path)
  })

  const docs = await loader.load()
  const vectorDimensions = 1536
  const client = new PineconeClient()
  const indexName = config.PINECONE_INDEX;

  await client.init({
    apiKey: config.PINECONE_API_KEY,
    environment: config.PINECONE_ENVIRONMENT,
  });

  try {
    await createIndex(client, indexName, vectorDimensions)
    await updateIndex(client, indexName, docs)
  } catch (err) {
    logger.error('error: ', err)
  }
}

main();
