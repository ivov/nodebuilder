import { camelCase } from "change-case";

export const builder = {
  mainParams: <MainParams>{},
  dividerLength: 0,
  resourceTuples: <[string, Resource][]>[],
  resourceNames: <string[]>[],
  serviceApiRequest: "",

  constructor: function (mainParams: MainParams, { serviceName }: MetaParams) {
    this.mainParams = mainParams;
    this.resourceTuples = Object.entries(this.mainParams);
    this.resourceNames = this.resourceTuples.map((tuple) => tuple[0]);
    this.dividerLength = this.getDividerLength();
    this.serviceApiRequest = camelCase(serviceName) + "ApiRequest";
  },

  getDividerLength: function () {
    let maxLength = 0;

    this.resourceTuples.forEach(([resourceName, operationsArray]) => {
      operationsArray.forEach((operation) => {
        const title = `${resourceName}: ${operation.operationId}`;
        maxLength = title.length > maxLength ? title.length : maxLength;
      });
    });

    return maxLength + 20;
  },

  isFirst: <T>(item: T, array: T[]) => array.indexOf(item) === 0,

  isLast: <T>(item: T, array: T[]) => array.indexOf(item) + 1 === array.length,

  adjustType: (type: string) => (type === "integer" ? "number" : type),

  getParams: (params: OperationParameter[], type: "query" | "path") =>
    params.filter((p) => p.in === type).map((p) => p.name),

  getPathParams: function (params: OperationParameter[]) {
    return this.getParams(params, "path");
  },

  getQueryParams: function (params: OperationParameter[]) {
    return this.getParams(params, "query");
  },

  /**Convert an endpoint with path params into an endpoint with template literal slots.
   * ```
   * "/player/top/{nb}/{perfType}" → `/player/top/${nb}/${perfType}`
   * ```*/
  toLiteral: (endpoint: string) => endpoint.replace(/{/g, "${"),

  /**  Build a divider for a resource:
   * ```
   * // **************************************************************
   * //                            user
   * // **************************************************************
   * ```*/
  resourceDivider: function (resourceName: string) {
    const longDividerLength = this.dividerLength + 20;

    const padLength = Math.floor((longDividerLength - resourceName.length) / 2);

    const titleLine = "// " + " ".repeat(padLength) + resourceName;
    const dividerLine = "// " + "*".repeat(longDividerLength);

    return [dividerLine, titleLine, dividerLine].join("\n" + "\t".repeat(4));
  },

  /** Build a resource branch, either the first:
   * ```
   * if (resource === 'user') {
   * ```
   * Or subsequent branches:
   * ```
   * } else if (resource === 'user') {
   * ```*/
  resourceBranch: function (resourceName: string) {
    const branch = `if (resource === '${camelCase(resourceName)}') {`;
    const prefix = "} else ";
    const isFirst = this.isFirst(resourceName, this.resourceNames);

    return isFirst ? branch : prefix + branch;
  },

  /** Build the error branch for resources:
   * ```
   * } else {
   *     throw new Error(`Unknown resource: ${resource}`);
   * }
   * ```*/
  resourceError: function (resourceName: string) {
    const isLast = this.isLast(resourceName, this.resourceNames);
    const resourceError = `
    \t} else {
    \t\tthrow new Error(\`Unknown resource: \${resource}\`);
    \t}`;

    return isLast ? resourceError : null;
  },

  /** Build an operation branch, either the first:
   * ```
   * if (operation === 'player') {
   * ```
   * Or subsequent branches:
   * ```
   * } else if (operation === 'player') {
   * ```*/
  operationBranch: function (operation: Operation, resourceName: string) {
    const branch = `if (operation === '${camelCase(operation.operationId)}') {`;
    const prefix = "} else ";
    const isFirst = this.isFirst(operation, this.mainParams[resourceName]);

    return isFirst ? branch : prefix + branch;
  },

  /**  Build a divider for an operation:
   * ```
   * // ----------------------------------------
   * //             user: getUser
   * // ----------------------------------------
   * ```*/
  operationDivider: function (resourceName: string, operationId: string) {
    const title = `${resourceName}: ${operationId}`;
    const padLength = Math.floor((this.dividerLength - title.length) / 2);

    const titleLine = "// " + " ".repeat(padLength) + title;
    const dividerLine = "// " + "-".repeat(this.dividerLength);

    return [dividerLine, titleLine, dividerLine].join("\n" + "\t".repeat(5));
  },

  /** Build the error branch for operations:
   * ```
   * } else {
   *     throw new Error(`Unknown operation: ${operation}`);
   * }
   * ```*/
  operationError: function (operation: Operation, resourceName: string) {
    const isLast = this.isLast(operation, this.mainParams[resourceName]);
    const operationError = `
    \t\t} else {
    \t\t\tthrow new Error(\`Unknown operation: \${operation}\`);
    \t\t}`;

    return isLast ? operationError : null;
  },

  isPathParam: (param: OperationParameter) => param.in === "path",

  isQsParam: (param: OperationParameter) => param.in === "query",

  apiCall: function ({
    parameters,
    endpoint,
    requestBody,
    additionalFields,
    requestMethod,
  }: Operation) {
    const lines: string[] = [];

    let hasPathParam =
      parameters?.some((param) => this.isPathParam(param)) ?? false;

    if (parameters) {
      lines.push(this.qsDeclaration());
      parameters.forEach((param) => {
        if (this.isPathParam(param)) {
          lines.push(this.pathParam(param));
        }
        if (this.isQsParam(param)) {
          lines.push(this.queryString(param));
          if (additionalFields) {
            lines.push(...this.additionalFields(additionalFields, "qs"));
          }
        }
      });
    }

    if (requestBody) {
      lines.push(...this.bodyCall(requestBody));
      if (additionalFields) {
        lines.push(...this.additionalFields(additionalFields, "body"));
      }
    }

    lines.push(this.endpoint(hasPathParam, endpoint));

    lines.push(
      this.callLine(requestMethod, {
        hasQueryString: parameters !== undefined,
        hasRequestBody: requestBody !== undefined,
      })
    );

    return lines.join("\n");
  },

  endpoint: function (hasPathParam: boolean, endpoint: string) {
    return hasPathParam
      ? this.pathParamEndpoint(endpoint)
      : this.ordinaryEndpoint(endpoint);
  },

  additionalFields: function (
    additionalFields: AdditionalFields,
    target = "qs"
  ) {
    const afDeclarationLine = `const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;`;
    const afLoadLines = additionalFields.options.map((option) => {
      const loading = `${target}.${option.name} = additionalFields.${option.name}`;
      const casting = `as ${this.adjustType(option.type)};`;
      return loading + casting;
    });

    return [afDeclarationLine, ...afLoadLines];
  },

  pathParamEndpoint: function (endpoint: string) {
    return `const endpoint = \`${this.toLiteral(endpoint)}\`;`;
  },

  ordinaryEndpoint: (endpoint: string) => `const endpoint = '${endpoint}';`,

  pathParam: function ({ name }: OperationParameter) {
    return `const ${name} = this.getNodeParameter('${name}', i);`;
  },

  qsDeclaration: () => `const qs: IDataObject = {};`,

  queryString: function ({ name }: OperationParameter) {
    return `qs.${name} = this.getNodeParameter('${name}', i);`;
  },

  bodyCall: function (requestBody: OperationRequestBody) {
    const bodyDeclarationLine = `const body: IDataObject = {};`;

    const bodyComponentLines = this.getBodyComponents(requestBody!).map(
      (rbc) => `body.${rbc} = this.getNodeParameter('${rbc}', i);`
    );

    return [bodyDeclarationLine, ...bodyComponentLines];
  },

  // TODO: temp implementation
  getBodyComponents: (components: OperationRequestBody) => {
    const urlEncoded = "application/x-www-form-urlencoded";

    const urlEncodedProps = [components]
      .filter((c) => c.content[urlEncoded])
      .map((c) => c.content[urlEncoded].schema.properties)
      .map((c) => Object.keys(c))
      .flat();

    if (urlEncodedProps.length) return urlEncodedProps;

    const textPlain = "text/plain";
    const textPlainProps = [components]
      .filter((c) => c.content[textPlain])
      .map((_) => "text");

    return textPlainProps;
  },

  callLine: function (
    requestMethod: string,
    { hasQueryString, hasRequestBody }: CallLineOptionalArgs = {}
  ) {
    const qs = hasQueryString ? "qs" : "{}";
    const body = hasRequestBody ? "body" : "{}";

    const call = `responseData = await ${this.serviceApiRequest}.call`;
    const args = `(this, '${requestMethod}', endpoint, ${qs}, ${body});`;

    return call + args;
  },
};
