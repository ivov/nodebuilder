/**
 * Creates OpenApi-formatted parameters.
 */
export default class OpenApiCreator {
  public static pathParam(pathParam: string) {
    return {
      in: "path" as const,
      name: pathParam,
      schema: {
        type: "string",
        default: "",
      },
      required: true,
    };
  }

  public static qsParam(
    key: string,
    value: { type: string; description?: string }, // TODO: Type properly
    { required }: { required: boolean }
  ) {
    const output: OperationParameter = {
      in: "query" as const,
      name: key,
      required,
      schema: {
        type: value.type,
        default: this.getDefault(value.type),
      },
    };

    if (value.description) {
      output.description = value.description;
    }

    return output;
  }

  public static requestBody(
    requestBody: YamlOperation["requestBody"],
    {
      required,
      name,
    }: {
      required: boolean;
      name:
        | "Standard"
        | "Additional Fields"
        | "Filter Fields"
        | "Update Fields";
    }
  ) {
    if (!requestBody) return null;

    const outputRequestBody: OperationRequestBody = {
      // TODO: add other types: `multipart/form-data` and `text/plain`
      name,
      required,
      content: {
        "application/x-www-form-urlencoded": {
          schema: {
            type: "object",
            properties: {},
          },
        },
      },
    };

    Object.entries(requestBody).forEach(([key, value]) => {
      outputRequestBody.content[
        "application/x-www-form-urlencoded"
      ].schema.properties[key] = value;
    });

    return [outputRequestBody];
  }

  private static getDefault(type: string) {
    if (type === "boolean") return false;
    if (type === "number") return 0;
    return "";
  }
}
