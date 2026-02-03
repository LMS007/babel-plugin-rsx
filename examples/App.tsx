import React, { useState } from "react";
import { Routes, Route, Navigate, useMatch, Link } from "react-router-dom";
import styles from "./App.module.css";
import { CodeViewer } from "./components/CodeViewer";
import { getFilename, getSourceCode } from "./utils/sourceLoader";

/**
 * NOTE:
 * For now we statically register examples.
 * Later this can be auto-generated via Vite glob imports.
 */
import timerManifest from "./stop-watch/manifest.json";
import PerformanceTest from "./stop-watch/PerformanceTest.tsx";
import ReactTimer from "./stop-watch/ReactExample.tsx";
import RsxTimer from "./stop-watch/RsxExample.rsx";

import ReactDataTable from "./data-table/ReactExample.tsx";
import RsxDataTable from "./data-table/RsxExample.rsx";

import ReactMultiComponent from "./multi-component/ReactExample.tsx";
import RsxMultiComponent from "./multi-component/RsxExample.rsx";

import ReactIntervalCounter from "./interval-counter/ReactExample.tsx";
import RsxIntervalCounter from "./interval-counter/RsxExample.rsx";

type Example = {
  id: string;
  name: string;
  description: string;
  Rsx: React.ComponentType<Record<string, unknown>>;
  React: React.ComponentType<Record<string, unknown>>;
  standalone?: boolean;
};

const EXAMPLES: Example[] = [
  {
    id: "stop-watch",
    name: timerManifest.name,
    description: timerManifest.description,
    Rsx: RsxTimer,
    React: ReactTimer,
  },
  {
    id: "performance-test",
    name: "Performance Test",
    description: "Benchmark React vs RSX render performance",
    Rsx: PerformanceTest,
    React: PerformanceTest,
    standalone: true,
  },
  {
    id: "data-table",
    name: "Data Table",
    description: "Compare React and RSX data table implementations.",
    Rsx: RsxDataTable,
    React: ReactDataTable,
  },
  {
    id: "multi-component",
    name: "Multi-Component",
    description: "Multiple RSX components in a single file.",
    Rsx: RsxMultiComponent,
    React: ReactMultiComponent,
  },
  {
    id: "interval-counter",
    name: "Interval Counter",
    description: "Minimal interval example to debug setInterval + render.",
    Rsx: RsxIntervalCounter,
    React: ReactIntervalCounter,
  },
];

type Tab = "demo" | "code";

export default function App() {
  return (
    <div className={styles.app}>
      {/* Sidebar / Index */}
      <aside className={styles.sidebar}>
        <h2>RSX vs TSX</h2>
        <ul className={styles.exampleList}>
          {EXAMPLES.map((ex) => (
            <SidebarItem key={ex.id} example={ex} />
          ))}
        </ul>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Navigate to={`/${EXAMPLES[0]?.id}`} replace />} />
          {EXAMPLES.map((ex) => (
            <Route
              key={ex.id}
              path={`/${ex.id}`}
              element={<ExampleView example={ex} />}
            />
          ))}
        </Routes>
      </main>
    </div>
  );
}

/* -------------------------------------------------- */
/* Sidebar Item */
/* -------------------------------------------------- */

function SidebarItem({ example }: { example: Example }) {
  const match = useMatch(`/${example.id}`);
  const isActive = match !== null;

  return (
    <li className={isActive ? styles.activeItem : undefined}>
      <Link to={`/${example.id}`}>
        <strong>{example.name}</strong>
        <p>{example.description}</p>
      </Link>
    </li>
  );
}

/* -------------------------------------------------- */
/* Example View */
/* -------------------------------------------------- */

function ExampleView({ example }: { example: Example }) {
  if (example.standalone) {
    return (
      <div className={styles.example} style={{ gridTemplateColumns: "1fr" }}>
        <example.Rsx />
      </div>
    );
  }

  return (
    <div className={styles.example}>
      <Panel title="RSX" Component={example.Rsx} exampleId={example.id} type="rsx" />
      <Panel title="React" Component={example.React} exampleId={example.id} type="react" />
    </div>
  );
}

/* -------------------------------------------------- */
/* Panel (Left / Right) */
/* -------------------------------------------------- */

function Panel({
  title,
  Component,
  exampleId,
  type,
}: {
  title: string;
  Component: React.ComponentType<Record<string, unknown>>;
  exampleId: string;
  type: "rsx" | "react";
}) {
  const [tab, setTab] = useState<Tab>("demo");

  return (
    <section className={styles.panel}>
      <header className={styles.panelHeader}>
        <h3>{title}</h3>
        <div className={styles.tabs}>
          <button
            className={tab === "demo" ? styles.activeTab : undefined}
            onClick={() => setTab("demo")}
          >
            Demo
          </button>
          <button
            className={tab === "code" ? styles.activeTab : undefined}
            onClick={() => setTab("code")}
          >
            Code
          </button>
        </div>
      </header>

      <div className={styles.panelBody}>
        {tab === "demo" ? (
          <Component label={`${title} Timer`} />
        ) : (
          <CodeViewer
            code={getSourceCode(exampleId, type)}
            language="tsx"
            filename={getFilename(exampleId, type)}
          />
        )}
      </div>
    </section>
  );
}
