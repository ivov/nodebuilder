import { sortBy } from "underscore";
import nodegenParams from "../input/_nodegenParams.json";
import FilePrinter from "../utils/FilePrinter";

// @ts-ignore
const { mainParams } = nodegenParams as NodegenParams;

const addIrregularMarkers = true;

const apiMap: ApiMap = {};

const derivenodeOperation = (requestMethod: string, endpoint: string) => {
  const hasBracket = (endpoint: string) => endpoint.split("").includes("}");

  if (requestMethod === "GET" && hasBracket(endpoint)) return "Get";
  if (requestMethod === "GET" && !hasBracket(endpoint)) return "Get All";
  if (requestMethod === "PUT") return "Update";
  if (requestMethod === "DELETE") return "Delete";
  if (requestMethod === "POST") return "Create";

  return "Unknown";
};

Object.entries(mainParams).forEach(([resource, operations]) => {
  apiMap[resource] = operations.map(({ requestMethod, endpoint }) => {
    const result: { [key: string]: any } = {};

    if (addIrregularMarkers && /}\//.test(endpoint))
      result["IRREGULAR START"] = "-".repeat(40);

    result.nodeOperation = derivenodeOperation(requestMethod, endpoint);
    result.requestMethod = requestMethod;
    result.endpoint = endpoint;

    if (addIrregularMarkers && /}\//.test(endpoint))
      result["IRREGULAR END"] = "-".repeat(40);

    return result as ApiMapOperation;
  });
});

Object.entries(apiMap).forEach(([resource, operations]) => {
  apiMap[resource] = sortBy(
    operations,
    (operation: ApiMapOperation) => operation.nodeOperation
  );
});

const printer = new FilePrinter(apiMap);
printer.print({ format: "json" });
console.log("Successfully printed API map");

// console.log(apiMap);
