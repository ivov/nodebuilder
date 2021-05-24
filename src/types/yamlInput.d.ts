// ----------------------------------
//         Input YAML file
// ----------------------------------

/**
 * Used only to validate the shape of the input YAML file in `YamlParser.jsonifyYaml`.
 */
type YamlInput = {
  metaParams: MetaParams;
  mainParams: {
    [resource: string]: Array<{
      endpoint: string;
      operationId: string;
      requestMethod: string;

      operationUrl?: string;
      requiredFields?: YamlField;
      additionalFields?: YamlField;
      filters?: YamlField;
      updateFields?: YamlField;
    }>;
  };
};

type YamlField = {
  [key in "queryString" | "requestBody"]?: {
    [paramName: string]: string | object;
  };
};
