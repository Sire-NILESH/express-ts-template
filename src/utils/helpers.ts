/**
 * Filter req.body object for "name" and "email" and store it to newObj
 *
 * @param {Record<string, any>} obj - req.body is an object
 * @param {Array<string>} allowedFields - Array ["name", "email"]
 * @returns {Record<string, any>}
 */
export const filterObj = (
  obj: Record<string, unknown>,
  ...allowedFields: string[]
): Record<string, unknown> => {
  const newObj: Record<string, unknown> = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};
