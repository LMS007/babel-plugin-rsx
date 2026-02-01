// Utility: isInternal
// Returns true if the identifier name starts with __ (compiler internal)
module.exports = function isInternal(name) {
  return name.startsWith("__");
};
