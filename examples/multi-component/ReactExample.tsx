import React from "react";

/**
 * Multi-Component React Example
 * 
 * React equivalent of the multi-component RSX example.
 */

// Helper function
function formatLabel(text: string): string {
  return text.toUpperCase();
}

// Simple badge component
function Badge({ color = "#007bff", children }: { color?: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: "bold",
        backgroundColor: color,
        color: "#fff",
      }}
    >
      {children}
    </span>
  );
}

// Card component that uses Badge
function Card({
  title,
  badge,
  badgeColor,
  children,
}: {
  title: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        backgroundColor: "#fff",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <h4 style={{ color: "#555", margin: 0 }}>{formatLabel(title)}</h4>
        {badge && <Badge color={badgeColor}>{badge}</Badge>}
      </div>
      <p style={{ margin: 0, color: "#666" }}>{children}</p>
    </div>
  );
}

// Main component that composes Card and Badge
export default function MultiComponentDemo() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 400 }}>
      <h3>Multi-Component Example</h3>

      <Card title="Welcome" badge="New" badgeColor="#28a745">
        This card uses the Badge component defined in the same file.
      </Card>

      <Card title="Features" badge="RSX" badgeColor="#007bff">
        Multiple components can share helper functions like formatLabel().
      </Card>

      <Card title="Simple">Cards without badges work too!</Card>
    </div>
  );
}
