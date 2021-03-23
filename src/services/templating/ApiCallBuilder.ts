import { camelCase } from "change-case";

export class ApiCallBuilder {
  serviceApiRequest: string;
  lines: string[];
  hasPathParam = false;
  hasQueryString = false;
  hasRequestBody = false;
  hasStandardRequestBody = false;
  isGetAll = false;
  _additionalFields: AdditionalFields;

  constructor(serviceApiRequest: string) {
    this.serviceApiRequest = serviceApiRequest;
    return this;
  }

  run({
    operationId,
    parameters,
    additionalFields,
    requestBody: requestBodyArray,
    requestMethod,
    endpoint,
  }: Operation) {
    this.resetState();

    this.isGetAll = operationId === "getAll";

    const pathParams = parameters?.filter((p) => this.isPathParam(p));
    const qsParams = parameters?.filter((p) => this.isQsParam(p));

    if (pathParams?.length) {
      this.hasPathParam = true;
      pathParams.forEach((p) => this.pathParam(p));
      this.addNewLine(this.lines);
    }

    if (requestBodyArray?.length) {
      this.hasRequestBody = true;
      this.requestBody(requestBodyArray);
    }

    if (qsParams?.length) {
      this.hasQueryString = true;
      this.qs(qsParams);
    }

    if (additionalFields) {
      this._additionalFields = additionalFields;

      const qsOptions = additionalFields.options.filter(
        (o) => o.in === "query"
      );

      if (qsOptions) this.additionalFields("qs");
    }

    this.endpoint(endpoint);

    this.lines.push(this.callLine(requestMethod));

    return this.indentLines();
  }

  resetState() {
    this.lines = [];
    this.hasPathParam = false;
    this.hasQueryString = false;
    this.hasRequestBody = false;
    this.hasStandardRequestBody = false;
    this.isGetAll = false;
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
    this.lines.push("const qs: IDataObject = {");

    this.lines.push(
      ...qsParams.map(
        (qsp) => `\t${qsp.name}: this.getNodeParameter('${qsp.name}', i),`
      )
    );

    this.lines.push("};");
    this.addNewLine(this.lines);
  }

  qsParam({ name }: OperationParameter) {
    this.lines.push(`qs.${name} = this.getNodeParameter('${name}', i);`);
  }

  isPathParam = (param: OperationParameter) => param.in === "path";

  isQsParam = (param: OperationParameter) => param.in === "query";

  // ------------------ request body ------------------

  requestBody(rbArray: OperationRequestBody[]) {
    rbArray.forEach((rbItem) => {
      if (rbItem.name === "Standard") {
        this.hasStandardRequestBody = true;

        const rbItemNames = this.getRequestBodyItemNames(rbItem);

        if (!rbItemNames) return;

        this.lines.push("const body: IDataObject = {");

        this.lines.push(
          ...rbItemNames.map(
            (rbc) => `\t${rbc}: this.getNodeParameter('${rbc}', i),`
          )
        );

        this.lines.push("};");
        this.addNewLine(this.lines);
      } else if (
        rbItem.name === "Additional Fields" ||
        rbItem.name === "Filter Fields" ||
        rbItem.name === "Update Fields"
      ) {
        if (!this.hasStandardRequestBody) {
          this.lines.push("const body: IDataObject = {};");
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

  // TODO: temp implementation
  getRequestBodyItemNames(requestBodyItem: OperationRequestBody) {
    const textPlainContent = requestBodyItem.content["text/plain"];
    const formUrlEncoded =
      requestBodyItem.content["application/x-www-form-urlencoded"];

    if (textPlainContent) return null; // TODO

    if (formUrlEncoded) {
      return Object.keys(formUrlEncoded.schema.properties);
    }

    return null;

    // const urlEncoded = "application/x-www-form-urlencoded";

    // const urlEncodedProps = [requestBody]
    //   .filter((c) => c.content[urlEncoded])
    //   .map((c) => c.content[urlEncoded].schema.properties)
    //   .map((c) => Object.keys(c))
    //   .flat();

    // if (urlEncodedProps.length) return urlEncodedProps;

    // const textPlain = "text/plain";
    // const textPlainProps = [requestBody]
    //   .filter((c) => c.content[textPlain])
    //   .map((_) => "text");

    // return textPlainProps;
  }

  // ------------------ additional fields -------------------

  additionalFields(target: "body" | "qs") {
    const addFieldsLine1 = `const additionalFields: IDataObject = this.getNodeParameter('additionalFields', i);\n`;
    const addFieldsLine2 = "if (Object.keys(additionalFields).length) {";
    const addFieldsLine3 = `\tObject.assign(${target}, additionalFields)`;
    const addFieldsLine4 = "};";

    this.lines.push(
      addFieldsLine1,
      addFieldsLine2,
      addFieldsLine3,
      addFieldsLine4
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

  callLine(requestMethod: string) {
    let call = this.isGetAll
      ? `responseData = await handleListing.call(this, i, '${requestMethod}', endpoint`
      : `responseData = await ${this.serviceApiRequest}.call(this, '${requestMethod}', endpoint`;

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
}
