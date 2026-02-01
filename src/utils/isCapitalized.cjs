// Utility: isCapitalized
// Returns true if the string starts with an uppercase letter (A-Z)
module.exports = function isCapitalized(str) {
  if (typeof str !== "string" || str.length === 0) return false;
  const firstChar = str.charCodeAt(0);
  return firstChar >= 65 && firstChar <= 90; // A-Z
};
