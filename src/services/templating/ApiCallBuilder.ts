import { camelCase } from "change-case";

const LONG_ENDPOINT_CHARACTER_LENGTH = 20;

export default class ApiCallBuilder {
  serviceApiRequest: string;
  lines: string[];
  hasPathParam = false;
  hasQueryString = false;
  hasRequestBody = false;
  hasStandardRequestBody = false;
  isGetAll = false;
  hasLongEndpoint = false;

  constructor(serviceApiRequest: string) {
    this.serviceApiRequest = serviceApiRequest;
    return this;
  }

  run({
    operationId,
    parameters,
    additionalFields,
    requestBody,
    requestMethod,
    endpoint,
  }: Operation) {
    this.resetState();

    this.isGetAll = operationId === "getAll";
    this.hasLongEndpoint = endpoint.length > LONG_ENDPOINT_CHARACTER_LENGTH;

    const pathParams = parameters?.filter(this.isPathParam);
    const qsParams = parameters?.filter(this.isQsParam);

    if (requestBody?.length) {
      this.hasRequestBody = true;
      this.requestBody(requestBody);
    }

    if (pathParams?.length) {
      this.hasPathParam = true;
      pathParams.forEach((p) => this.pathParam(p));
      this.addNewLine(this.lines);
    }

    if (qsParams?.length) {
      this.hasQueryString = true;
      this.qs(qsParams);
    }

    if (additionalFields) {
      const qsOptions = additionalFields.options.filter(this.isQsParam);

      if (!this.hasQueryString) this.lines.push("const qs = {} as IDataObject;");
      if (qsOptions) this.additionalFields("qs");
    }

    if (this.hasLongEndpoint) this.endpoint(endpoint);

    this.lines.push(this.callLine(requestMethod, endpoint));

    return this.indentLines();
  }

  resetState() {
    this.lines = [];
    this.hasPathParam = false;
    this.hasQueryString = false;
    this.hasRequestBody = false;
    this.hasStandardRequestBody = false;
    this.isGetAll = false;
    this.hasLongEndpoint = false;
  }

  indentLines() {
    return this.lines
      .map((line, index) => {
        if (index === 0) return line;
        return "\t".repeat(5) + line;
      })
      .join("\n");
  }

  // ------------------ path and qs parameters ------------------

  pathParam({ name }: OperationParameter) {
    this.lines.push(`const ${name} = this.getNodeParameter('${name}', i);`);
  }

  qs(qsParams: OperationParameter[]) {
    const [requiredQsParams, extraQsParams] = this.partitionByRequired(qsParams);

    // TODO: This is only for filters. Add variants for other extra fields.
    if (extraQsParams.length) {
      this.lines.push(
        "const qs = {} as IDataObject;",
        "const filters = this.getNodeParameter('filters', i) as IDataObject;\n",
        "if (Object.keys(filters).length) {",
        `\tObject.assign(qs, filters);`,
        "}\n"
      );
    }

    if (requiredQsParams.length) {
      this.lines.push("const qs: IDataObject = {");
      this.lines.push(
        ...requiredQsParams.map(
          (rqsp) => `\t${rqsp.name}: this.getNodeParameter('${rqsp.name}', i),`
        )
      );
      this.lines.push("};");
      this.addNewLine(this.lines);
    }
  }

  // TODO: No longer used?
  // qsParam({ name }: OperationParameter) {
  //   this.lines.push(`qs.${name} = this.getNodeParameter('${name}', i);`);
  // }

  isPathParam = (param: OperationParameter) => param.in === "path";

  isQsParam = (param: OperationParameter) => param.in === "query";

  // ------------------ request body ------------------

