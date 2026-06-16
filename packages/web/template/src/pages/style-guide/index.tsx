/**
 * /style-guide — design-system verification surface (Storybook substitute).
 * Lists every token swatch, all compact variants, and the composed component vocabulary by state.
 * Rule: when you add a composed component, register it here.
 */

import { useState } from "react";
import { toast } from "sonner";

import { BoolCell, DateCell, DeltaCell, EntityLink, MoneyCell, NumberCell, StatusBadge } from "@/components/composed/cells";
import { EmptyState } from "@/components/composed/empty-state";
import { FormRow } from "@/components/composed/form-field";
import { PageHeader } from "@/components/composed/page-header";
import { StatCard } from "@/components/composed/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const tokenSwatches = [
  ["--bg-app", "App background"],
  ["--bg-surface", "Surface"],
  ["--bg-sidebar", "Sidebar"],
  ["--fg-default", "Body"],
  ["--fg-muted", "Muted text"],
  ["--border-default", "Border"],
  ["--accent", "Accent"],
  ["--status-success", "Success"],
  ["--status-warning", "Warning"],
  ["--status-danger", "Danger"],
  ["--status-info", "Info"],
  ["--gain", "Gain (finance)"],
  ["--loss", "Loss (finance)"],
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">{children}</CardContent>
    </Card>
  );
}

export default function StyleGuidePage() {
  const [checked, setChecked] = useState(true);

  return (
    <div>
      <PageHeader title="Style guide" description="Design tokens, compact variants, and the composed-component vocabulary — codegen should only use this vocabulary." />

      <Section title="Color tokens (semantic)">
        {tokenSwatches.map(([token, label]) => (
          <div key={token} className="flex items-center gap-1.5">
            <span className="h-5 w-5 rounded border border-border" style={{ background: `rgb(var(${token}))` }} />
            <span className="text-caption text-fg-muted">
              {label} <code className="text-[11px]">{token}</code>
            </span>
          </div>
        ))}
      </Section>

      <Section title="Button — variant × state">
        <Button>Save changes</Button>
        <Button variant="outline">Cancel</Button>
        <Button variant="ghost">Secondary</Button>
        <Button variant="danger">Delete</Button>
        <Button variant="link">Link button</Button>
        <Button disabled>Saving...</Button>
        <Button variant="outline" disabled>
          Disabled
        </Button>
        <Button onClick={() => toast.success("Added.")}>Toast test</Button>
      </Section>

      <Section title="Inputs — compact (h-input 32px)">
        <div className="w-52">
          <Input placeholder="Default input" />
        </div>
        <div className="w-52">
          <Input placeholder="Error state" aria-invalid />
        </div>
        <div className="w-52">
          <Input placeholder="Disabled" disabled />
        </div>
        <div className="w-52">
          <Select defaultValue="">
            <option value="" disabled>
              Select an option
            </option>
            <option value="a">Option A</option>
            <option value="b">Option B</option>
          </Select>
        </div>
        <div className="w-52">
          <Textarea placeholder="Textarea" />
        </div>
        <label className="flex items-center gap-1.5 text-body">
          <Checkbox checked={checked} onCheckedChange={(c) => setChecked(c === true)} /> Checkbox
        </label>
        <Switch checked={checked} onCheckedChange={setChecked} aria-label="Switch" />
      </Section>

      <Section title="Form row (FormRow)">
        <div className="w-64">
          <FormRow label="Product name" required help="Shown to customers.">
            <Input placeholder="e.g. Premium 1 month" />
          </FormRow>
        </div>
        <div className="w-64">
          <FormRow label="Unit price" required error="Unit price must be 0 or greater.">
            <Input aria-invalid defaultValue="-100" />
          </FormRow>
        </div>
      </Section>

      <Section title="Badge / StatusBadge">
        <Badge>Default</Badge>
        <Badge tone="success">Success</Badge>
        <Badge tone="warning">Warning</Badge>
        <Badge tone="danger">Danger</Badge>
        <Badge tone="info">Info</Badge>
        <Badge tone="muted">Muted</Badge>
        <StatusBadge value="ready" display="Ready" />
        <StatusBadge value="processing" display="Processing" />
        <StatusBadge value="sent" display="Sent" />
        <StatusBadge value="canceled" display="Canceled" />
      </Section>

      <Section title="Cell vocabulary — Money/Number/Delta/Date/Entity/Bool">
        <div className="w-32 border border-dashed border-border p-1">
          <MoneyCell value={1250000} />
        </div>
        <div className="w-24 border border-dashed border-border p-1">
          <NumberCell value={98432} />
        </div>
        <div className="w-28 border border-dashed border-border p-1">
          <DeltaCell value={12.5} percent />
        </div>
        <div className="w-28 border border-dashed border-border p-1">
          <DeltaCell value={-3.2} percent />
        </div>
        <div className="w-36 border border-dashed border-border p-1">
          <DateCell value={new Date().toISOString()} />
        </div>
        <div className="w-28 border border-dashed border-border p-1">
          <EntityLink model="auth.User" pk={1} label="Jane Doe" />
        </div>
        <div className="border border-dashed border-border p-1">
          <BoolCell value={true} />
        </div>
        <div className="border border-dashed border-border p-1">
          <BoolCell value={false} />
        </div>
      </Section>

      <Section title="StatCard / EmptyState">
        <div className="w-56">
          <StatCard label="Total users" value={12345} delta={42} />
        </div>
        <div className="w-56">
          <StatCard label="Orders today" value={8} delta={-3} />
        </div>
        <div className="w-72 rounded border border-dashed border-border">
          <EmptyState message="No products yet. Add the first one." action={<Button>Add product</Button>} />
        </div>
      </Section>
    </div>
  );
}
