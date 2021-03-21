// ----------------------------------
//         Node generation
// ----------------------------------

type GenerationSource = "OpenAPI" | "YAML";

type AuthType = "OAuth2" | "ApiKey" | "None";

type NodegenParams = {
  metaParams: MetaParams;
  mainParams: MainParams;
};

type MetaParams = {
  serviceName: string;
  authType: keyof typeof AuthType;
  nodeColor: string;
  apiUrl: string;
};

interface MainParams {
  [key: string]: Operation[];
}

type Resource = Operation[];

type ResourceTuples = [string, Resource][];

interface Operation {
  [key: string]:
    | string
    | OperationParameter[]
    | OperationRequestBody
    | AdditionalFields;
  operationId: string;
  operationUrl?: string;
  requestMethod: string;
  endpoint: string;
  description?: string;
  parameters?: OperationParameter[];
  requestBody?: OperationRequestBody[];
  additionalFields?: AdditionalFields;
}

interface OperationParameter {
  in: "path" | "query";
  name: string;
  description?: string;
  schema: {
    type: string;
    default: boolean | string | number;
    example?: string | number;
    minimum?: number;
    maximum?: number;
  };
  required?: boolean;
  example?: string;
  $ref?: string;
}

interface OperationRequestBody {
  name: "Standard" | "Additional Fields" | "Filter Fields" | "Update Fields"; // custom (not in OpenApi)
  content?: OperationRequestBodyContent | any; // TODO
  description?: string;
  required?: boolean;
}

interface OperationRequestBodyContent {
  [key: string]: { schema: Schema };
  "application/x-www-form-urlencoded": { schema: Schema };
  "text/plain": { schema: Schema };
}

interface Schema {
  type: string;
  required?: string[];
  properties: {
    [key: string]: {
      type: string;
      description: string;
    };
  };
}

interface AdditionalFields {
  name: "Additional Fields" | "Filter Fields" | "Update Fields";
  type: "collection";
  description: "";
  default: {};
  options: {
    in: "path" | "query";
    name: string;
    schema: {
      type: string;
      default: string | boolean | number;
    };
    description?: string;
  }[];
}

// ----------------------------------
//          OpenAPI keys
// ----------------------------------

type OpenApiKey = StringArrayKey | StringKey | CustomObjectKey;

type StringArrayKey = "tags" | "requestMethods";

type StringKey = "description" | "operationId";

type CustomObjectKey = "parameters" | "requestBody";

// ----------------------------------
//              JSON
// ----------------------------------

type JsonObject = { [key in string]: JsonValue };

type JsonValue =
  | string
  | number
  | boolean
  | null
  | Array<JsonValue>
  | JsonObject;

// ----------------------------------
//        Module augmentation
// ----------------------------------

declare module "object-treeify" {
  export default function treeify(jsObject: Object): string;
}

// ----------------------------------
//             Builder
// ----------------------------------

type CallLineOptionalArgs = {
  hasQueryString?: boolean;
  hasRequestBody?: boolean;
};

// ----------------------------------
//            Printer
// ----------------------------------

type ApiMap = {
  [key: string]: ApiMapOperation[];
};

type ApiMapOperation = {
  ATTENTION?: string;
  nodeOperation: string;
  requestMethod;
  endpoint: string;
  IRREGULAR?: string;
};

type TreeView = string;

// ----------------------------------
//             YAML
// ----------------------------------

type YamlNodegenParams = {
  metaParams: MetaParams;
  mainParams: YamlMainParams;
};

interface YamlMainParams {
  [key: string]: YamlOperation[];
}

interface YamlOperation {
  // [key: string]: {
  //   [key: string]:
  //     | string
  //     | { type: string; description?: string }
  //     | { queryString: { type: string; description?: string } }
  //     | { requestBody: { type: string; description?: string } };
  //   // | { filters: { [key: string]: string }}
  //   // | { updateFields: { [key: string]: string }};
  // };
  operationId: string;
  operationUrl: string;
  requestMethod: string;
  endpoint: string;
  queryString?: NameTypeAndDescription;
  requestBody?: NameTypeAndDescription;

  additionalFields?: ExtraFields;
  filterFields?: ExtraFields;
  updateFields?: ExtraFields;
}

type ExtraFields = {
  [key: string]: NameTypeAndDescription;
  queryString?: NameTypeAndDescription;
  requestBody?: NameTypeAndDescription;
};

type NameTypeAndDescription = {
  [key: string]: { type: string; description?: string };
};
