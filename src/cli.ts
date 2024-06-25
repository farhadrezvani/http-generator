#!/usr/bin/env node

import { Command } from "commander";
import { version } from "../package.json";
import { convertToHttpFile, loadOpenAPISpec } from "./transforms";
import { handleError, validateOptions } from "./utils";

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

if (process.argv.length <= 2) {
  program.help();
}

async function main() {
  const options = program.opts();

  try {
    validateOptions(options);
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
  } catch (error) {
    handleError(error);
  }
}

main().catch(console.error);
