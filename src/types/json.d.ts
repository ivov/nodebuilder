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
