# http-generator

Generate `.http` files from OpenAPI specifications

## Features

- Generate HTTP file(s) either as

  - A single file containing all requests
  - A file per request

- Supports OpenAPI v2 and v3

  - JSON and YAML formats
  - Schema Validation

- Include authorization headers
- Include summaries and descriptions
- Variables for route parameters
- Specify base-url for convenient environment switching

## Installation

Install in your project folder:

```bash
npm i http-generator -D
# Using yarn
yarn add http-generator --dev
# Using pnpm
pnpm add http-generator -D
```

## Usage

Run http-generator with the appropriate options:

```bash
Usage: http-generator [options]

Generate .http files from OpenAPI specifications

Options:
  -i, --input <input>       OpenAPI specifications file or URL
  -o, --output <output>     Output directory or HTTP file
  -b, --base-url <baseUrl>  Base URL of the API
  -t, --token <token>       Authorization token
  -s, --skip-validation     Skip validation of OpenAPI Specification (default: false)
  -v, --version             Display version number
  -h, --help                Display this message
```

## Configuration File

You can also use `http-generator` using file configurations or in a property inside your package.json, and you can even use TypeScript and have type-safety while you are using it.

You can use any of these files:

- `httpgen.config.ts`
- `httpgen.config.js`
- `httpgen.config.cjs`
- `httpgen` property in your `package.json`

Basic Configuration:

```js
import { defineConfig } from "http-generator";

export default defineConfig({
  input: "schema.json",
  output: "output.http",
  baseUrl: "https://example.com",
  skipValidation: false,
  token: "Bearer Token",
});
```

## Contributing

Contributions are welcome! Please submit issues or pull requests.

## License

Licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
