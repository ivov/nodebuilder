export default class YamlAdjuster {
  private mainParams: YamlMainParams;

  constructor(mainParams: YamlMainParams) {
    this.mainParams = mainParams;
  }

  public run() {
    this.adjustTypeAndDescription();
    this.outputNodegenParams();

    return (this.mainParams as unknown) as MainParams; // TODO
  }

  private adjustTypeAndDescription() {
    Object.keys(this.mainParams).forEach((resource) => {
      this.mainParams[resource].forEach((yamlOperation) => {
        ["queryString", "requestBody"].forEach((rootProperty) => {
          if (!yamlOperation[rootProperty]) return;

          Object.entries(yamlOperation[rootProperty]).forEach(
            ([key, value]) => {
              if (typeof value === "string" && value.includes("|")) {
                const [type, description] = value.split("|");
                yamlOperation[rootProperty][key] = { type, description };
              } else if (typeof value === "string") {
                yamlOperation[rootProperty][key] = { type: value };
              }
            }
          );
        });
      });
    });
  }

  private outputNodegenParams() {
    Object.keys(this.mainParams).forEach((resource, yamlOperationIndex) => {
      this.mainParams[resource].forEach((yamlOperation) => {
        this.handleQueryString(yamlOperation, resource, yamlOperationIndex);
        this.handleRequestBody(yamlOperation, resource, yamlOperationIndex);
      });
    });
  }

  private handleRequestBody(
    yamlOperation: YamlOperation,
    resource: string,
    yamlOperationIndex: number
  ) {
    if (!yamlOperation.requestBody) return;

    const jsonRequestBody: OperationRequestBody = {
      // TODO: other MIME types
      content: {
        "application/x-www-form-urlencoded": {
          schema: {
            type: "object",
            properties: {},
          },
        },
      },
    };

    const jsonProperties =
      jsonRequestBody.content["application/x-www-form-urlencoded"].schema
        .properties;

    for (const property in yamlOperation.requestBody) {
      jsonProperties[property] = yamlOperation.requestBody[property];
    }

    this.mainParams[resource][yamlOperationIndex].requestBody = {
      required: true,
      ...jsonRequestBody,
    };
  }

  private handleQueryString(
    yamlOperation: YamlOperation,
    resource: string,
    yamlOperationIndex: number
  ) {
    if (!yamlOperation.queryString) return;

    const jsonParameters: OperationParameter[] = [];

    for (const property in yamlOperation.queryString) {
      const yamlQueryParameter = yamlOperation.queryString[property];

      const jsonQueryParameter: OperationParameter = {
        in: "query",
        name: property,
        required: true,
        schema: {
          type: yamlQueryParameter.type,
        },
      };

      if (yamlQueryParameter.description) {
        jsonQueryParameter.description = yamlQueryParameter.description;
      }

      jsonParameters.push(jsonQueryParameter);
    }

    delete yamlOperation.queryString;
    this.mainParams[resource][yamlOperationIndex].parameters = jsonParameters;
  }
}
