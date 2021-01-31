import { camelCase } from "change-case";

/**Builder functions for Hygen templates.*/
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

    return maxLength;
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

    return [dividerLine, titleLine, dividerLine].join("\n" + "\t".repeat(3));
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
   * // --------------------------------------------------------------
   * //                         user: getUser
   * // --------------------------------------------------------------
   * ```*/
  operationDivider: function (resourceName: string, operationId: string) {
    const title = `${resourceName}: ${operationId}`;
    const padLength = Math.floor((this.dividerLength - title.length) / 2);

    const titleLine = "// " + " ".repeat(padLength) + title;
    const dividerLine = "// " + "-".repeat(this.dividerLength);

    return [dividerLine, titleLine, dividerLine].join("\n" + "\t".repeat(4));
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

  pathParamCall: function ({
    parameters,
    endpoint,
    requestMethod,
    additionalFields,
  }: Operation) {
    const indentation = "\t".repeat(5);

    const pathParamLines = this.getPathParams(parameters!)
      .map((pp) => `const ${pp} = this.getNodeParameter('${pp}', i);`)
      .join("\n" + indentation);

    return [
      pathParamLines,
      this.getAdditionalFields(additionalFields!),
      indentation + `const endpoint = \`${this.toLiteral(endpoint)}\`;`,
      indentation +
        this.getCallLine(requestMethod, {
          withQueryString: true,
        }),
    ].join("\n");
  },

  queryParamCall: function ({
    parameters,
    endpoint,
    requestMethod,
    additionalFields,
  }: Operation) {
    const indentation = "\t".repeat(5);

    const queryParamLines = this.getQueryParams(parameters!)
      .map((qp) => `qs.${qp} = this.getNodeParameter('${qp}', i);`)
      .join("\n" + indentation);

    return [
      queryParamLines,
      this.getAdditionalFields(additionalFields!),
      indentation + `const endpoint = '${endpoint}';`,
      indentation +
        this.getCallLine(requestMethod, {
          withQueryString: true,
        }),
    ].join("\n");
  },

  slimCall: function ({
    endpoint,
    requestMethod,
    additionalFields,
  }: Operation) {
    const indentation = "\t".repeat(5);

    return [
      this.getAdditionalFields(additionalFields!),
      indentation + `const endpoint = '${endpoint}';`,
      indentation +
        this.getCallLine(requestMethod, {
          withQueryString: true,
        }),
    ].join("\n");
  },

  /** Build the call line at the end of an operation branch:
   * ```
   * responseData = await lichessApiRequest.call(this, 'get', endpoint, qs, {});
   * ```*/
  getCallLine: function (
    requestMethod: string,
    {
      withQueryString = false,
      withRequestBody = false,
    }: { withQueryString?: boolean; withRequestBody?: boolean }
  ) {
    const qs = () => (withQueryString ? "qs" : "{}");
    const body = () => (withRequestBody ? "body" : "{}");

    const call = `responseData = await ${this.serviceApiRequest}.call`;
    const args = `(this, '${requestMethod}', endpoint, ${qs()}, ${body()});`;

    return call + args;
  },

  getAdditionalFields: function (additionalFields: AdditionalFields) {
    if (!additionalFields) return;

    const indentation = "\t".repeat(5);

    const addFieldsIntroLine = `const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;`;
    const addFieldsOptionsLines = additionalFields!.options
      .map((option) => {
        if (option.in !== "query") {
          throw new Error(`Additional field without qs arg: ${option}`);
        }

        return `qs.${option.name} = additionalFields.${
          option.name
        } as ${this.adjustType(option.type)};`;
      })
      .join("\n" + indentation);

    return [
      "\n" + indentation + addFieldsIntroLine,
      indentation + addFieldsOptionsLines + "\n",
    ].join("\n");
  },
};
