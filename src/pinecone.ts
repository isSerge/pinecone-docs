import { PineconeClient } from '@pinecone-database/pinecone'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

import { config } from "./config"
import { logger } from "./logger"
import { StuffDocumentsChain } from 'langchain/chains';

const CREATE_INDEX_TIMEOUT = 60000;

type VectorItem = {
  id: string;
  values: number[];
  metadata: Record<string, string>;
}

export class PineconeDB {
  client: PineconeClient = new PineconeClient;

  async init({ apiKey, environment }: { apiKey: string, environment: string }) {
    return this.client.init({ apiKey, environment });
  }

  async createIndex(indexName: string, vectorDimension: number) {
    logger.info(`Creating index ${indexName}`);

    const existingIndexes = await this.client.listIndexes();

    logger.info(`Existing indexes: ${JSON.stringify(existingIndexes)}`);

    if (existingIndexes.includes(indexName)) {
      logger.info(`Index ${indexName} already exists`);
      return;
    }

    await this.client.createIndex({
      createRequest: {
        name: indexName,
        dimension: vectorDimension,
        metric: 'cosine',
      }
    });

    logger.info(`Created index ${indexName}`);

    await new Promise(resolve => setTimeout(resolve, CREATE_INDEX_TIMEOUT));
  }

  async updateIndex(indexName: string, docs: Document[]) {
    const index = this.client.Index(indexName);

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
    });

    logger.info(`Updating index ${indexName}`);

    const batchSize = 100;

    for (const document of docs) {
      logger.info(`Adding document ${document.metadata} to index ${indexName}`);
      const txtPath = document.metadata.source;
      const text = document.pageContent;

      const chunks = await textSplitter.createDocuments([text]);

      logger.info(`Adding ${chunks.length} chunks to index ${indexName}`);

      const texts = chunks.map(chunk => chunk.pageContent.replace(/\n/g, ' ')); // remove newlines

      const embeddings = await new OpenAIEmbeddings({ openAIApiKey: config.OPENAI_API_KEY }).embedDocuments(texts);

      let batch: VectorItem[] = [];

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

  async query(chain: StuffDocumentsChain, indexName: string, question: string) {
    logger.info(`Querying index ${indexName} with query: ${question}`);

    const index = this.client.Index(indexName);
    const queryEmbedding = await new OpenAIEmbeddings().embedQuery(question);

    const queryResult = await index.query({
      queryRequest: {
        vector: queryEmbedding,
        topK: 10,
        includeMetadata: true,
      }
    });

    if (queryResult?.matches?.length) {
      const content = queryResult.matches
        .map((match: any) => match.metadata.pageContent)
        .join(' ');

      const result = await chain.call({
        input_documents: [new Document({ pageContent: content })],
        question,
      })

      return result.text;
    } else {
      logger.info(`No matches found for query ${question}`);
    }
  }
}