  requestBody(rbArray: OperationRequestBody[]) {
    rbArray.forEach((rbItem) => {
      if (rbItem.name === "Standard") {

        this.hasStandardRequestBody = true;

        const rbItemNames = this.getRequestBodyItemNames(rbItem);

        if (rbItemNames === "text/plain") {
          this.lines.push(
            `const body = this.getNodeParameter('${rbItem.textPlainProperty}', i) as string;`
          );
          return;
        }

        if (!rbItemNames) return;

        this.lines.push("const body = {");

        this.lines.push(
          ...rbItemNames.map(
            (rbc) => `\t${rbc}: this.getNodeParameter('${rbc}', i),`
          )
        );

        this.lines.push("} as IDataObject;");
        this.addNewLine(this.lines);

      } else if (
        rbItem.name === "Additional Fields" ||
        rbItem.name === "Filters" ||
        rbItem.name === "Update Fields"
      ) {
        if (!this.hasStandardRequestBody) {
          this.lines.push("const body = {} as IDataObject;");
        }

        const rbItemName = camelCase(rbItem.name);

        const rbItemNames = this.getRequestBodyItemNames(rbItem);

        if (!rbItemNames) return;

        this.lines.push(
          `const ${rbItemName} = this.getNodeParameter('${rbItemName}', i) as IDataObject;`
        );
        this.addNewLine(this.lines);

        this.lines.push(`if (Object.keys(${rbItemName}).length) {`);
        this.lines.push(`\tObject.assign(body, ${rbItemName});`);
        this.lines.push("}");

        this.addNewLine(this.lines);
      }
    });
  }

  addNewLine = (array: string[]) => (array[array.length - 1] += "\n");

  getRequestBodyItemNames(requestBodyItem: OperationRequestBody) {
    const formUrlEncoded =
      requestBodyItem.content["application/x-www-form-urlencoded"];

    if (formUrlEncoded) {
      return Object.keys(formUrlEncoded.schema.properties);
    }

    const textPlainContent = requestBodyItem.content["text/plain"];

    if (textPlainContent) return "text/plain";

    return null;
  }

  // ------------------ additional fields -------------------

  additionalFields(target: "body" | "qs") {
    this.lines.push(
      `const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;\n`,
      "if (Object.keys(additionalFields).length) {",
      `\tObject.assign(${target}, additionalFields);`,
      "}"
    );

    this.addNewLine(this.lines);
  }

  adjustType = (type: string) => (type === "integer" ? "number" : type);

  // ------------------ endpoint ------------------

  endpoint(endpoint: string) {
    this.lines.push(
      this.hasPathParam
        ? this.pathParamEndpoint(endpoint)
        : this.ordinaryEndpoint(endpoint)
    );
  }

  pathParamEndpoint = (endpoint: string) =>
    `const endpoint = \`${this.toTemplateLiteral(endpoint)}\`;`;

  ordinaryEndpoint = (endpoint: string) => `const endpoint = '${endpoint}';`;

  toTemplateLiteral = (endpoint: string) => endpoint.replace(/{/g, "${");

  // ------------------ call ------------------------

  callLine(requestMethod: string, endpoint = "") {
    const hasBracket = endpoint.split("").includes("}");

    const endpointInsert = this.hasLongEndpoint
      ? "endpoint"
      : hasBracket
        ? `\`${this.toTemplateLiteral(endpoint)}\``
        : `'${endpoint}'`;

    let call = this.isGetAll
      ? `responseData = await handleListing.call(this, i, '${requestMethod}', ${endpointInsert}`
      : `responseData = await ${this.serviceApiRequest}.call(this, '${requestMethod}', ${endpointInsert}`;

    if (this.hasRequestBody && this.hasQueryString) {
      call += ", body, qs);";
    } else if (this.hasRequestBody && !this.hasQueryString) {
      call += ", body);";
    } else if (!this.hasRequestBody && this.hasQueryString) {
      call += ", {}, qs);";
    } else if (!this.hasRequestBody && !this.hasQueryString) {
      call += ");";
    }

    return call;
  }

  // ------------------ utils ------------------------

  private partition = (test: (op: OperationParameter) => boolean) => (array: OperationParameter[]) => {
    const pass: OperationParameter[] = [], fail: OperationParameter[] = [];
    array.forEach((item) => (test(item) ? pass : fail).push(item));

    return [pass, fail];
  }

  private partitionByRequired = this.partition((op: OperationParameter) => op.required ?? false);
}