import OpenAPIParser from "@readme/openapi-parser";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import * as path from "path";
import type { OpenAPIOperation, OpenAPISchema, OpenAPISpec } from "./types";

export function validateOptions(options: any) {
  if (!options.input) {
    throw new Error("Input file is required.");
  }
  if (!options.output) {
    throw new Error("Output file is required.");
  }
}

export function handleError(error: unknown) {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error("An unknown error occurred");
  }
  process.exit(1);
}

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
  }
  return "-- Add your payload here --";
}

export function generateExampleFromSchema(schema: OpenAPISchema): any {
  if (!schema) return {};
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
      return schema.enum ? schema.enum.join(",") : schema.format || schema.type;
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

const toPascalCase = (str: string) => {
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    ?.map((x) => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase())
    ?.join("");
};

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
  token: string
) {
  const basePath = openAPISpec.basePath || "";
  const serverUrl = openAPISpec.servers?.[0]?.url || "";

  const generateHttpFileContent = (
    path: string,
    method: string,
    operation: OpenAPIOperation
  ) => {
    let content = "";

    if (operation.summary) {
      content += `# ${operation.summary}\n`;
    }

    if (operation.description) {
      content += `# ${operation.description}\n`;
    }

    content += `${method.toUpperCase()} ${serverUrl}${basePath}${path}\n`;

    if (token) {
      content += `Authorization: Bearer ${token}\n`;
    }

    if (operation?.parameters) {
      for (const param of operation.parameters) {
        if (param.in === "query") {
          content += `?${param.name}=${generateExampleValue(param.schema)}\n`;
        } else if (param.in === "header") {
          content += `${param.name}:${generateExampleValue(param.schema)}\n`;
        }
      }
    }

    if (operation?.requestBody && operation.requestBody.content) {
      const contentType = Object.keys(operation.requestBody.content)[0];
      content += `Content-Type: ${contentType}\n\n`;

      const example = extractRequestBodyExample(operation.requestBody.content);
      if (typeof example === "string") {
        content += `${example}\n`;
      } else {
        content += `${JSON.stringify(example, null, 2)}\n`;
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

    for (const [path, methods] of Object.entries(openAPISpec.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        httpFileContent += generateHttpFileContent(path, method, operation);
      }
    }

    writeFileOrCreateDirectory(outputDir, httpFileContent);
  } else {
    for (const [path, methods] of Object.entries(openAPISpec.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        const httpFileContent = generateHttpFileContent(
          path,
          method,
          operation
        );
        const sanitizedPath = path.replace(/[\/{}]/g, "-");
        const operationId =
          operation.operationId || `${method}${sanitizedPath}`;
        const camelCaseOperationId = toPascalCase(operationId);
        const outputFilePath = `${outputDir}/${camelCaseOperationId}.http`;

        writeFileOrCreateDirectory(outputFilePath, httpFileContent);
      }
    }
  }
}
