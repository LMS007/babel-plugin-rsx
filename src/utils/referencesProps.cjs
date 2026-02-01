// Utility: referencesProps
// Walks an AST node to determine if it references 'props'
module.exports = function referencesProps(node, t) {
  let found = false;

  function walk(n) {
    if (!n || found) return;

    if (t.isIdentifier(n, { name: "props" })) {
      found = true;
      return;
    }

    for (const key in n) {
      const val = n[key];
      if (Array.isArray(val)) val.forEach(walk);
      else if (val && typeof val === "object") walk(val);
    }
  }

  walk(node);
  return found;
};
