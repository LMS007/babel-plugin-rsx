// Transformation phase for RSX Babel plugin
// Exports functions that mutate the AST

const {
  buildRuntimeSlots,
  buildLifecycleContext,
  buildRenderFunction,
  buildInitGuard,
  buildUserInitFunction,
  buildUpdateAndRender,
  buildTrackPropsStatements,
  buildFinalReturn
} = require("./rsxRuntime.cjs");

/**
 * Recursively collects all identifiers that are actual variable references in an AST node.
 * Skips property names in non-computed member expressions (e.g., in console.log, only 'console' is collected).
 * @param {Object} node - AST node to traverse
 * @param {Object} t - Babel types
 * @returns {Set<string>} Set of identifier names that are actual references
 */
function collectReferencedIdentifiers(node, t) {
  const refs = new Set();
  
  function walk(n, skipIdentifier = false) {
    if (!n || typeof n !== "object") return;
    
    // Handle MemberExpression specially: the property is not a reference (unless computed)
    if (t.isMemberExpression(n)) {
      // Always walk the object (it's a reference)
      walk(n.object, false);
      // Only walk the property if computed (e.g., a[b] - b is a reference, but a.b - b is not)
      if (n.computed) {
        walk(n.property, false);
      }
      // Don't continue with default traversal
      return;
    }
    
    // Handle ObjectProperty specially: the key is not a reference (unless computed)
    if (t.isObjectProperty(n)) {
      // Only walk the key if computed
      if (n.computed) {
        walk(n.key, false);
      }
      // Always walk the value
      walk(n.value, false);
      return;
    }
    
    if (t.isIdentifier(n) && !skipIdentifier) {
      refs.add(n.name);
    }
    
    for (const key in n) {
      if (key === "loc" || key === "start" || key === "end" || key === "range") continue;
      const val = n[key];
      if (Array.isArray(val)) {
        val.forEach(item => walk(item, false));
      } else if (val && typeof val === "object") {
        walk(val, false);
      }
    }
  }
  
  walk(node, false);
  return refs;
}

/**
 * Checks if an initializer references any variables from a given set,
 * OR references __instance (which means it references a rewritten instance var).
 * @param {Object} init - AST node (initializer)
 * @param {Set<string>} localNames - Set of locally-bound variable names
 * @param {Object} t - Babel types
 * @returns {boolean} true if init references any local name or __instance
 */
function initReferencesLocals(init, localNames, t) {
  if (!init) return false;
  const refs = collectReferencedIdentifiers(init, t);
  
  // If the initializer references __instance, it means it references a
  // rewritten instance variable, which won't be available at init time
  if (refs.has("__instance")) return true;
  
  for (const ref of refs) {
    if (localNames.has(ref)) return true;
  }
  return false;
}

/**
 * Injects runtime code for a single component.
 * @param {Object} componentData - { name, path, instanceVars, localBindings }
 * @param {Object} t - Babel types
 */
