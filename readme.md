# Node.js example with OpenAI and Pinecone

This app that uses the OpenAI and Pinecone libraries to create and query indexes for documents.

The application contains two scripts: `create` and `query`. 

- `create`: This script creates an index in the Pinecone database and updates it with chunks of text from the documents in the specified directory. The chunks are embedded using OpenAI.

- `query`: This script allows the user to submit a question to the application. The application then finds the most relevant document chunks for this question in the Pinecone index, and uses these chunks to generate an answer.

## Available scripts

- `npm run create`: Create and update an index with the documents in the specified directory.
- `npm run query`: Submit a question to the application.

Other scripts:

- `npm run build`: Transpile TypeScript to ES6
- `npm run lint`: Check the codebase using ESLint

## Environment Variables

The following environment variables are required for the application:

- `OPENAI_API_KEY`: Your OpenAI API Key.
- `PINECONE_API_KEY`: Your Pinecone API Key.
- `PINECONE_ENVIRONMENT`: The Pinecone environment. Should be either 'production' or 'development'.
- `PINECONE_INDEX`: The name of the Pinecone index.

You can define these environment variables in a `.env` file at the root of your project. An example `.env` file might look like:

```
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=production
PINECONE_INDEX=my_index
```


## Dependencies

This application uses the following libraries:

- [Pinecone](https://www.pinecone.io/): To create and query the indexes.
- [OpenAI](https://openai.com/): To generate embeddings for the document chunks.
- [Joi](https://joi.dev/): To validate the environment variables.
- [dotenv](https://www.npmjs.com/package/dotenv): To load the environment variables.
- [Pino](https://getpino.io/#/): For logging.
- [langchain](https://github.com/urigoren/langchain): A library for language analysis and manipulation.

## Usage

To use this application, you should follow these steps:

1. Clone the repository.
2. Install the dependencies using the command `npm install`.
3. Define your environment variables in a `.env` file.
4. Create a `documents` directory at the root of your project and add your Markdown (.md) documents to this directory.
5. Build the application using the command `npm run build`.
6. Run the `create` script with `npm run create`. This will create and update an index with the documents in the `documents` directory.
7. Run the `query` script with `npm run query 'your question here'`.

Please remember to replace `'your question here'` with your actual question.

**Note:** The `create` script expects documents in Markdown format. If your documents are in a different format, you will need to convert them to Markdown before running the script.

