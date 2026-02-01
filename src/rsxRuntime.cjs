// RSX Runtime AST builders
// Exports functions that build AST nodes for runtime code injection

/**
 * Builds the internal RSX runtime slots that are added to the instance object.
 */
function buildRuntimeSlots(t) {
  return [
    // init flag to ensure root runs only once per instance
    t.objectProperty(t.identifier("__rsx_initialized"), t.booleanLiteral(false)),

    // props tracking (used later for update(prev, next))
    t.objectProperty(t.identifier("__rsx_prevProps"), t.identifier("undefined")),
    t.objectProperty(t.identifier("__rsx_currentProps"), t.identifier("undefined")),

    // lifecycle callback storage (wired in Phase 3+)
    t.objectProperty(t.identifier("__rsx_updateCb"), t.nullLiteral()),
    t.objectProperty(t.identifier("__rsx_viewCb"), t.nullLiteral()),
    t.objectProperty(t.identifier("__rsx_destroyCb"), t.nullLiteral()),
    t.objectProperty(t.identifier("__rsx_viewResult"), t.nullLiteral())
  ];
}

/**
 * Builds the lifecycle context object declaration.
 */
function buildLifecycleContext(t) {
  return t.variableDeclaration("const", [
    t.variableDeclarator(
      t.identifier("__rsx_ctx"),
      t.objectExpression([
        // view(fn) { __instance.__rsx_viewCb = fn; }
        t.objectMethod(
          "method",
          t.identifier("view"),
          [t.identifier("fn")],
          t.blockStatement([
            t.expressionStatement(
              t.assignmentExpression(
                "=",
                t.memberExpression(t.identifier("__instance"), t.identifier("__rsx_viewCb")),
                t.identifier("fn")
              )
            ),
          ])
        ),
        // update(fn) { __instance.__rsx_updateCb = fn; }
        t.objectMethod(
          "method",
          t.identifier("update"),
          [t.identifier("fn")],
          t.blockStatement([
            t.expressionStatement(
              t.assignmentExpression(
                "=",
                t.memberExpression(
                  t.identifier("__instance"),
                  t.identifier("__rsx_updateCb")
                ),
                t.identifier("fn")
              )
            ),
          ])
        ),
        // destroy(fn) { __instance.__rsx_destroyCb = fn; }
        t.objectMethod(
          "method",
          t.identifier("destroy"),
          [t.identifier("fn")],
          t.blockStatement([
            t.expressionStatement(
              t.assignmentExpression(
                "=",
                t.memberExpression(
                  t.identifier("__instance"),
                  t.identifier("__rsx_destroyCb")
                ),
                t.identifier("fn")
              )
            ),
          ])
        ),
        // render() {  __rsx_render(); __rsx_triggerRender(); }
        t.objectMethod(
          "method",
          t.identifier("render"),
          [],
          t.blockStatement([
            t.expressionStatement(t.callExpression(t.identifier("__rsx_render"), [])),
            t.expressionStatement(t.callExpression(t.identifier("__rsx_triggerRender"), [])),
          ])
        ),

        // get props() { return __instance.__rsx_currentProps; }
        t.objectMethod(
          "get",
          t.identifier("props"),
          [],
          t.blockStatement([
            t.returnStatement(
              t.memberExpression(
                t.identifier("__instance"),
                t.identifier("__rsx_currentProps")
              )
            ),
          ])
        ),
      ])
    ),
  ]);
}

/**
 * Builds the __rsx_render internal function declaration.
 */
function buildRenderFunction(t) {
  return t.functionDeclaration(
    t.identifier("__rsx_render"),
    [],
    t.blockStatement([
      t.ifStatement(
        t.memberExpression(t.identifier("__instance"), t.identifier("__rsx_viewCb")),
        t.blockStatement([
          t.expressionStatement(
            t.assignmentExpression(
              "=",
              t.memberExpression(
                t.identifier("__instance"),
                t.identifier("__rsx_viewResult")
              ),
              t.callExpression(
                t.memberExpression(t.identifier("__instance"), t.identifier("__rsx_viewCb")),
                [
                  t.memberExpression(
                    t.identifier("__instance"),
                    t.identifier("__rsx_currentProps")
                  ),
                ]
              )
            )
          ),
        ])
      ),
    ])
  );
}

/**
 * Builds the init-once guard if statement.
 */
