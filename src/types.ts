export type HttpMethod = "get" | "post" | "put" | "delete" | "patch";

export interface OpenAPIOperation {
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: (OpenAPIParameterV2 | OpenAPIParameterV3)[];
  requestBody?: OpenAPIRequestBody;
  responses?: OpenAPIResponses;
}

export interface OpenAPIParameterV2 {
  name: string;
  in: "query" | "header" | "path" | "cookie";
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  type?: string;
  format?: string;
  items?: OpenAPISchema;
  collectionFormat?: string;
  default?: any;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  enum?: any[];
  multipleOf?: number;
  allowReserved?: boolean;
  schema?: OpenAPISchema;
  example?: any;
  examples?: { [media: string]: any };
  content?: { [media: string]: any };
}

export interface OpenAPIParameterV3 {
  name: string;
  in: "query" | "header" | "path" | "cookie" | "body";
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: OpenAPISchema;
  example?: any;
  examples?: { [media: string]: any };
  content?: { [media: string]: any };
}

export interface OpenAPIRequestBody {
  description?: string;
  content: { [media: string]: OpenAPIMediaType };
  required?: boolean;
}

export interface OpenAPIResponses {
  [statusCode: string]: OpenAPIResponse;
}

export interface OpenAPIResponse {
  description: string;
  headers?: { [header: string]: OpenAPIHeader };
  content?: { [media: string]: OpenAPIMediaType };
  links?: { [link: string]: OpenAPILink };
}

export interface OpenAPIHeader {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: OpenAPISchema;
  example?: any;
  examples?: { [media: string]: any };
  content?: { [media: string]: any };
}

export interface OpenAPILink {
  operationRef?: string;
  operationId?: string;
  parameters?: { [parameter: string]: any };
  requestBody?: any;
  description?: string;
  server?: OpenAPIServer;
}

export interface OpenAPIServer {
  url: string;
  description?: string;
  variables?: { [variable: string]: OpenAPIServerVariable };
}

export interface OpenAPIServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

export interface OpenAPIMediaType {
  schema?: OpenAPISchema;
  example?: any;
  examples?: { [media: string]: any };
  encoding?: { [encoding: string]: OpenAPIEncoding };
}

export interface OpenAPIEncoding {
  contentType?: string;
  headers?: { [header: string]: OpenAPIHeader };
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

export interface OpenAPISchema {
  type?: string | string[];
  properties?: { [key: string]: OpenAPISchema };
  items?: OpenAPISchema;
  required?: string[];
  example?: any;
  examples?: any[];
  additionalProperties?: boolean | OpenAPISchema;
  enum?: any[];
  format?: string;
  description?: string;
  default?: any;
  [key: string]: any;
}

export interface OpenAPIPath {
  [key: string]: {
    [method in HttpMethod]?: OpenAPIOperation;
  };
}

export interface OpenAPISpec {
  swagger?: string;
  openapi?: string;
  paths: OpenAPIPath;
  host: string;
  basePath?: string;
  servers?: OpenAPIServer[];
}
