// DataTable.rsx

function generateData(count = 10_000) {
  const rows = [];
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

export default function DataTableRSX({ view, render }) {
  // -----------------------------
  // state
  // -----------------------------
  let filter = "";
  let sortKey = "id";
  let sortDir = "asc";
  let page = 0;
  const pageSize = 100;
  let selectedIds = new Set();

  // -----------------------------
  // derived data
  // -----------------------------
  let filtered = DATA;
  let sorted = DATA;
  let paged = [];

  function recompute() {
    if (filter) {
      const f = filter.toLowerCase();
      filtered = DATA.filter(
        r =>
          r.name.toLowerCase().includes(f) ||
          r.email.toLowerCase().includes(f)
      );
    } else {
      filtered = DATA;
    }

    sorted = filtered.sort((a, b) => {
      const v1 = a[sortKey];
      const v2 = b[sortKey];
      if (v1 < v2) return sortDir === "asc" ? -1 : 1;
      if (v1 > v2) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    const start = page * pageSize;
    paged = sorted.slice(start, start + pageSize);
  }


  // -----------------------------
  // handlers
  // -----------------------------
  function toggleSort(key) {
    if (sortKey === key) {
      sortDir = sortDir === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      sortDir = "asc";
    }
    page = 0;
    render();
  }

  function toggleRow(id) {
    selectedIds = new Set(selectedIds);
    selectedIds.has(id) ? selectedIds.delete(id) : selectedIds.add(id);
    render();
  }

  function setFilter(value) {
    filter = value;
    page = 0;
    render();
  }

  function nextPage() {
    page++;
    render();
  }

  function prevPage() {
    page--;
    render();
  }

  // -----------------------------
  // view
  // -----------------------------
  view(() => {
    recompute();
    const totalPages = Math.ceil(sorted.length / pageSize);

    return (
      <div style={{ padding: 20, fontFamily: "sans-serif", flexGrow: 1 }}>
        <h2>DataTable Demo (RSX)</h2>

        <input
          placeholder="Filter by name or email"
          value={filter}
          onInput={e => setFilter(e.target.value)}
          style={{ marginBottom: 10, padding: 6, width: 300 }}
        />

        <table width="100%" border="1" cellPadding="6">
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
          <button disabled={page === 0} onClick={prevPage}>
            Prev
          </button>
          <span style={{ margin: "0 10px" }}>
            Page {page + 1} / {totalPages}
          </span>
          <button
            disabled={page + 1 >= totalPages}
            onClick={nextPage}
          >
            Next
          </button>
        </div>

        <div style={{ marginTop: 10 }}>
          Selected rows: {selectedIds.size}
        </div>
      </div>
    );
  });
}