function buildInitGuard(t) {
  return t.ifStatement(
    t.unaryExpression(
      "!",
      t.memberExpression(t.identifier("__instance"), t.identifier("__rsx_initialized"))
    ),
    t.blockStatement([
      // __instance.__rsx_initialized = true;
      t.expressionStatement(
        t.assignmentExpression(
          "=",
          t.memberExpression(t.identifier("__instance"), t.identifier("__rsx_initialized")),
          t.booleanLiteral(true)
        )
      ),

      // Call user function with context object
      t.expressionStatement(
        t.callExpression(
          t.memberExpression(t.identifier("__userInit"), t.identifier("call")),
          [t.thisExpression(), t.identifier("__rsx_ctx")]
        )
      ),

      // render once on mount so view() output is produced immediately
      t.expressionStatement(t.callExpression(t.identifier("__rsx_render"), [])),
    ])
  );
}

/**
 * Builds the user init function wrapper.
 */
function buildUserInitFunction(nonReturnStatements, t) {
  return t.functionDeclaration(
    t.identifier("__userInit"),
    [
      t.objectPattern([
        t.objectProperty(t.identifier("view"), t.identifier("view"), false, true),
        t.objectProperty(t.identifier("update"), t.identifier("update"), false, true),
        t.objectProperty(t.identifier("destroy"), t.identifier("destroy"), false, true),
        t.objectProperty(t.identifier("render"), t.identifier("render"), false, true),
        t.objectProperty(t.identifier("props"), t.identifier("props"), false, true),
      ]),
    ],
    t.blockStatement(nonReturnStatements)
  );
}

/**
 * Builds the update + render execution logic.
 */
function buildUpdateAndRender(t) {
  return t.ifStatement(
    t.logicalExpression(
      "&&",
      t.logicalExpression(
        "&&",
        t.memberExpression(t.identifier("__instance"), t.identifier("__rsx_initialized")),
        t.binaryExpression(
          "!==",
          t.memberExpression(t.identifier("__instance"), t.identifier("__rsx_prevProps")),
          t.identifier("undefined")
        )
      ),
      t.binaryExpression(
        "!==",
        t.memberExpression(t.identifier("__instance"), t.identifier("__rsx_prevProps")),
        t.memberExpression(t.identifier("__instance"), t.identifier("__rsx_currentProps"))
      )
    ),
    t.blockStatement([
      // guarded update
      t.ifStatement(
        t.memberExpression(t.identifier("__instance"), t.identifier("__rsx_updateCb")),
        t.blockStatement([
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(t.identifier("__instance"), t.identifier("__rsx_updateCb")),
              [
                t.memberExpression(t.identifier("__instance"), t.identifier("__rsx_prevProps")),
                t.memberExpression(
                  t.identifier("__instance"),
                  t.identifier("__rsx_currentProps")
                ),
              ]
            )
          ),
        ])
      ),

      // always render
      t.expressionStatement(t.callExpression(t.identifier("__rsx_render"), [])),
    ])
  );
}

/**
 * Builds the props tracking statements.
 */
function buildTrackPropsStatements(t) {
  return [
    // __instance.__rsx_prevProps = __instance.__rsx_currentProps;
    t.expressionStatement(
      t.assignmentExpression(
        "=",
        t.memberExpression(t.identifier("__instance"), t.identifier("__rsx_prevProps")),
        t.memberExpression(t.identifier("__instance"), t.identifier("__rsx_currentProps"))
      )
    ),

    // __instance.__rsx_currentProps = __reactProps;
    t.expressionStatement(
      t.assignmentExpression(
        "=",
        t.memberExpression(t.identifier("__instance"), t.identifier("__rsx_currentProps")),
        t.identifier("__reactProps")
      )
    ),
  ];
}

/**
 * Builds the final return statement.
 */
function buildFinalReturn(t) {
  return t.returnStatement(
    t.logicalExpression(
      "??",
      t.memberExpression(t.identifier("__instance"), t.identifier("__rsx_viewResult")),
      t.nullLiteral()
    )
  );
}

module.exports = {
  buildRuntimeSlots,
  buildLifecycleContext,
  buildRenderFunction,
  buildInitGuard,
  buildUserInitFunction,
  buildUpdateAndRender,
  buildTrackPropsStatements,
  buildFinalReturn
};
