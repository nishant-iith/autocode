import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the YAML specification
const swaggerDocument = YAML.load(path.join(__dirname, '..', 'docs', 'swagger.yaml'));

// Swagger JSDoc options for inline documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AutoCode API',
      version: '1.0.0',
      description: 'Online VS Code for Node.js Development API',
    },
    servers: [
      {
        url: 'http://localhost:5001/api',
        description: 'Development server',
      },
    ],
  },
  apis: ['./routes/*.js', './index.js'], // Path to the API files for inline docs
};

// Create Swagger specification
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Merge with YAML specification (YAML takes precedence)
const finalSpec = {
  ...swaggerSpec,
  ...swaggerDocument,
  // Merge paths if both exist
  paths: {
    ...swaggerSpec.paths,
    ...swaggerDocument.paths,
  },
  // Merge components if both exist
  components: {
    ...swaggerSpec.components,
    ...swaggerDocument.components,
  },
};

// Swagger UI options
const swaggerUiOptions = {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { color: #007acc; }
    .swagger-ui .scheme-container { background: #f7f7f7; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .swagger-ui .btn.execute { background-color: #007acc; border-color: #007acc; }
    .swagger-ui .btn.execute:hover { background-color: #005a9e; }
  `,
  customSiteTitle: 'AutoCode API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayOperationId: true,
    filter: true,
    tryItOutEnabled: true,
    requestInterceptor: (req) => {
      // Add any request modifications here
      return req;
    },
    responseInterceptor: (res) => {
      // Add any response modifications here  
      return res;
    },
  },
};

export { finalSpec as swaggerSpec, swaggerUi, swaggerUiOptions };