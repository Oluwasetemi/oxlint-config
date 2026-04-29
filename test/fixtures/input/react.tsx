// Intentional violations for react preset fixture
// react/jsx-key (correctness/error) — missing key prop in iterator
export function List({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map(item => <li>{item}</li>)}
    </ul>
  )
}