function injectRuntimeCodeForComponent(componentData, t) {
  const vars = [...componentData.instanceVars.entries()];
  
  // Get the set of locally-bound names (other instance vars + component-body locals)
  // Instance var names themselves are local (they can reference each other)
  const localNames = new Set(componentData.localBindings || []);
  for (const [name] of vars) {
    localNames.add(name);
  }

  // Build the per-instance storage object
  // If an initializer references any local name, use undefined instead
  const initProps = vars.map(([name, init]) => {
    const usesLocal = initReferencesLocals(init, localNames, t);
    const safeInit = (init && !usesLocal) ? init : t.identifier("undefined");
    return t.objectProperty(t.identifier(name), safeInit);
  });

  // Add internal RSX runtime slots
  initProps.push(...buildRuntimeSlots(t));

  const initObject = t.objectExpression(initProps);

  const body = componentData.path.get("body");

  // Create the injected useState call *as a standalone node*
  const injectedUseStateCall = t.callExpression(t.identifier("useState"), [
    t.numericLiteral(0),
  ]);

  // Tag it so the ban rule can skip it
  injectedUseStateCall.__rsxInjected = true;

  body.unshiftContainer("body", [
    // const [, __rsxForceUpdate] = useState(0);
    t.variableDeclaration("const", [
      t.variableDeclarator(
        t.arrayPattern([
          null, // destructuring hole (IMPORTANT: not t.nullLiteral())
          t.identifier("__rsxForceUpdate"),
        ]),
        injectedUseStateCall
      ),
    ]),

    // __instanceRef declaration
    t.variableDeclaration("const", [
      t.variableDeclarator(
        t.identifier("__instanceRef"),
        t.callExpression(t.identifier("useRef"), [t.nullLiteral()])
      ),
    ]),

    // initialize current instance once
    t.ifStatement(
      t.binaryExpression(
        "===",
        t.memberExpression(t.identifier("__instanceRef"), t.identifier("current")),
        t.nullLiteral()
      ),
      t.blockStatement([
        t.expressionStatement(
          t.assignmentExpression(
            "=",
            t.memberExpression(t.identifier("__instanceRef"), t.identifier("current")),
            initObject
          )
        ),
      ])
    ),

    // __instance alias
    t.variableDeclaration("const", [
      t.variableDeclarator(
        t.identifier("__instance"),
        t.memberExpression(t.identifier("__instanceRef"), t.identifier("current"))
      ),
    ]),

    // __rsx_triggerRender batches multiple render() calls into one update
    // Generated code:
    //   const __rsx_triggerRender = () => {
    //     if (__instance.__rsx_renderPending) return;
    //     __instance.__rsx_renderPending = true;
    //     queueMicrotask(() => {
    //       __instance.__rsx_renderPending = false;
    //       __rsx_render();
    //       __rsxForceUpdate(x => x + 1);
    //     });
    //   };
    t.variableDeclaration("const", [
      t.variableDeclarator(
        t.identifier("__rsx_triggerRender"),
        t.arrowFunctionExpression(
          [],
          t.blockStatement([
            // if (__instance.__rsx_renderPending) return;
            t.ifStatement(
              t.memberExpression(t.identifier("__instance"), t.identifier("__rsx_renderPending")),
              t.returnStatement()
            ),
            // __instance.__rsx_renderPending = true;
            t.expressionStatement(
              t.assignmentExpression(
                "=",
                t.memberExpression(t.identifier("__instance"), t.identifier("__rsx_renderPending")),
                t.booleanLiteral(true)
              )
            ),
            // queueMicrotask(() => { __instance.__rsx_renderPending = false; __rsx_render(); __rsxForceUpdate(x => x + 1); });
            t.expressionStatement(
              t.callExpression(t.identifier("queueMicrotask"), [
                t.arrowFunctionExpression(
                  [],
                  t.blockStatement([
                    t.expressionStatement(
                      t.assignmentExpression(
                        "=",
                        t.memberExpression(t.identifier("__instance"), t.identifier("__rsx_renderPending")),
                        t.booleanLiteral(false)
                      )
                    ),
                    // __rsx_render() - execute view callback once
                    t.expressionStatement(
                      t.callExpression(t.identifier("__rsx_render"), [])
                    ),
                    t.expressionStatement(
                      t.callExpression(t.identifier("__rsxForceUpdate"), [
                        t.arrowFunctionExpression(
                          [t.identifier("x")],
                          t.binaryExpression("+", t.identifier("x"), t.numericLiteral(1))
                        ),
                      ])
                    ),
                  ])
                ),
              ])
            ),
          ])
        )
      ),
    ]),
  ]);

  // Add useEffect for cleanup/destroy callback
  body.unshiftContainer("body", [
    t.expressionStatement(
      t.callExpression(t.identifier("useEffect"), [
        t.arrowFunctionExpression(
          [],
          t.blockStatement([
            t.returnStatement(
              t.arrowFunctionExpression(
                [],
                t.blockStatement([
                  t.ifStatement(
                    t.memberExpression(
                      t.identifier("__instance"),
                      t.identifier("__rsx_destroyCb")
                    ),
                    t.blockStatement([
                      t.expressionStatement(
                        t.callExpression(
                          t.memberExpression(
                            t.identifier("__instance"),
                            t.identifier("__rsx_destroyCb")
                          ),
                          []
                        )
                      ),
                    ])
                  ),
                ])
              )
            ),
          ])
        ),
        t.arrayExpression([]),
      ])
    ),
  ]);
}

/**
 * Builds and injects the runtime code into all component bodies during Program.exit.
 * Now iterates over all registered components.
 */
