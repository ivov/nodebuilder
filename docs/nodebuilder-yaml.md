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

The API description should have two main sections, `metaParams` and `mainParams`:

- `metaParams`, for properties of the API itself:

```yaml
metaParams:
  apiUrl: https://api.myservice.com/      # base API URL
  authType: OAuth2                        # one of "OAuth2", "ApiKey", or "None"
  serviceName: MyService                  # properly cased service name
  nodeColor: \#ff2564                     # brand hex color, escaped by /
```

- `mainParams`, for resources containing one or more operations:

```yaml
mainParams:
  company:
    - endpoint: /companies
      operationId: create
      operationUrl: https://myservice.com/api/create-a-company
      requestMethod: POST
```

If the `endpoint` contains a bracketed string, this will be parsed as a path parameter.

```yaml
- endpoint: /companies/{companyId}
  operationId: get
  requestMethod: GET
```

Each operation has four **main properties**:

- `endpoint`, `operationId`, and `requestMethod` (all required)
- `operationUrl` (optional, for documentation URL)

Each operation also has four **param properties**:

- `requiredFields`
- `additionalFields` (for `create` operations)
- `filters` (for `getAll` operations)
- `updateFields` (for `update` operations)

Every param property is optional and creates a `collection`. Note that `requiredFields` are required from the API's perspective, but are optional in that they may be omitted from the YAML file if no params (or only path params) are required for the call to succeed.

Each param property must contain a single key, either `queryString` or `requestBody`:

```yaml
- endpoint: /companies
  operationId: create
  requestMethod: POST
  requiredFields:
    requestBody:
      # ...
  additionalFields:
    requestBody:
      # ...
```

Inside `queryString` or `requestBody`, each key must specify a node property and each value must specify its type:

```yaml
updateFields:
  requestBody:
    is_active: boolean|Whether the company's record is active.
    address:
      street: string
      city: string
      state: string
      postal_code: string
      country: string
    details: string|Arbitrary string to describe the company.
    phone_numbers:
      - number: string
        category: string
    classification: enum|Legal classification of the company.
      - LLC
      - Corporation
```

Notes:
- Optionally, set a vertical bar and add a description for the node property.
- A key pointing to an object, as in `address`, creates a `fixedCollection` with a single fixed set of fields to be filled in.
- A key pointing to an array of objects, as in `phone_numbers`, creates a `fixedCollection` with multiple fixed sets of fields to be filled in.
- A key pointing to an enum, as in `classification`, creates an `options` dropdown with one to be selected out of multiple options.