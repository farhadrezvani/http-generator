import { cosmiconfig } from "cosmiconfig";
import * as v from "valibot";

const explorer = cosmiconfig("httpgen");

export const configSchema = v.object({
  input: v.string("OpenAPI specifications file or URL is required"),
  output: v.string("Output directory or HTTP file is required"),
  baseUrl: v.optional(v.string()),
  token: v.optional(v.string()),
  skipValidation: v.optional(v.boolean()),
});

export type Options = v.InferOutput<typeof configSchema>;

export async function loadConfig(): Promise<Options | undefined> {
  const result = await explorer.search();

  if (result && result.config) {
    console.log(`Using config: ${result.filepath}`);
    return result.config;
  }
}

export async function mergeOptions(commanderOptions: Options) {
  const configFileOptions = await loadConfig();

  const options: Options = {
    ...configFileOptions,
    ...commanderOptions,
  };

  return { hasConfig: !!configFileOptions, options };
}

export function defineConfig(options: Options): Options {
  return options;
}
