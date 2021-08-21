// ----------------------------------
//              JSON
// ----------------------------------

type JsonValue =
  | string
  | number
  | boolean
  | null
  | Array<JsonValue>
  | JsonObject;

type JsonObject = { [key: string]: JsonValue };

// ----------------------------------
//         n8n package.json
// ----------------------------------

type PackageJson = {
  n8n: {
    nodes: string[];
  };
};
