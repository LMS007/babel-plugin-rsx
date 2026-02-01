// Validation phase for RSX Babel plugin
// Exports functions that throw errors or warnings (no mutations)

const { yellow, reset } = require("./utils/colors.cjs");
const referencesProps = require("./utils/referencesProps.cjs");

/**
 * Validates that the component parameter is destructured.
 * Emits a warning if not.
 */
function validateComponentParams(params, filename, t) {
  if (
    params.length === 1 &&
    t.isIdentifier(params[0])
  ) {
    const name = params[0].name;
    const loc = params[0].loc?.start;
    console.warn(
      `${yellow}[RSX] Warning: RSX component parameter "${name}" is not destructured.${reset}\n` +
      `RSX always passes a context object and destructures it internally.\n` +
      `Use: function Component({ view, update, render, props }) { ... }\n` +
      (loc
        ? `  at ${filename}:${loc.line}:${loc.column}`
        : `  at ${filename}`)
    );
  }
}

/**
 * Throws an error if props are being mutated directly.
 */
function validatePropsImmutable(path, t) {
  const { left } = path.node;

  if (t.isMemberExpression(left) && t.isIdentifier(left.object, { name: "props" })) {
    throw path.buildCodeFrameError(
      "[RSX] Props are immutable.\n" +
        "Do not assign to props.* — treat props as read-only inputs."
    );
  }
}

/**
 * Warns if assigning instance state from props in root scope.
 */
function warnPropsInRootScope(path, state, t) {
  const { left, right } = path.node;

  const rhsIsPropDerived = referencesProps(right, t);

  if (rhsIsPropDerived) {
    const loc = path.node.loc?.start;
    console.warn(
      `[RSX] Warning: assigning instance state "${left.name}" from props in root scope.\n` +
        "Root scope is reactive and may capture stale values.\n" +
        "Move this logic into init() or update()." +
        (loc ? `\n  at ${state.filename}:${loc.line}:${loc.column}` : "")
    );
  }
}

module.exports = {
  validateComponentParams,
  validatePropsImmutable,
  warnPropsInRootScope
};
