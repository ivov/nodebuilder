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
