// Analysis phase for RSX Babel plugin
// Exports functions that walk the AST and collect information (no mutations)

/**
 * Collects banned hooks from a React import declaration.
 * Returns a Set of local names that are banned.
 */
function collectBannedHooks(path, state, t) {
  if (path.node.source.value !== "react") return;

  const BANNED_HOOKS = new Set([
    "useState",
    "useCallback",
    "useMemo",
    "useRef",
  ]);

  for (const spec of path.node.specifiers) {
    if (!t.isImportSpecifier(spec)) continue;

    const imported = t.isIdentifier(spec.imported) ? spec.imported.name : spec.imported.value;
    const local = spec.local.name;

    if (BANNED_HOOKS.has(imported)) {
      state.bannedHooks.add(local);
    }
  }
}

/**
 * Identifies the RSX component from an ExportDefaultDeclaration.
 * Sets state.rsx.componentPath if found.
 */
function identifyComponent(path, state, t) {
  const decl = path.get("declaration");

  if (
    decl.isFunctionDeclaration() ||
    decl.isFunctionExpression() ||
    decl.isArrowFunctionExpression()
  ) {
    state.rsx.componentPath = decl;
    return decl;
  }

  return null;
}

/**
 * Captures instance variables from VariableDeclarator nodes.
 * Returns the captured variable info { id, init } or null if not captured.
 */
function captureInstanceVar(path, state, t, isInternal) {
  const fn = path.getFunctionParent();
  if (!fn || !state.rsx.componentPath || fn.node !== state.rsx.componentPath.node) return null;

  const { id, init } = path.node;
  if (!t.isIdentifier(id)) return null;

  // Skip compiler internals
  if (isInternal(id.name)) return null;

  return { id, init };
}

module.exports = {
  collectBannedHooks,
  identifyComponent,
  captureInstanceVar
};
