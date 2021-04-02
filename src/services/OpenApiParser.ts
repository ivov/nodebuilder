import { execSync } from "child_process";
import { JSONPath as jsonQuery } from "jsonpath-plus";
import { join } from "path";
import { readFileSync } from "fs";
import { titleCase } from "title-case";
import { inputDir, openApiInputDir, swagger } from "../config";

export default class OpenApiParser {
  private readonly json: any; // TODO
  private readonly serviceName: string;
  private currentEndpoint: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName.replace(".json", "");
    this.json = this.parseSpec(serviceName);
  }

  public run(): NodegenParams {
    return {
      metaParams: {
        apiUrl: this.getApiUrl(),
        authType: this.getAuthType(),
        serviceName: titleCase(this.serviceName),
        nodeColor: this.getNodeColor(),
      },
      mainParams: this.getMainParams(),
    };
  }

  /**Replace `$ref` with its referenced value and parse the resulting JSON.*/
  private parseSpec(serviceName: string) {
    const source = join(openApiInputDir, serviceName);
    const dest = join(inputDir, "_deref.json");

    execSync(
      `node ${swagger} bundle --dereference ${source} --outfile ${dest}`
    );

    return JSON.parse(readFileSync(dest).toString());
  }

  private getApiUrl() {
    return jsonQuery({ json: this.json, path: "$.servers.*.url" })[0];
  }

  // TODO: temp implementation
  private getNodeColor() {
    return "#ff6600";
  }

  // TODO: temp implementation
  private getAuthType(): AuthType {
    return "OAuth2";
  }

  private getMainParams() {
    let mainParams: MainParams = {};

    for (const endpoint in this.json.paths) {
      this.currentEndpoint = endpoint;

      const resources = this.getResources();
      const methods = this.extract("requestMethods");

      resources.forEach((resource) => {
        methods.forEach((method) => {
          const operation = this.createOperation(method);
          mainParams[resource] = mainParams[resource] || [];
          mainParams[resource].push(operation);
        });
      });
    }

    return mainParams;
  }

  private getResources() {
    const resources = this.extract("tags").filter((r) => r !== "OAuth");
    return [...new Set(resources)];
  }

  private processDescription() {
    return this.extract("description")
      .replace(/\n/g, " ")
      .replace(/\s\s/g, " ")
      .replace(/'/g, "\\'")
      .trim();
  }

  private createOperation(requestMethod: string) {
    const operation: Operation = {
      endpoint: this.currentEndpoint,
      requestMethod: requestMethod.toUpperCase(),
      operationId: this.processOperationId(requestMethod),
      description: this.processDescription(),
    };

    const [params, addFields] = this.processParams();
    const requestBody = this.extract("requestBody");

    if (params.length) operation.parameters = params;
    if (addFields.options.length) operation.additionalFields = addFields;
    if (requestBody)
      operation.requestBody = [{ name: "Standard", ...requestBody }];

    return operation;
  }

  private processOperationId(requestMethod: string) {
    return this.extract("operationId") ?? this.getFallbackId(requestMethod);
  }

  /**Process the path and query string params for the current endpoint.*/
  private processParams() {
    const allParams = this.extract("parameters");
    return this.classifyParams(allParams);
  }

  /**Return a fallback operation ID if missing in the spec.*/
  private getFallbackId(requestMethod: string) {
    const hasBracket = this.currentEndpoint.split("").includes("}");

    if (requestMethod === "get" && hasBracket) return "get";
    if (requestMethod === "get" && !hasBracket) return "getAll";
    if (requestMethod === "put") return "update";
    if (requestMethod === "delete") return "delete";
    if (requestMethod === "post") return "create";

    return "unnamed";
  }

  /**Extract the keys and values from the OpenAPI JSON based on the current endpoint.
   * Based on [JSON Path Plus](https://github.com/JSONPath-Plus/JSONPath).
   *
   * Note: The square brackets escape chars in the endpoint.*/
  private extract(key: "description" | "operationId"): string;
  private extract(key: "tags" | "requestMethods"): string[];
  private extract(key: "parameters"): OperationParameter[];
  private extract(key: "requestBody"): OperationRequestBody | null;
  private extract(key: OpenApiKey) {
    const result = jsonQuery({
      json: this.json,
      path: `$.paths.[${this.currentEndpoint}].${this.setEndOfPath(key)}`,
    });

    if (key === "requestBody" && !result.length) return null;

    // always a one-element array, so remove nesting
    const hasExtraNesting =
      (key === "parameters" && result.length) ||
      key === "description" ||
      key === "operationId" ||
      (key === "requestBody" && result.length);

    if (hasExtraNesting) return result[0];

    return result;
  }

  /**Adjust the end of the JSON Path query based on the key.
   * ```json
   * $.[/endpoint].   *.tags.*      resources
   * $.[/endpoint].   *~            request methods
   * $.[/endpoint].   *.otherKey
   * ```
   * Note: `parameters` is kept in a nested array (instead of together with `tags`)
   * for the edge case where the endpoint has 2+ request methods. Otherwise, the
   * parameters for both methods become mixed together, causing duplication.*/
  private setEndOfPath(key: OpenApiKey) {
    if (key === "tags") return `*.${key}.*`;
    if (key === "requestMethods") return `*~`;
    return `*.${key}`;
  }

  /**Classify operation parameters as required and non-required.*/
  private classifyParams(
    parameters: OperationParameter[]
  ): [OperationParameter[], AdditionalFields] {
    const requiredParams: OperationParameter[] = [];

    const additionalFields: AdditionalFields = {
      name: "Additional Fields",
      type: "collection",
      description: "",
      default: {},
      options: [],
    };

    parameters.forEach((field) => {
      field.required
        ? requiredParams.push(field)
        : additionalFields.options.push({
            in: field.in,
            name: field.name,
            schema: {
              type: field.schema.type,
              default: this.getDefaultFromSchema(field.schema),
            },
            description: field.description,
          });
    });

    return [requiredParams, additionalFields];
  }

  private getDefaultFromSchema(schema: OperationParameter["schema"]) {
    if (schema.default) return schema.default;
    if (schema.type === "boolean") return false;
    if (schema.type === "number") return 0;
    return "";
  }
}
