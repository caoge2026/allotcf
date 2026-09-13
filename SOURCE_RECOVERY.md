# Recovered production source

Base commit: 412e48fa73b82f0f46453163865b9d703d6c798b
Captured production JAR SHA-256: 16d1f9d7784117ac4505bf3508cb13d2708ea8a2e8afad4b76212673441e56a8

This is a reconstructed source baseline, not the author's original unpublished source.
It preserves the captured production functionality and does not yet include the grammar-notes changes.

Build backend with Java 17: cd backend && mvn test package
Build frontend: cd frontend && npm ci && npm test && npm run build
On Node 25, use NODE_OPTIONS=--no-experimental-webstorage for jsdom tests.

No production credentials or database content are included. Do not run schema creation against production.
See the delivery's production-recovery.md and comparison reports for audit scope and migration limitations.
