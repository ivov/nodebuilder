// ----------------------------------
//          Nodegen params
// ----------------------------------

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

type ResourceTuples = [string, Operation[]][];

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
  schema: {
    type: string;
    default: boolean | string | number; // TODO: Type properly
    example?: string | number;
    minimum?: number;
    maximum?: number;
    enumItems?: string[]; // from YAML mapping
  };
  required?: boolean;
  example?: string;
  $ref?: string;
};

type OperationRequestBody = {
  content: {
    "application/x-www-form-urlencoded"?: { schema: Schema };
    "text/plain"?: { schema: Schema };
  };
  name?: "Standard" | "Additional Fields" | "Filters" | "Update Fields";
  description?: string;
  required?: boolean;
  textPlainProperty?: string;
};

type Schema = {
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
