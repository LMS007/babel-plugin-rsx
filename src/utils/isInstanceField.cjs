// Utility: isInstanceField
// Returns true if the name is a captured RSX instance variable
module.exports = function isInstanceField(name, state) {
  return state && state.rsx && state.rsx.instanceVars && state.rsx.instanceVars.has(name);
};
