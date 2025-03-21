export const convertToCamelCase = (str: string) => {
  str = str.replace(/\s(.)/g, (char) => char.toUpperCase());
  str = str.charAt(0).toLowerCase() + str.slice(1);
  return str;
};
