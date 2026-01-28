import { useMemo, useState, useEffect } from "react";

type Row = {
  id: number;
  name: string;
  email: string;
  age: number;
  score: number;
};

// ---- mock data generation ----
function generateData(count = 10_000) {
  const rows: Row[] = [];
  for (let i = 0; i < count; i++) {
    rows.push({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      age: 18 + (i % 50),
      score: Math.floor(Math.random() * 1000)
    });
  }
  return rows;
}

const DATA = generateData();

// ---- DataTable component ----
export default function DataTableDemo() {
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<keyof Row>("id");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(100);
  const [selectedIds, setSelectedIds] = useState(() => new Set<number>());

  // ---- filtering ----
  const filtered = useMemo(() => {
    if (!filter) return DATA;
    const f = filter.toLowerCase();
    return DATA.filter(
      r =>
        r.name.toLowerCase().includes(f) ||
        r.email.toLowerCase().includes(f)
    );
  }, [filter]);

  // ---- sorting ----
  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const v1 = a[sortKey];
      const v2 = b[sortKey];
      if (v1 < v2) return sortDir === "asc" ? -1 : 1;
      if (v1 > v2) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  // ---- pagination ----
  const paged = useMemo(() => {
    const start = page * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  // ---- effects that scale with usage ----
  useEffect(() => {
    // simulate syncing to URL / analytics
    // (this fires often in real apps)
    // console.log("Table state changed");
  }, [filter, sortKey, sortDir, page]);

  // ---- handlers ----
  const toggleSort = (key: keyof Row) => {
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleRow = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalPages = Math.ceil(sorted.length / pageSize);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", flexGrow: 1 }}>
      <h2>DataTable Demo (10,000 rows)</h2>

      <input
        placeholder="Filter by name or email"
        value={filter}
        onChange={e => {
          setFilter(e.target.value);
          setPage(0);
        }}
        style={{ marginBottom: 10, padding: 6, width: 300 }}
      />

      <table width="100%" border={1} cellPadding="6">
        <thead>
          <tr>
            <th />
            <th onClick={() => toggleSort("id")}>ID</th>
            <th onClick={() => toggleSort("name")}>Name</th>
            <th onClick={() => toggleSort("email")}>Email</th>
            <th onClick={() => toggleSort("age")}>Age</th>
            <th onClick={() => toggleSort("score")}>Score</th>
          </tr>
        </thead>
        <tbody>
          {paged.map(row => (
            <tr key={row.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.has(row.id)}
                  onChange={() => toggleRow(row.id)}
                />
              </td>
              <td>{row.id}</td>
              <td>{row.name}</td>
              <td>{row.email}</td>
              <td>{row.age}</td>
              <td>{row.score}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 10 }}>
        <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>
          Prev
        </button>
        <span style={{ margin: "0 10px" }}>
          Page {page + 1} / {totalPages}
        </span>
        <button
          disabled={page + 1 >= totalPages}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </button>
      </div>

      <div style={{ marginTop: 10 }}>
        Selected rows: {selectedIds.size}
      </div>
    </div>
  );
}
