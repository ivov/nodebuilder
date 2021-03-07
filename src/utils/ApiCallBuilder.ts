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

    if (additionalFields) {
      this._additionalFields = additionalFields;
    }

    if (parameters) {
      parameters.forEach((param) => {
        if (this.isPathParam(param)) {
          this.hasPathParam = true;
          this.pathParam(param);
        }

        if (this.isQsParam(param)) {
          this.hasQueryString = true;
          this.qsDeclaration();
          this.qsParam(param);
          if (additionalFields) {
            this.additionalFields("qs");
          }
        }
      });
    }

    if (requestBody) {
      this.hasRequestBody = true;
      this.requestBodyDeclaration();
      this.requestBodyComponents(requestBody);
      if (additionalFields) {
        this.additionalFields("body");
      }
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

  qsDeclaration() {
    this.lines.push(`const qs: IDataObject = {};`);
  }

  qsParam({ name }: OperationParameter) {
    this.lines.push(`qs.${name} = this.getNodeParameter('${name}', i);`);
  }

  isPathParam = (param: OperationParameter) => {
    return param.in === "path";
  };

  isQsParam = (param: OperationParameter) => param.in === "query";

  // ------------------ request body ------------------

  requestBodyDeclaration() {
    this.lines.push(`const body: IDataObject = {};`);
  }

  requestBodyComponents(requestBody: OperationRequestBody) {
    const bodyComponents = this.getBodyComponents(requestBody);
    if (!bodyComponents) return;

    const bodyComponentLines = bodyComponents.map(
      (rbc) => `body.${rbc} = this.getNodeParameter('${rbc}', i);`
    );

    this.addNewLine(bodyComponentLines);

    this.lines.push(...bodyComponentLines);
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

  additionalFields(target = "qs") {
    const afDeclarationLine = `const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;`;
    const afLoadLines = this._additionalFields.options.map((option) => {
      const loading = `${target}.${option.name} = additionalFields.${option.name}`;
      const casting = `as ${this.adjustType(option.type)};`;
      return [loading, casting].join(" ");
    });

    this.addNewLine(afLoadLines);

    this.lines.push(afDeclarationLine, ...afLoadLines);
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

export class ApiCallBuilderFromOpenAPI extends ApiCallBuilder {}

export class ApiCallBuilderFromYAML extends ApiCallBuilder {
  endpoint(endpoint: string) {
    const hasPathParam = (endpoint: string) => endpoint.split("").includes("{");
    this.lines.push(
      hasPathParam(endpoint)
        ? this.pathParamEndpoint(endpoint)
        : this.ordinaryEndpoint(endpoint)
    );
  }
}
