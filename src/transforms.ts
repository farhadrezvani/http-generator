import OpenAPIParser from "@readme/openapi-parser";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import * as path from "path";
import type { OpenAPIOperation, OpenAPISchema, OpenAPISpec } from "./types";
import {
  formatCommentLines,
  generateFileName,
  removeTrailingSlash,
} from "./utils";

export async function loadOpenAPISpec(
  filePath: string,
  skipValidation: boolean
): Promise<OpenAPISpec> {
  return OpenAPIParser.validate(filePath, {
    validate: { schema: !skipValidation, spec: !skipValidation },
  }) as Promise<OpenAPISpec>;
}

export function extractRequestBodyExample(content: any): any {
  const jsonContentType = "application/json";
  if (content[jsonContentType]) {
    return (
      content[jsonContentType].example ||
      content[jsonContentType].examples?.[0]?.value ||
      generateExampleFromSchema(content[jsonContentType].schema)
    );
  } else {
    return generateExampleFromSchema(content.schema);
  }
}

export function generateExampleFromSchema(schema: OpenAPISchema): any {
  if (!schema) return {};

  if (schema.type === "array" && schema.items) {
    const exampleArray: any[] = [];
    const itemExample = generateExampleFromSchema(schema.items);
    exampleArray.push(itemExample);
    return exampleArray;
  }

  const example: any = {};

  if (schema.properties) {
    for (const [key, value] of Object.entries(schema.properties)) {
      example[key] = generateExampleValue(value);
    }
  }

  return example;
}

export function generateExampleValue(schema: any): any {
  if (!schema || !schema.type) return null;

  switch (schema.type) {
    case "string":
      return schema.enum ? schema.enum[0] : schema.format || schema.type;
    case "number":
      return 0;
    case "integer":
      return 0;
    case "boolean":
      return false;
    case "array":
      return schema.items ? [generateExampleValue(schema.items)] : [];
    case "object":
      return generateExampleFromSchema(schema);
    default:
      return null;
  }
}

export function writeFileOrCreateDirectory(
  filePath: string,
  content: string
): void {
  const dir = path.extname(filePath) ? path.dirname(filePath) : filePath;
  const isFile = !!path.extname(filePath);

  try {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const actualFilePath = isFile ? filePath : path.join(dir, "output.http");
    writeFileSync(actualFilePath, content, "utf8");
    console.log(`Content written to ${actualFilePath}`);
  } catch (error) {
    console.error(`Error creating file or directory: ${error}`);
    throw error;
  }
}

export function convertToHttpFile(
  openAPISpec: OpenAPISpec,
  outputDir: string,
  baseUrl?: string,
  token?: string
) {
  const host = openAPISpec.host;
  const basePath = openAPISpec.basePath;
  const serverUrl = openAPISpec.servers?.[0]?.url;
  const apiEndpoint = baseUrl || host + basePath || serverUrl || "";

  const generateHttpFileContent = (
    path: string,
    method: string,
    operation: OpenAPIOperation
  ) => {
    let content = "";

    if (operation.summary) {
      content += formatCommentLines(`Summary: ${operation.summary}`);
    }

    if (operation.description) {
      content += formatCommentLines(`Description: ${operation.description}`);
    }

    content += `${method.toUpperCase()} ${removeTrailingSlash(
      apiEndpoint
    )}${path}\n`;

    if (operation?.parameters) {
      for (const param of operation.parameters) {
        if (param.in === "query") {
          content += `?${param.name}=${generateExampleValue(param.schema)}\n`;
        } else if (param.in === "header") {
          content += `${param.name}:${generateExampleValue(param.schema)}\n`;
        }
      }
    }

    if (token) {
      content += `Authorization: {{authorization}}\n`;
    }

    if (operation?.requestBody && operation.requestBody.content) {
      // OpenAPI 3.0
      const contentType = Object.keys(operation.requestBody.content)[0];
      content += `Content-Type: ${contentType}\n\n`;

      const example = extractRequestBodyExample(operation.requestBody.content);
      if (typeof example === "string") {
        content += `${example}\n`;
      } else {
        content += `${JSON.stringify(example, null, 2)}\n`;
      }
    } else if (operation?.parameters) {
      // Swagger 2.0
      const bodyParam = operation.parameters.find(
        (param) => param.in === "body"
      );
      if (bodyParam) {
        content += `Content-Type: application/json\n\n`;

        const example = extractRequestBodyExample(bodyParam);
        if (typeof example === "string") {
          content += `${example}\n`;
        } else {
          content += `${JSON.stringify(example, null, 2)}\n`;
        }
      }
    }

    if (isHttpFile) {
      content += "\n###\n\n";
    }

    return content;
  };

  const isHttpFile = path.extname(outputDir).toLowerCase() === ".http";

  if (isHttpFile) {
    let httpFileContent = "";

    if (token) {
      httpFileContent += `@authorization = ${token}\n\n`;
    }

    for (const [path, methods] of Object.entries(openAPISpec.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        httpFileContent += generateHttpFileContent(path, method, operation);
      }
    }

    writeFileOrCreateDirectory(outputDir, httpFileContent);
  } else {
    for (const [path, methods] of Object.entries(openAPISpec.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        let httpFileContent = "";

        if (token) {
          httpFileContent += `@authorization=${token}\n\n`;
        }

        httpFileContent += generateHttpFileContent(path, method, operation);
        const sanitizedPath = path.replace(/[\/{}]/g, "-");
        const operationId = operation.operationId || sanitizedPath;
        const filename = generateFileName(method, operationId);
        const outputFilePath = `${outputDir}/${filename}.http`;

        writeFileOrCreateDirectory(outputFilePath, httpFileContent);
      }
    }
  }
}
