import { JSONPath as jsonQuery } from "jsonpath-plus";

/**Extracts params from an OpenAPI JSON for use in node generation.*/
export default class OpenApiExtractor {
  private currentEndpoint: string;

  constructor(private readonly json: any) {}

  public run(): NodegenParams {
    return {
      metaParams: {
        apiUrl: this.getApiUrl(),
        authType: this.getAuthType(),
        serviceName: this.getServiceName(),
        nodeColor: this.getNodeColor(),
      },
      mainParams: this.getMainParams(),
    };
  }

  private getApiUrl() {
    return jsonQuery({ json: this.json, path: "$.servers.*.url" })[0];
  }

  // TODO: temp implementation
  private getServiceName() {
    return "Lichess";
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

      const resources = this.extract("tags").filter((r) => r !== "OAuth");
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

  private createOperation(requestMethod: string) {
    const operation: Operation = {
      endpoint: this.currentEndpoint,
      requestMethod,
      operationId: this.extract("operationId"),
      description: this.extract("description"),
    };

    const [params, addFields] = this.sortParams(this.extract("parameters"));
    const requestBody = this.extract("requestBody");

    if (params.length) operation.parameters = params;
    if (addFields.options.length) operation.additionalFields = addFields;
    if (requestBody.length) operation.requestBody = requestBody;

    return operation;
  }

  /**Extract the keys and values from the OpenAPI JSON
   * using [JSON Path Plus](https://github.com/JSONPath-Plus/JSONPath).
   *
   * Note: The square brackets escape chars in the endpoint.*/
  private extract(key: "description" | "operationId"): string;
  private extract(key: "tags" | "requestMethods"): string[];
  private extract(key: "parameters"): OperationParameter[];
  private extract(key: "requestBody"): OperationRequestBody[];
  private extract(key: OpenApiKey) {
    const result = jsonQuery({
      json: this.json,
      path: `$.paths.[${this.currentEndpoint}].${this.setEndOfPath(key)}`,
    });

    const isSingleElementArray = ["description", "operationId"].includes(key);

    return isSingleElementArray ? result[0] : result;
  }

  /**Adjust the end of the JSON Path query based on the key.
   * ```json
   * $.[/endpoint].   *.tags.*
   * $.[/endpoint].   *.parameters.*
   * $.[/endpoint].   *~
   * $.[/endpoint].   *.otherKey
   * ```*/
  private setEndOfPath(key: OpenApiKey) {
    if (["tags", "parameters"].includes(key)) return `*.${key}.*`;
    if (key === "requestMethods") return `*~`;
    return `*.${key}`;
  }

  /**Sort operation parameters into required and non-required.*/
  private sortParams(
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
      // @ts-ignore // TODO: Properly handle OpenAPI $ref
      if (field.$ref) return;

      field.required
        ? requiredParams.push(field)
        : additionalFields.options.push({
            name: field.name,
            type: field.schema.type,
            default: this.getDefault(field.schema),
            description: field.description,
          });
    });

    return [requiredParams, additionalFields];
  }

  private getDefault(schema: OperationParameter["schema"]) {
    if (schema.default) return schema.default;
    if (schema.type === "boolean") return false;
    return "";
  }
}
