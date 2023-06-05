import { PineconeClient } from '@pinecone-database/pinecone'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAI } from 'langchain/llms/openai';
import { loadQAStuffChain, StuffDocumentsChain } from 'langchain/chains';
import { Document } from 'langchain/document';

import { logger } from './logger';
import { config } from './config';

export const submitQuery = async (
  client: PineconeClient,
  chain: StuffDocumentsChain,
  indexName: string,
  question: string,
) => {
  logger.info(`Querying index ${indexName} with query: ${question}`);

  const index = client.Index(indexName);
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

async function main() {
  try {
    const query = process.argv[2];
    const llm = new OpenAI({ openAIApiKey: config.OPENAI_API_KEY });
    const chain = await loadQAStuffChain(llm);
    const client = new PineconeClient();

    await client.init({
      apiKey: config.PINECONE_API_KEY,
      environment: config.PINECONE_ENVIRONMENT,
    });

    const text = await submitQuery(client, chain, config.PINECONE_INDEX, query)

    logger.info(`Answer: ${text}`);
  } catch (error) {
    logger.error(error);
  }
}

main().catch(console.error);
