import * as Joi from 'joi';
import * as dotenv from 'dotenv';

dotenv.config();

interface ConfigSchema {
  OPENAI_API_KEY: string;
  PINECONE_API_KEY: string;
  PINECONE_ENVIRONMENT: string;
  PINECONE_INDEX: string;
  DB_TYPE: 'pinecone' | 'faiss' | 'chroma';
}

class Config {
  OPENAI_API_KEY: string;
  PINECONE_API_KEY: string;
  PINECONE_ENVIRONMENT: string;
  PINECONE_INDEX: string;
  DB_TYPE: 'pinecone' | 'faiss' | 'chroma';

  constructor() {
    const schema = Joi.object({
      OPENAI_API_KEY: Joi.string().required(),
      PINECONE_API_KEY: Joi.string().required(),
      PINECONE_ENVIRONMENT: Joi.string().required(),
      PINECONE_INDEX: Joi.string().required(),
      DB_TYPE: Joi.string().valid('pinecone', 'faiss', 'chroma').required(),
    });

    const config: ConfigSchema = {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      PINECONE_API_KEY: process.env.PINECONE_API_KEY || '',
      PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT || '',
      PINECONE_INDEX: process.env.PINECONE_INDEX || '',
      DB_TYPE: process.env.DB_TYPE as 'pinecone' | 'faiss' | 'chroma',
    };

    const { error, value } = schema.validate(config);

    if (error) {
      throw new Error(`Config validation error: ${error.details[0].message}`);
    }

    this.OPENAI_API_KEY = value.OPENAI_API_KEY;
    this.PINECONE_API_KEY = value.PINECONE_API_KEY;
    this.PINECONE_ENVIRONMENT = value.PINECONE_ENVIRONMENT;
    this.PINECONE_INDEX = value.PINECONE_INDEX;
    this.DB_TYPE = value.DB_TYPE;
  }
}

export const config = new Config();
