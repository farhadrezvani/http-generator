#!/usr/bin/env node

import { Command } from "commander";
import * as v from "valibot";
import { version } from "../package.json";
import { configSchema, mergeOptions, type Options } from "./options";
import { convertToHttpFile, loadOpenAPISpec } from "./transforms";
import { handleError } from "./utils";

const program = new Command();

program
  .option("-i, --input <input>", "OpenAPI specifications file or URL")
  .option("-o, --output <output>", "Output directory or HTTP file")
  .option("-b, --base-url <baseUrl>", "Base URL for the API")
  .option("-t, --token <token>", "Authorization token")
  .option(
    "-s, --skip-validation",
    "Skip validation of OpenAPI Specification",
    false
  )
  .name("http-generator")
  .version(version, "-v, --version", "Display version number")
  .helpOption("-h, --help", "Display this message")
  .description("Generate .http files from OpenAPI specifications");

program.parse(process.argv);

async function main() {
  const commanderOptions = program.opts<Options>();
  const { hasConfig, options } = await mergeOptions(commanderOptions);

  if (process.argv.length <= 2 && !hasConfig) {
    program.help();
  }

  v.parse(configSchema, options);

  const openAPISpec = await loadOpenAPISpec(
    options.input,
    options.skipValidation
  );

  convertToHttpFile(
    openAPISpec,
    options.output,
    options.baseUrl,
    options.token
  );
}

main().catch(handleError);
