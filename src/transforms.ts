import OpenAPIParser from "@readme/openapi-parser";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import * as path from "path";
import type { OpenAPIOperation, OpenAPISchema, OpenAPISpec } from "./types";
import {
  deduplicateMethod,
  formatCommentLines,
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

export function generateRequestBody(
  contentType: string | undefined,
  param: any
) {
  let content = `Content-Type: ${contentType}\n\n`;
  const example = extractRequestBodyExample(param);

  if (typeof example === "string") {
    content += `${example}\n`;
  } else {
    content += `${JSON.stringify(example, null, 2)}\n`;
  }

  return content;
}

export function generatePathVariable(str: string, name?: string): string {
  const pathVariable = name ? `{{${name}_$1}}` : "{{$1}}";
  return str.replace(/{([^{}]+)}/g, pathVariable);
}

export function generateContent(...parts: string[]): string {
  return parts.join("");
}

export function addAuthorization(token?: string) {
  let auth = "";
  if (token) {
    auth = `@authorization = ${token}\n\n`;
  }
  return auth;
}

export function generateUniqueName(
  method: string,
  path: string,
  operation: OpenAPIOperation,
  name?: string
) {
  const operationId = operation.operationId || path;
  const operationName = deduplicateMethod(method, operationId);
  const uniqueName = name ? `${operationName}_${name}` : operationName;

  return uniqueName;
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
  const isHttpFile = path.extname(outputDir).toLowerCase() === ".http";

  const generateHttpFileContent = (
    path: string,
    method: string,
    operation: OpenAPIOperation
  ) => {
    let httpComment = "";
    let httpVariable = "";
    let httpUrl = "";
    let httpParam = "";
    let httpBody = "";

    const variablePrefix = isHttpFile
      ? generateUniqueName(method, path, operation)
      : undefined;

    path = generatePathVariable(path, variablePrefix);

    if (operation.summary) {
      httpComment += formatCommentLines(`Summary: ${operation.summary}`);
    }

    if (operation.description) {
      httpComment += formatCommentLines(
        `Description: ${operation.description}`
      );
    }

    httpUrl += `${method.toUpperCase()} ${removeTrailingSlash(
      apiEndpoint
    )}${path}\n`;

    if (operation?.parameters) {
      for (const param of operation.parameters) {
        const schema = param.schema || { ...param };
        const variableName = variablePrefix
          ? `${variablePrefix}_${param.name}`
          : param.name;

        if (param.in === "query") {
          httpVariable += `@${variableName}=${generateExampleValue(schema)}\n`;
          httpParam += `${httpParam.length ? "&" : "?"}${
            param.name
          }={{${variableName}}}\n`;
        }
        if (param.in === "header") {
          httpVariable += `@${variableName}=${generateExampleValue(schema)}\n`;
          httpParam += `${param.name}:{{${variableName}}}\n`;
        }
        if (param.in === "path") {
          httpVariable += `@${variableName}=${generateExampleValue(schema)}\n`;
        }
        if (param.in === "body") {
          httpBody += generateRequestBody("application/json", param);
        }
      }
    }

    if (token) {
      httpParam += `Authorization: {{authorization}}\n`;
    }

    if (operation?.requestBody && operation.requestBody.content) {
      const contentType = Object.keys(operation.requestBody.content)[0];

      httpBody += generateRequestBody(
        contentType,
        operation.requestBody.content
      );
    }

    let content = generateContent(
      httpComment,
      httpVariable,
      httpUrl,
      httpParam,
      httpBody
    );

    if (isHttpFile) {
      content += "\n###\n\n";
    }

    return content;
  };

  if (isHttpFile) {
    let httpFileContent = addAuthorization(token);

    for (const [path, methods] of Object.entries(openAPISpec.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        httpFileContent += generateHttpFileContent(path, method, operation);
      }
    }

    writeFileOrCreateDirectory(outputDir, httpFileContent);
  } else {
    for (const [path, methods] of Object.entries(openAPISpec.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        let httpFileContent = addAuthorization(token);

        httpFileContent += generateHttpFileContent(path, method, operation);

        const fileName = generateUniqueName(method, path, operation);
        const outputFilePath = `${outputDir}/${fileName}.http`;

        writeFileOrCreateDirectory(outputFilePath, httpFileContent);
      }
    }
  }
}