function injectRuntimeCode(state, t) {
  if (!state.rsx) return;
  
  // Iterate over all registered components
  for (const [fnNode, componentData] of state.rsx.components) {
    injectRuntimeCodeForComponent(componentData, t);
  }
}

/**
 * Transforms the FunctionDeclaration for an RSX component.
 * Now checks against all registered components, not just a single componentPath.
 */
function transformComponentFunction(path, state, t) {
  if (!state.rsx || state.skipRSX) return;
  
  // Check if this function is a registered RSX component
  const componentData = state.rsx.components.get(path.node);
  if (!componentData) return;
  
  if (!t.isBlockStatement(path.node.body)) return;

  // Keep original function signature for React compatibility
  const hasSecondParam = path.node.params.length > 1;

  // Replace user's params with standard React params
  path.node.params = [t.identifier("__reactProps")];
  if (hasSecondParam) {
    path.node.params.push(t.identifier("ref"));
  }

  // Split original user body into return vs non-return
  const originalBody = path.node.body.body;

  const nonReturnStatements = [];
  const returnStatements = [];

  for (const stmt of originalBody) {
    if (t.isReturnStatement(stmt)) returnStatements.push(stmt);
    else nonReturnStatements.push(stmt);
  }

  // Build all the transformed code
  const trackPropsStatements = buildTrackPropsStatements(t);
  const ctxObjectDecl = buildLifecycleContext(t);
  const renderFnDecl = buildRenderFunction(t);
  const userInitFn = buildUserInitFunction(nonReturnStatements, t);
  const initGuard = buildInitGuard(t);
  const updateAndRender = buildUpdateAndRender(t);
  const finalReturn = buildFinalReturn(t);

  // Replace the function body
  path.node.body.body = [
    ...trackPropsStatements,
    ctxObjectDecl,
    renderFnDecl,
    userInitFn,
    initGuard,
    updateAndRender,
    finalReturn,
  ];
}

/**
 * Removes a captured instance variable declaration from the AST.
 * If the variable has an initializer that references local variables,
 * it converts it to an __instance assignment to preserve the initialization.
 * 
 * @param {Object} path - Babel path to the VariableDeclarator
 * @param {Object} componentData - Component data containing localBindings
 * @param {Object} t - Babel types
 */
function removeInstanceVarDeclaration(path, componentData, t) {
  const { id, init } = path.node;
  const varName = id.name;
  
  // Get local bindings (other instance vars + component-body locals like props destructuring)
  const localNames = new Set(componentData.localBindings || []);
  for (const [name] of componentData.instanceVars) {
    localNames.add(name);
  }
  
  // Check if the initializer references any local variables
  const needsDeferredInit = init && initReferencesLocals(init, localNames, t);
  
  const decl = path.parentPath;
  
  if (needsDeferredInit) {
    // Convert to an assignment statement: __instance.x = expr;
    // This will be placed in __userInit where local variables are available
    const assignment = t.expressionStatement(
      t.assignmentExpression(
        "=",
        t.memberExpression(t.identifier("__instance"), t.identifier(varName)),
        init
      )
    );
    
    if (decl.node.declarations.length === 1) {
      // Replace the entire declaration with the assignment
      decl.replaceWith(assignment);
    } else {
      // Remove just this declarator and insert assignment after the declaration
      path.remove();
      decl.insertAfter(assignment);
    }
  } else {
    // No deferred init needed, just remove the declaration
    if (decl.node.declarations.length === 1) {
      decl.remove();
    } else {
      path.remove();
    }
  }
}

/**
 * Rewrites an assignment to an instance field to use __instance.
 */
function rewriteInstanceAssignment(path, t) {
  const { left } = path.node;
  path.node.left = t.memberExpression(t.identifier("__instance"), t.identifier(left.name));
}

/**
 * Rewrites an identifier reference to an instance field to use __instance.
 */
function rewriteInstanceReference(path, t) {
  path.replaceWith(t.memberExpression(t.identifier("__instance"), t.identifier(path.node.name)));
}

module.exports = {
  injectRuntimeCode,
  transformComponentFunction,
  removeInstanceVarDeclaration,
  rewriteInstanceAssignment,
  rewriteInstanceReference
};
