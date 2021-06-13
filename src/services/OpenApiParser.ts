import { execSync } from "child_process";
import path from "path";
import fs from "fs";

import { JSONPath as jsonQuery } from "jsonpath-plus";
import { titleCase } from "title-case";
import { camelCase } from "change-case";

import { inputDir, openApiInputDir, swagger } from "../config";

export default class OpenApiParser {
  private readonly json: JsonObject & { paths: object };
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
    const source = path.join(openApiInputDir, serviceName);
    const target = path.join(inputDir, "_deref.json");

    execSync(
      `node ${swagger} bundle --dereference ${source} --outfile ${target}`
    );

    return JSON.parse(fs.readFileSync(target).toString());
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
    const description = this.extract("description");

    if (description)
      return description
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .replace(/'/g, "\\'")
        .trim();
  }

  private processRequestBody() {
    const requestBody = this.extract("requestBody");

    if (!requestBody) return null;

    const urlEncoded = requestBody.content["application/x-www-form-urlencoded"];
    const textPlain = requestBody.content["text/plain"];

    if (urlEncoded) {
      this.sanitizeProperties(urlEncoded);
    }

    if (textPlain) {
      this.setTextPlainProperty(requestBody);
    }

    return [{ name: "Standard", ...requestBody } as const];
  }

  private setTextPlainProperty(requestBody: OperationRequestBody) {
    requestBody.textPlainProperty = requestBody.description
      ?.split(" ")[0]
      .toLowerCase();
  }

  private sanitizeProperties(urlEncoded: { schema: Schema }) {
    const properties = Object.keys(urlEncoded.schema.properties);
    properties.forEach((property) => {
      const sanitizedProperty = camelCase(property.replace(".", " "));

      urlEncoded.schema.properties[sanitizedProperty] =
        urlEncoded.schema.properties[property];
      delete urlEncoded.schema.properties[property];
    });
  }

  private createOperation(requestMethod: string) {
    const operation: Operation = {
      endpoint: this.currentEndpoint,
      requestMethod: requestMethod.toUpperCase(),
      operationId: this.processOperationId(requestMethod),
    };

    const parameters = this.processParameters();
    const requestBody = this.processRequestBody();
    const description = this.processDescription();

    if (parameters.length) operation.parameters = parameters;
    if (requestBody?.length) operation.requestBody = requestBody;
    if (description) operation.description = description;

    return operation;
  }

  private processOperationId(requestMethod: string) {
    return this.extract("operationId") ?? this.getFallbackId(requestMethod);
  }

  private processParameters() {
    return this.extract("parameters").map((field) =>
      field.required ? field : { ...field, required: false }
    );
  }

  private getFallbackId(requestMethod: string) {
    const hasBracket = this.currentEndpoint.split("").includes("}");

    if (requestMethod === "get" && hasBracket) return "get";
    if (requestMethod === "get" && !hasBracket) return "getAll";
    if (requestMethod === "put") return "update";
    if (requestMethod === "delete") return "delete";
    if (requestMethod === "post") return "create";

    return "UNNAMED";
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
}
