#!/usr/bin/env node

import { Command } from "commander";
import packageJson from "../package.json";
import {
  convertToHttpFile,
  handleError,
  loadOpenAPISpec,
  validateOptions,
} from "./functions";

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
  .name(packageJson.name)
  .version(packageJson.version, "-v, --version", "Display version number")
  .helpOption("-h, --help", "Display this message")
  .description("Generate .http files from OpenAPI specifications");

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}

async function main(options: any) {
  try {
    validateOptions(options);
    const openAPISpec = await loadOpenAPISpec(
      options.input,
      options.skipValidation
    );
    convertToHttpFile(openAPISpec, options.output, options.token);
  } catch (error) {
    handleError(error);
  }
}

const options = program.opts();
main(options).catch(console.error);
