/**
 * Multi-Component RSX Example
 * 
 * Demonstrates multiple RSX components in a single file.
 * All uppercase functions are automatically detected as RSX components.
 */
import type  { ReactNode } from "react";
import React from "react";
import { Ctx, RSX } from "../../src/types";

// Helper function (lowercase - not transformed)
function formatLabel(text: string) {
  return text.toUpperCase();
}


type BadgeProps = {
  color?: string;
  children: ReactNode;
};

// Simple badge component
const Badge = RSX<BadgeProps>(({ view }) => {
  view((props) => (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: "bold",
        backgroundColor: props.color || "#007bff",
        color: "#fff",
      }}
    >
      {props.children}
    </span>
  ));
});

type CardProps = {
  title: string;
  badge?: string;
  badgeColor?: string;
  children?: ReactNode;
  ref?: React.Ref<HTMLDivElement>;
};

// Card component that uses Badge
const Card = RSX<CardProps>( ({ view }) => {
  view((props) => (
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
      <div ref={props.ref} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <h4 style={{ margin: 0, color: "#555" }}>{formatLabel(props.title)}</h4>
        {props.badge && <Badge color={props.badgeColor}>{props.badge}</Badge>}
      </div>
      <p style={{ margin: 0, color: "#666" }}>{props.children}</p>
    </div>
  ));
});


// Main component that composes Card and Badge
export default function MultiComponentDemo({ view }: Ctx) {
  /*let cardRef: React.Ref<HTMLDivElement> = null;
  setTimeout(() => {
    if (cardRef) {
      console.log("Card ref element:", cardRef);
    }
  }, 1000);*/

  view(() => (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 400 }}>
      <h3>Multi-Component Example</h3>
      
      <Card title="Welcome" badge="New" badgeColor="#28a745">
        This card uses the Badge component defined in the same file.
      </Card>
      <Card title="Features" badge="RSX" badgeColor="hsl(211, 100%, 50%)">
        Multiple components can share helper functions like formatLabel().
      </Card>
      
      <Card title="Simple">
        Cards without badges work too!
      </Card>
    </div>
  ));
}
