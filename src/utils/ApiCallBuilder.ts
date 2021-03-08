export class ApiCallBuilder {
  serviceApiRequest: string;
  lines: string[];
  hasPathParam = false;
  hasQueryString = false;
  hasRequestBody = false;
  _additionalFields: AdditionalFields;

  constructor(serviceApiRequest: string) {
    this.serviceApiRequest = serviceApiRequest;
    return this;
  }

  run({
    parameters,
    additionalFields,
    requestBody,
    requestMethod,
    endpoint,
  }: Operation) {
    this.resetState();

    const pathParams = parameters?.filter((p) => this.isPathParam(p));
    const qsParams = parameters?.filter((p) => this.isQsParam(p));

    if (pathParams) {
      this.hasPathParam = true;
      pathParams.forEach((p) => this.pathParam(p));
      this.addNewLine(this.lines);
    }

    if (requestBody) {
      this.hasRequestBody = true;
      this.requestBody(requestBody);
    }

    if (qsParams) {
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

    this.lines.push(
      this.callLine(requestMethod, {
        hasQueryString: this.hasQueryString,
        hasRequestBody: this.hasRequestBody,
      })
    );

    return this.indentLines();
  }

  resetState() {
    this.lines = [];
    this.hasPathParam = false;
    this.hasQueryString = false;
    this.hasRequestBody = false;
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

  requestBody(requestBody: OperationRequestBody) {
    const bodyComponents = this.getBodyComponents(requestBody);
    if (!bodyComponents) return;

    this.lines.push("const body: IDataObject = {");

    this.lines.push(
      ...bodyComponents.map(
        (rbc) => `\t${rbc}: this.getNodeParameter('${rbc}', i),`
      )
    );

    this.lines.push("};");
    this.addNewLine(this.lines);
  }

  addNewLine = (array: string[]) => (array[array.length - 1] += "\n");

  // TODO: temp implementation
  getBodyComponents(requestBody: OperationRequestBody) {
    const textPlainContent = requestBody.content["text/plain"];
    const formUrlEncoded =
      requestBody.content["application/x-www-form-urlencoded"];

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

  callLine(
    requestMethod: string,
    { hasRequestBody, hasQueryString }: CallLineOptionalArgs = {}
  ) {
    const body = hasRequestBody ? "body" : "{}";
    const qs = hasQueryString ? "qs" : "{}";

    const call = `responseData = await ${this.serviceApiRequest}.call`;
    const args = `(this, '${requestMethod}', endpoint, ${body}, ${qs});`;

    return call + args;
  }
}
