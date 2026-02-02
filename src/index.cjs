// RSX Babel Plugin - Main Entry Point
// Orchestrates analysis, validation, and transformation phases

const isInternal = require("./utils/isInternal.cjs");
const ensureNamedImport = require("./utils/ensureNamedImport.cjs");

const {
  collectBannedHooks,
  identifyComponent,
  isRSXComponent,
  registerComponent,
  getComponentData,
  findContainingComponent,
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

          // Prepare storage for this file - now supports multiple components
          state.rsx = {
            components: new Map(),  // fnNode -> { name, path, instanceVars }
            // Legacy fields for backward compatibility during transition
            instanceVars: new Map(),
            componentPath: null,
          };
          ensureNamedImport(path, "react", ["useRef", "useState", "useEffect"], t);
        },

        exit(path, state) {
          injectRuntimeCode(state, t);
        },
      },

      FunctionDeclaration: {
        enter(path, state) {
          if (!state.rsx || state.skipRSX) return;
          
          // Check if this is an RSX component (name starts with uppercase)
          if (isRSXComponent(path, t)) {
            // Register the component early so VariableDeclarator can find it
            // Pass t so we can collect local bindings
            registerComponent(path, state, t);
            
            // Legacy: also set componentPath for backward compatibility
            state.rsx.componentPath = path;
          }
        },
        
        exit(path, state) {
          if (!state.rsx || state.skipRSX) return;
          
          // Transform happens on exit, after all child nodes (variables) are visited
          transformComponentFunction(path, state, t);
        }
      },

      ExportDefaultDeclaration(path, state) {
        if (!state.rsx || state.skipRSX) return;

        // For export default function declarations, they're already registered
        // in FunctionDeclaration visitor if they have uppercase names.
        // This handles validation for the exported component.
        const decl = path.get("declaration");

        if (
          decl.isFunctionDeclaration() ||
          decl.isFunctionExpression() ||
          decl.isArrowFunctionExpression()
        ) {
          const params = decl.node.params;
          const filename = state.filename || "unknown";
          validateComponentParams(params, filename, t);
        }
      },

      VariableDeclarator(path, state) {
        if (!state.rsx || state.skipRSX) return;

        // Analysis: capture instance var (now returns component reference)
        const captured = captureInstanceVar(path, state, t, isInternal);
        if (!captured) return;

        // Store the captured var in the component's instanceVars
        captured.component.instanceVars.set(captured.id.name, captured.init);
        
        // Legacy: also store in global instanceVars for backward compatibility
        state.rsx.instanceVars.set(captured.id.name, captured.init);

        // Transform: remove the declaration (or convert to assignment if needed)
        removeInstanceVarDeclaration(path, captured.component, t);
      },

      AssignmentExpression(path, state) {
        if (!state.rsx || state.skipRSX) return;

        const { left, right } = path.node;

        // Validation: error on props mutation
        validatePropsImmutable(path, t);

        // From this point on, we only care about assignments to
        // RSX instance variables (persistent component state).
        if (!t.isIdentifier(left)) return;
        
        // Find which component we're in
        const component = findContainingComponent(path, state);
        if (!component) return;
        
        // Check if this is an instance field for this component
        if (!component.instanceVars.has(left.name)) return;

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

        // Find which component we're in
        const component = findContainingComponent(path, state);
        if (!component) return;

        // Only rewrite captured instance vars for this component
        if (!component.instanceVars.has(name)) return;

        // Do not rewrite non-computed property keys: __instance.foo
        // But DO rewrite computed property keys: a[sortKey] -> a[__instance.sortKey]
        if (path.parentPath.isMemberExpression() && path.parentKey === "property" && !path.parent.computed) {
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
