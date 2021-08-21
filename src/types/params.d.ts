// ----------------------------------
//       custom spec params
// ----------------------------------

type CustomSpecParams = {
  metaParams: MetaParams;
  mainParams: {
    [resource: string]: CustomSpecOperation[];
  };
};

type CustomSpecOperation = {
  endpoint: string;
  operationId: string;
  requestMethod: string;
  operationUrl?: string;
  requiredFields?: CustomSpecFields;
  additionalFields?: CustomSpecFields;
  filters?: CustomSpecFields;
  updateFields?: CustomSpecFields;
};

type CustomSpecFields = {
  queryString?: CustomSpecFieldContent;
  requestBody?: CustomSpecFieldContent;
};

type CustomSpecFieldContent = { [name: string]: ParamContent };

// ----------------------------------
//         nodegen params
// ----------------------------------

/**
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
  [key: string]: string | OperationParameter[];
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
  default: boolean | string | number;
  example?: string | number;
  minimum?: number;
  maximum?: number;
  options?: string[]; // from custom spec in YAML
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
  options?: string[];
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
