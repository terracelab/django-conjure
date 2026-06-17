/**
 * Section tab bar — navigate between sibling models of the same section from a list page.
 * django-unfold-style IA: the main model takes one sidebar row; ancillary models are tabs here.
 * The router (assemble.py output) wraps each model list route with this component.
 */

import { Link } from "react-router-dom";

import { type SectionTab, sectionForModel } from "@/layouts/sections";
import { cn } from "@/lib/utils";

/**
 * `tabs` overrides the codegen `sections.ts` map — runtime pages (GenericModelPage) pass tabs
 * built live from the schema API (CONJURE["SECTIONS"]); codegen pages omit it and use the map.
 */
export function SectionTabs({ model, tabs: tabsProp, children }: { model: string; tabs?: SectionTab[]; children: React.ReactNode }) {
  const tabs = tabsProp ?? sectionForModel[model]?.tabs;
  // Single-model sections render without a tab bar.
  if (!tabs || tabs.length <= 1) return <>{children}</>;

  return (
    <div>
      <div className="mb-3 flex items-center gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tab) => {
          const active = tab.model === model;
          return (
            <Link
              key={tab.model}
              to={tab.to}
              className={cn(
                "-mb-px shrink-0 border-b-2 px-3 py-1.5 text-body transition-colors",
                active ? "border-accent font-medium text-accent" : "border-transparent text-fg-muted hover:text-fg-default",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
