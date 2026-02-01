// RSX Babel Plugin - Main Entry Point
// Orchestrates analysis, validation, and transformation phases

const isInternal = require("./utils/isInternal.cjs");
const isInstanceField = require("./utils/isInstanceField.cjs");
const ensureNamedImport = require("./utils/ensureNamedImport.cjs");

const {
  collectBannedHooks,
  identifyComponent,
  captureInstanceVar
} = require("./analyzeComponents.cjs");

const {
  validateComponentParams,
  validatePropsImmutable,
  warnPropsInRootScope
} = require("./validateComponents.cjs");

const {
  injectRuntimeCode,
  transformComponentFunction,
  removeInstanceVarDeclaration,
  rewriteInstanceAssignment,
  rewriteInstanceReference
} = require("./transformPublic.cjs");

module.exports = function ({ types: t }) {
  return {
    visitor: {
      Program: {
        enter(path, state) {
          state.bannedHooks = new Set();
          const filename = state.filename || "";

          // Only transform .rsx files
          if (!filename.endsWith(".rsx")) {
            state.skipRSX = true;
            return;
          }

          console.log("[RSX] Transforming", filename);

          // Prepare storage for this file
          state.rsx = {
            instanceVars: new Map(),
            componentPath: null,
          };
          ensureNamedImport(path, "react", ["useRef", "useState", "useEffect"], t);
        },

        exit(path, state) {
          injectRuntimeCode(state, t);
        },
      },

      FunctionDeclaration(path, state) {
        transformComponentFunction(path, state, t);
      },

      ExportDefaultDeclaration(path, state) {
        if (!state.rsx || state.skipRSX) return;

        // Analysis: identify the component
        const decl = identifyComponent(path, state, t);

        // Validation: check params
        if (decl) {
          const params = decl.node.params;
          const filename = state.filename || "unknown";
          validateComponentParams(params, filename, t);
        }
      },

      VariableDeclarator(path, state) {
        if (!state.rsx || state.skipRSX) return;

        // Analysis: capture instance var
        const captured = captureInstanceVar(path, state, t, isInternal);
        if (!captured) return;

        // Store the captured var
        state.rsx.instanceVars.set(captured.id.name, captured.init);

        // Transform: remove the declaration
        removeInstanceVarDeclaration(path);
      },

      AssignmentExpression(path, state) {
        if (!state.rsx || state.skipRSX) return;

        const { left, right } = path.node;

        // Validation: error on props mutation
        validatePropsImmutable(path, t);

        // From this point on, we only care about assignments to
        // RSX instance variables (persistent component state).
        if (!t.isIdentifier(left)) return;
        if (!isInstanceField(left.name, state)) return;

        // Validation: warn about props in root scope
        warnPropsInRootScope(path, state, t);

        // Transform: rewrite to __instance.x
        rewriteInstanceAssignment(path, t);
      },

      Identifier(path, state) {
        if (!state.rsx || state.skipRSX) return;
        if (!path.isReferencedIdentifier()) return;

        if (path.parentPath.isAssignmentExpression({ left: path.node })) {
          return;
        }

        const name = path.node.name;

        if (isInternal(name)) return;

        // Do not rewrite compiler internals
        if (name === "__instance") return;

        // Do not rewrite lifecycle function names - they are parameters now
        if (
          name === "view" ||
          name === "update" ||
          name === "destroy" ||
          name === "render" ||
          name === "props"
        ) {
          return;
        }

        // Only rewrite captured instance vars
        if (!state.rsx.instanceVars.has(name)) return;

        // Do not rewrite property keys: __instance.foo
        if (path.parentPath.isMemberExpression() && path.parentKey === "property") {
          return;
        }

        // Transform: rewrite to __instance.x
        rewriteInstanceReference(path, t);
      },

      ImportDeclaration(path, state) {
        if (!state.rsx || state.skipRSX) return;

        // Analysis: collect banned hooks
        collectBannedHooks(path, state, t);
      },

      CallExpression(path, state) {
        if (!state.rsx || state.skipRSX) return;

        if (path.node.__rsxInjected) return;

        const callee = path.get("callee");
        if (!callee.isIdentifier()) return;
        if (isInternal(callee.node.name)) return;
        // REMOVED until we can safely ignore the compiler-injected useEffect and useRef
        // (banned hooks warning logic was commented out in original)
      },
    },
  };
};
