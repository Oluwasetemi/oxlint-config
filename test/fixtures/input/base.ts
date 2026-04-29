// Intentional violations for base preset fixture
// no-debugger (correctness/error) — auto-fixable: removes the statement
debugger;

export function greet(name: string): string {
  return `Hello, ${name}!`
}
