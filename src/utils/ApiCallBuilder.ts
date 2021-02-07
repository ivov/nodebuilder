export const ApiCallBuilder = {
  serviceApiRequest: "",
  lines: <string[]>[],
  hasPathParam: false,
  _additionalFields: <AdditionalFields>{},

  constructor: function (serviceApiRequest: string) {
    this.serviceApiRequest = serviceApiRequest;
    return this;
  },

  setup: function (additionalFields: AdditionalFields | undefined) {
    this.lines = [];
    if (additionalFields) {
      this._additionalFields = additionalFields;
    }
  },

  run: function ({
    parameters,
    additionalFields,
    requestBody,
    requestMethod,
    endpoint,
  }: Operation) {
    this.setup(additionalFields);

    if (parameters) {
      this.qsDeclaration();
      parameters.forEach((param) => {
        if (this.isPathParam(param)) {
          this.hasPathParam = true;
          this.pathParam(param);
        }

        if (this.isQsParam(param)) {
          this.qsParam(param);
          if (additionalFields) {
            this.additionalFields("qs");
          }
        }
      });
    }

    if (requestBody) {
      this.requestBodyDeclaration();
      this.requestBodyComponents(requestBody);
      if (additionalFields) {
        this.additionalFields("body");
      }
    }

    this.endpoint(endpoint);

    this.lines.push(
      this.callLine(requestMethod, {
        hasQueryString: parameters !== undefined,
        hasRequestBody: requestBody !== undefined,
      })
    );

    return this.indentLines();
  },

  indentLines: function () {
    return this.lines
      .map((line, index) => {
        if (index === 0) return line;
        return "\t".repeat(5) + line;
      })
      .join("\n");
  },

  // ------------------ path and qs parameters ------------------

  pathParam: function ({ name }: OperationParameter) {
    this.lines.push(`const ${name} = this.getNodeParameter('${name}', i);`);
  },

  qsDeclaration: function () {
    this.lines.push(`const qs: IDataObject = {};`);
  },

  qsParam: function ({ name }: OperationParameter) {
    this.lines.push(`qs.${name} = this.getNodeParameter('${name}', i);`);
  },

  isPathParam: (param: OperationParameter) => param.in === "path",

  isQsParam: (param: OperationParameter) => param.in === "query",

  // ------------------ request body ------------------

  requestBodyDeclaration: function () {
    this.lines.push(`const body: IDataObject = {};`);
  },

  requestBodyComponents: function (requestBody: OperationRequestBody) {
    const bodyComponents = this.getBodyComponents(requestBody);
    if (!bodyComponents) return;

    const bodyComponentLines = bodyComponents.map(
      (rbc) => `body.${rbc} = this.getNodeParameter('${rbc}', i);`
    );

    this.addNewLine(bodyComponentLines);

    this.lines.push(...bodyComponentLines);
  },

  addNewLine: (array: string[]) => (array[array.length - 1] += "\n"),

  // TODO: temp implementation
  getBodyComponents: (requestBody: OperationRequestBody) => {
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
  },

  // ------------------ additional fields -------------------

  additionalFields: function (target = "qs") {
    const afDeclarationLine = `const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;`;
    const afLoadLines = this._additionalFields.options.map((option) => {
      const loading = `${target}.${option.name} = additionalFields.${option.name}`;
      const casting = `as ${this.adjustType(option.type)};`;
      return [loading, casting].join(" ");
    });

    this.addNewLine(afLoadLines);

    this.lines.push(afDeclarationLine, ...afLoadLines);
  },

  adjustType: (type: string) => (type === "integer" ? "number" : type),

  // ------------------ endpoint ------------------

  endpoint: function (endpoint: string) {
    this.lines.push(
      this.hasPathParam
        ? this.pathParamEndpoint(endpoint)
        : this.ordinaryEndpoint(endpoint)
    );
  },

  pathParamEndpoint: function (endpoint: string) {
    return `const endpoint = \`${this.toTemplateLiteral(endpoint)}\`;`;
  },

  ordinaryEndpoint: (endpoint: string) => `const endpoint = '${endpoint}';`,

  toTemplateLiteral: (endpoint: string) => endpoint.replace(/{/g, "${"),

  // ------------------ call ------------------------

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
