<p align="center">
  <img src="./icons8-product-documents-64.png" />
</p>

<p align="center">
  <h2 align="center">Nodebuilder's YAML</h2>
</p>

<p align="center">
  Learn how to describe an API in YAML for the Nodebuilder
</p>

<br>

The Nodebuilder can generate an n8n node from a YAML mapping, i.e. a shorthand description of an API written in [YAML syntax](https://docs.ansible.com/ansible/latest/reference_appendices/YAMLSyntax.html).

## API-level keys

The YAML mapping must have two top-level keys: `metaParams` and `mainParams`

`metaParams` contains four required properties of the API itself:

```yaml
metaParams:
  apiUrl: https://api.myservice.com/ # base API URL
  authType: OAuth2 # one of "OAuth2", "ApiKey", or "None"
  serviceName: MyService # properly cased service name
  nodeColor: \#ff2564 # brand hex color, escaped by /
```

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

Note that the key `requiredFields` contains fields required for the call to succeed, but the key itself is optional since the call may not have any required fields.

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
- each value must specify its n8n type:
  - `string`, `number`, and `boolean` for simple values, e.g. `is_active`,
  - `enum` (to be renamed to `options`) for dropdown options, e.g. `classification`,
  - a YAML object for a `fixedCollection` with a single set of fields, e.g. `address`,
  - a YAML array for a `fixedCollection` with a multiple sets of fields, e.g. `phone_numbers`,

```yaml
updateFields:
  requestBody:
    is_active: boolean=true|Whether the company's record is active.
    address:
      street: string
      city: string
      state: string
      postal_code: string
      country: string
    details: string|Arbitrary string to describe the company.
    employees: number|Number of the employees at the company.
    phone_numbers:
      - number: string
        category: string
    classification: enum=1|Legal classification of the company.
      - LLC
      - Corporation
```

**Notes**

- Optionally, set a pipe `|` after the n8n type to specify a description. As an exception, for the time being an `enum`-type param requires a description.
- Optionally, set an equals sign `=` after the n8n type (but before the pipe) to specify a default. For an `enum`-type param, the default must be a zero-based index. If the default is unspecified, a `string` or `dateTime` param defaults to `''`, a `number` param defaults to `0`, a `boolean` param defaults to `false`, and an `options` param defaults to the zeroth item.
