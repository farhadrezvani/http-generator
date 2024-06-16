# http-generator

Generate `.http` files from OpenAPI specifications

## Features

- Generate a single http file for all requests
- Generate one http file per request
- Easy-to-use command line interface

## Installation

Install via npm:

```bash
npm install http-generator
```

## Usage

Run http-generator with the appropriate options:

```bash
Usage: http-generator [options]

Generate .http files from OpenAPI specifications

Options:
  -i, --input <input>       OpenAPI specifications file or URL
  -o, --output <output>     Output directory or HTTP file
  -b, --base-url <baseUrl>  Base URL for the API
  -t, --token <token>       Authorization token
  -s, --skip-validation     Skip validation of OpenAPI Specification (default: false)
  -v, --version             Display version number
  -h, --help                Display this message
```

## Contributing

Contributions are welcome! Please submit issues or pull requests.

## License

Licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
