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
 * Injects runtime code for a single component.
 * @param {Object} componentData - { name, path, instanceVars }
 * @param {Object} t - Babel types
 */
function injectRuntimeCodeForComponent(componentData, t) {
  const vars = [...componentData.instanceVars.entries()];

  // Build the per-instance storage object
  const initProps = vars.map(([name, init]) =>
    t.objectProperty(t.identifier(name), init || t.identifier("undefined"))
  );

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

    t.variableDeclaration("const", [
      t.variableDeclarator(
        t.identifier("__rsx_triggerRender"),
        t.arrowFunctionExpression(
          [],
          t.callExpression(t.identifier("__rsxForceUpdate"), [
            t.arrowFunctionExpression(
              [t.identifier("x")],
              t.binaryExpression("+", t.identifier("x"), t.numericLiteral(1))
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
 * Removes a captured instance variable from the AST.
 */
function removeInstanceVarDeclaration(path) {
  const decl = path.parentPath;
  if (decl.node.declarations.length === 1) {
    decl.remove();
  } else {
    path.remove();
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
