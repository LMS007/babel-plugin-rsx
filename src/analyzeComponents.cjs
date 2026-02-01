// Analysis phase for RSX Babel plugin
// Exports functions that walk the AST and collect information (no mutations)

const isCapitalized = require("./utils/isCapitalized.cjs");

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
 * @deprecated Use isRSXComponent instead for multi-component support
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
 * Checks if a FunctionDeclaration is an RSX component.
 * A function is an RSX component if its name starts with an uppercase letter.
 * @param {Object} path - Babel path to the FunctionDeclaration
 * @param {Object} t - Babel types
 * @returns {boolean} true if this is an RSX component
 */
function isRSXComponent(path, t) {
  // Must be a FunctionDeclaration with a block body
  if (!t.isBlockStatement(path.node.body)) return false;
  
  // Must have a name
  if (!path.node.id || !t.isIdentifier(path.node.id)) return false;
  
  const name = path.node.id.name;
  
  // Name must start with uppercase
  return isCapitalized(name);
}

/**
 * Registers a component in the state.rsx.components Map.
 * Each component gets its own instanceVars Map.
 * @param {Object} path - Babel path to the FunctionDeclaration
 * @param {Object} state - Babel plugin state
 */
function registerComponent(path, state) {
  const name = path.node.id.name;
  
  if (!state.rsx.components.has(path.node)) {
    state.rsx.components.set(path.node, {
      name: name,
      path: path,
      instanceVars: new Map()
    });
  }
}

/**
 * Gets the component data for a given function node.
 * @param {Object} fnNode - The function AST node
 * @param {Object} state - Babel plugin state
 * @returns {Object|null} Component data or null if not found
 */
function getComponentData(fnNode, state) {
  return state.rsx.components.get(fnNode) || null;
}

/**
 * Finds which RSX component a path belongs to by walking up the AST.
 * Walks up the function parent chain until it finds a registered component.
 * This handles nested functions (like callbacks passed to view(), update(), etc.)
 * @param {Object} path - Any Babel path
 * @param {Object} state - Babel plugin state
 * @returns {Object|null} Component data or null if not inside a component
 */
function findContainingComponent(path, state) {
  let fn = path.getFunctionParent();
  
  // Walk up the function chain until we find a registered component
  while (fn) {
    const componentData = getComponentData(fn.node, state);
    if (componentData) {
      return componentData;
    }
    fn = fn.getFunctionParent();
  }
  
  return null;
}

/**
 * Captures instance variables from VariableDeclarator nodes.
 * Returns the captured variable info { id, init, component } or null if not captured.
 * Now works with multiple components by finding the containing component.
 */
function captureInstanceVar(path, state, t, isInternal) {
  const fn = path.getFunctionParent();
  if (!fn) return null;
  
  // Find the component this variable belongs to
  const component = getComponentData(fn.node, state);
  if (!component) return null;

  const { id, init } = path.node;
  if (!t.isIdentifier(id)) return null;

  // Skip compiler internals
  if (isInternal(id.name)) return null;

  return { id, init, component };
}

module.exports = {
  collectBannedHooks,
  identifyComponent,
  isRSXComponent,
  registerComponent,
  getComponentData,
  findContainingComponent,
  captureInstanceVar
};
