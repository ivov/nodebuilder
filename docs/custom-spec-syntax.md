<p align="center">
  <img src="./icons8-product-documents-64.png" />
</p>

<p align="center">
  <h2 align="center">Custom Spec Synax</h2>
</p>

<p align="center">
  Syntax to describe an API in YAML to generate an n8n node
</p>

<br>

Nodebuilder can generate an n8n node from a custom spec, i.e. a shorthand YAML description of an API.

Install [YAML Support](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) for VSCode.

## API-level keys

The YAML file must have two top-level keys: `metaParams` and `mainParams`

`metaParams` contains four required properties of the API itself:

```yaml
metaParams:
  apiUrl: https://api.myservice.com/    # base API URL
  authType: OAuth2                      # one of "OAuth2", "ApiKey", or "None"
  serviceName: MyService                # properly cased service name
  nodeColor: \#ff2564                   # brand hex color, escaped by /
```

Used in the node class `description`:

```ts
export class MyService implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MyService',
		name: 'myService',
		icon: 'file:myService.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Consume the MyService API',
		defaults: {
			name: 'MyService',
			color: '#ff2564',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
      // ...
```

`mainParams` contains one or more resources as keys, each pointing to an array of one or more operations:

```yaml
mainParams:
  company:
    - endpoint: /companies
      operationId: getAll
      operationUrl: https://myservice.com/api/get-all-companies
      requestMethod: GET
    - endpoint: /companies
      operationId: create
      operationUrl: https://myservice.com/api/create-a-company
      requestMethod: POST
  employee:
    - endpoint: /employees
      operationId: create
      operationUrl: https://myservice.com/api/create-an-employee
      requestMethod: POST
```

**Notes**

- If `endpoint` contains a bracketed string `{...}`, this will be parsed as a path parameter. Therefore, no need to create a parameter for any path parameters.

```yaml
- endpoint: /companies/{companyId}
  operationId: get
  requestMethod: GET
```

## Operation-level keys

Each operation in the array has the following keys.

Required keys:

- `endpoint`, the third party's API endpoint to call,
- `operationId`, the ID of the operation in the n8n node, and
- `requestMethod`, the HTTP method to use for the call.

Optional keys:

- `operationUrl`, a link to documentation on the operation,
- `requiredFields`, fields that are needed for a call to succeed, and
- optional fields, fields that are not needed for a call to succeed:
  - `additionalFields`, optional fields in general,
  - `filters`, optional fields for listing operations, and
  - `updateFields`, optional fields for updating operations.

Note that the "required" and "optional" keys refer to nodebuilder args, whereas `requiredFields` and "optional fields" refer to fields that may or may not be needed by the API for a call to succeed.

## Field-level keys

Field-level keys are contains for the params to be sent in the call. Each field-level property must contain one single key, either `queryString` or `requestBody`, based on the request method. Refer to the API documentation.

```yaml
- endpoint: /companies
  operationId: create
  requestMethod: POST
  requiredFields:
    requestBody:
      # ...
```

Inside `queryString` or `requestBody`,

- each key must be a param, cased per the API documentation.
- each value must specify its type:
  - `string`, `number`, `boolean` and `dateTime` for simple values, e.g. `is_active`,
  - `options` for individual options in a dropdown, e.g. `classification`,
  - `loadOptions` for options to be loaded remotely, e.g. `accounts`,
  - an object for a `fixedCollection` with a single set of fields, e.g. `address`,
  - an array of objects for a `fixedCollection` with a multiple sets of fields, e.g. `phone_numbers`,

```yaml
updateFields:
  requestBody:
    description: string|Arbitrary text to describe the company
    employees: number|Number of the employees at the company
    is_active: boolean=true|Whether the company's record is active
    founded_at: dateTime|Date when the company was created
    classification: options=Corporation|Legal classification of the company
      - LLC
      - Corporation
    accounts: loadOptions|Accounts owned by the company
    address:
      street: string
      city: string
      state: string
      postal_code: string
      country: string
    phone_numbers:
      - number: string
        category: string
```

**Notes**

- Optionally, specify a description with a pipe `|` after the type, e.g. `employees`.
- Optionally, specify a default with an equals sign `=` and the default after the type e.g. `is_active`. If the default is unspecified, a `string` or `dateTime` param defaults to `''`, a `number` param defaults to `0`, a `boolean` param defaults to `false`, and an `options` param defaults to the zeroth item.
