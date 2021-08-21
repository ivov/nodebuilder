// ----------------------------------
//         YAML lifecycle
// ----------------------------------

/**
 * Used only to validate the shape of the input YAML file in `YamlParser.jsonifyYaml`.
 */
type YamlInput = {
  metaParams: MetaParams;
  mainParams: {
    [resource: string]: Array<{
      endpoint: string;
      operationId: string;
      requestMethod: string;
      operationUrl?: string;
      requiredFields?: YamlField;
      additionalFields?: YamlField;
      filters?: YamlField;
      updateFields?: YamlField;
    }>;
  };
};

type YamlField = {
  [key in "queryString" | "requestBody"]?: {
    [paramName: string]: string | object;
  };
};

/**
 * Params retrieved from a custom mapping in YAML and validated.
 * Output of `YamlParser`.
 */
type YamlParsedParams = {
  metaParams: MetaParams;
  mainParams: {
    [key: string]: YamlOperation[];
  };
};

type YamlOperation = {
  operationId: string;
  requestMethod: string;
  endpoint: string;
  operationUrl?: string;
  requiredFields?: YamlFields;
  additionalFields?: YamlFields;
  filters?: YamlFields;
  updateFields?: YamlFields;
};

type YamlFields = {
  queryString?: YamlFieldsContent;
  requestBody?: YamlFieldsContent;
};

type YamlFieldsContent = {
  [name: string]: ParamContent;
};

// ----------------------------------
//          nodegen params
// ----------------------------------

/**
 * Params originating in an OpenApi spec or in a custom API mapping in YAML.
 * Output of `OpenApiStager` and of `YamlStager`.
 */
type NodegenParams = {
  metaParams: MetaParams;
  mainParams: MainParams;
};

type MetaParams = {
  serviceName: string;
  authType: AuthType;
  nodeColor: string;
  apiUrl: string;
};

type AuthType = "None" | "ApiKey" | "OAuth2";

type MainParams = {
  [resource: string]: Operation[];
};

type Operation = {
  endpoint: string;
  operationId: string;
  requestMethod: string;
  operationUrl?: string;
  description?: string;
  parameters?: OperationParameter[];
  requestBody?: OperationRequestBody[];
} & TemplatingFields;

type TemplatingFields = {
  additionalFields?: AdditionalFields;
  filters?: AdditionalFields;
  updateFields?: AdditionalFields;
};

type OperationParameter = {
  in: "path" | "query" | "header";
  name: string;
  description?: string;
  schema: PathQuerySchema;
  required?: boolean;
  example?: string;
  $ref?: string; // from OpenAPI
};

type PathQuerySchema = {
  type: string;
  default: boolean | string | number; // TODO: Type properly
  example?: string | number;
  minimum?: number;
  maximum?: number;
  enumItems?: string[]; // from YAML mapping
};

type OperationRequestBody = {
  content: {
    "application/x-www-form-urlencoded"?: { schema: RequestBodySchema };
    "text/plain"?: { schema: RequestBodySchema };
  };
  name?: "Standard" | "Additional Fields" | "Filters" | "Update Fields";
  description?: string;
  required?: boolean;
  textPlainProperty?: string;
};

type RequestBodySchema = {
  type: string;
  required?: string[];
  properties: {
    [propertyName: string]: ParamContent;
  };
};

// TODO: Rename
type ParamContent = {
  type:
    | "string"
    | "number"
    | "boolean"
    | "options"
    | "collection"
    | "fixedCollection";
  default?: any; // TODO: Type properly
  description?: string;
  enumItems?: string[];
};

type AdditionalFields = {
  name: "Additional Fields" | "Filters" | "Update Fields";
  type: "collection";
  description: "";
  default: {};
  options: {
    in: "path" | "query" | "header";
    name: string;
    schema: {
      type: string;
      default: string | boolean | number;
    };
    description?: string;
  }[];
};

type ExtraFieldName = "Additional Fields" | "Filters" | "Update Fields";

/**
 * Utility type for template builder.
 */
type ResourceTuples = [string, Operation[]][];

// ----------------------------------
//          OpenAPI keys
// ----------------------------------

type OpenApiKey = StringArrayKey | StringKey | CustomObjectKey;

type StringArrayKey = "tags" | "requestMethods";

type StringKey = "description" | "operationId";

type CustomObjectKey = "parameters" | "requestBody";
