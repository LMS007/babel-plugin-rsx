// Utility: ensureNamedImport
// Ensures that the specified named imports exist in the program
module.exports = function ensureNamedImport(programPath, source, names, t) {
  let importDecl = programPath.node.body.find(
    (n) => t.isImportDeclaration(n) && n.source.value === source
  );

  if (!importDecl) {
    importDecl = t.importDeclaration([], t.stringLiteral(source));
    programPath.node.body.unshift(importDecl);
  }

  const existing = new Set(
    importDecl.specifiers
      .filter((s) => t.isImportSpecifier(s))
      .map((s) => (t.isIdentifier(s.imported) ? s.imported.name : s.imported.value))
  );

  for (const name of names) {
    if (!existing.has(name)) {
      importDecl.specifiers.push(t.importSpecifier(t.identifier(name), t.identifier(name)));
    }
  }
};
