import { generate } from 'openapi-typescript-codegen';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCHEMA_PATH = path.resolve(__dirname, '../../backend/schema.yml');
const OUTPUT_DIR = path.resolve(__dirname, '../src/api/generated');

async function generateClient() {
    try {
        console.log('Generating API client from:', SCHEMA_PATH);
        await generate({
            input: SCHEMA_PATH,
            output: OUTPUT_DIR,
            clientName: 'ApiClient',
            useOptions: true,
            httpClient: 'axios',
        });
        console.log('API client generated successfully!');
    } catch (error) {
        console.error('Error generating API client:', error);
        process.exit(1);
    }
}

generateClient();
