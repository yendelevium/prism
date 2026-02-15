/**
 * Replaces {{variable}} placeholders in a string with values from a variables object.
 *
 * @param content The string containing placeholders (e.g., "Hello {{name}}")
 * @param variables An object containing variable values (e.g., { name: "World" })
 * @returns The string with placeholders replaced.
 */
export const requestParser = (
  content: string,
  variables: Record<string, string>,
): string => {
  if (!content) return content;

  // Regex breakdown:
  // {{ - matches the literal "{{"
  // \s* - matches zero or more whitespace characters (allows {{ variable }})
  // ([a-zA-Z0-9_]+) - Capturing group 1: matches the variable name (alphanumeric + underscore)
  // \s* - matches zero or more whitespace characters
  // }} - matches the literal "}}"
  const regex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

  return content.replace(regex, (match, variableName) => {
    // Check if the variable exists in our variables object
    // If it exists, return the value.
    // If not, you can return the original match (leave it as is) or an empty string.

    // valid check: variableName inside variables strictly
    if (Object.prototype.hasOwnProperty.call(variables, variableName)) {
      return variables[variableName];
    }

    // Fallback: return the original string if variable not found
    return match;
  });
};
