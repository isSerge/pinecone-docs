import { FaissStore } from "langchain/vectorstores/faiss";
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { StuffDocumentsChain } from 'langchain/chains';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import { logger } from "./logger"
import { config } from "./config"

export class FaissDB {
  client: FaissStore | undefined = undefined;

  async init(docs: Document[]) {
    try {
      const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
      const texts = await splitter.splitDocuments(docs);
      const embeddings = new OpenAIEmbeddings({ openAIApiKey: config.OPENAI_API_KEY });
      const client = await FaissStore.fromDocuments(texts, embeddings);
      this.client = client;
    } catch (err) {
      console.log(err)
    }
  }

  async query(chain: StuffDocumentsChain, question: string) {
    if (!this.client) {
      throw new Error("FaissDB not initialized");
    }

    logger.info(`Querying index ${this.client.index} with query: ${question}`);

    const queryResult = await this.client.similaritySearch(question);

    if (queryResult.length) {
      const content = queryResult.map((doc) => doc.pageContent).join(' ');

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
