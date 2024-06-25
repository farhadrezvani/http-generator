export function toPascalCase(str: string) {
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    ?.map((x) => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase())
    ?.join("");
}

export function deduplicateMethod(method: string, str: string) {
  const filename = str.replace(method, "");

  return toPascalCase(`${method}-${filename}`);
}

export function removeTrailingSlash(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function formatCommentLines(text: string) {
  const comment = text
    .split("\n")
    .map((line) => `# ${line}`)
    .join("\n");

  return `${comment}\n`;
}

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
