// ----------------------------------
//              JSON
// ----------------------------------

type JsonObject = { [key: string]: JsonValue };

type JsonValue =
  | string
  | number
  | boolean
  | null
  | Array<JsonValue>
  | JsonObject;

// ----------------------------------
//           package.json
// ----------------------------------

type PackageJson = {
  n8n: {
    nodes: string[];
  };
};
