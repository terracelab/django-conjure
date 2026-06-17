/** Conjure API response contract types — 1:1 with the backend conjure api app (do not change). */

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface FieldSchema {
  name: string;
  type: string; // Django field class name (CharField, ForeignKey, ...)
  verbose_name: string;
  required: boolean;
  editable: boolean;
  null: boolean;
  max_length?: number;
  choices?: [string | number, string][];
  related_model?: string;
  related_search_fields?: string[];
  upload?: "image" | "file";
  max_digits?: number;
  decimal_places?: number;
  help_text?: string;
  default?: string | number | boolean;
}

export interface ModelPermissions {
  view: boolean;
  add: boolean;
  change: boolean;
  delete: boolean;
}

export interface InlineSchema {
  model: string;
  fk_field: string;
  verbose_name: string;
}

export interface ModelSchema {
  model: string;
  app_label: string;
  model_name: string;
  verbose_name: string;
  verbose_name_plural: string;
  pk_field: string;
  fields: FieldSchema[];
  list_display: string[];
  search_fields: string[];
  list_filter: string[];
  ordering: string[];
  readonly_fields: string[];
  is_readonly: boolean;
  inlines: InlineSchema[];
  permissions: ModelPermissions;
  /** Custom actions (CONJURE AdminConfig.actions) run on selected rows. */
  actions: ActionSpec[];
}

export interface ActionSpec {
  name: string;
  label: string;
  destructive: boolean;
}

/** Public dashboard config (GET /config/) — drives the header title + accent. */
export interface ConjureConfig {
  brand: { name: string; accent: string };
  auth: string;
}

export interface ModelSummary {
  model: string;
  app_label: string;
  verbose_name: string;
  verbose_name_plural: string;
  is_readonly: boolean;
  permissions: ModelPermissions;
  /** Sidebar group label (from CONJURE["APP_GROUPS"]; defaults to app_label). */
  group: string;
  /** Group ordering key (position in APP_GROUPS; unlisted apps sort last). */
  group_order: number;
  /** Section main model key (from CONJURE["SECTIONS"]). Only the main shows in the sidebar;
   *  members are tabs on the main's page. Standalone models are their own section. */
  section: string;
  /** Tab order within the section (main = 0). */
  section_order: number;
}

export interface AutocompleteItem {
  value: number | string;
  label: string;
}

export interface AutocompleteResponse {
  results: AutocompleteItem[];
  has_more: boolean;
}

export interface RelatedSummary {
  related: { model: string; verbose_name: string; count: number }[];
}

export interface AdminUser {
  id: number;
  username: string;
  nickname: string | null;
  real_name: string | null;
  is_superuser: boolean;
}

/** Common to every record — the backend serializer attaches _label / {fk}_label / {choices}_display. */
export interface BaseRecord {
  [key: string]: unknown;
  _label?: string;
}

export type ListParams = Record<string, string | number | boolean | undefined>;

export interface BulkActionBody {
  action: "delete" | "update";
  ids: (number | string)[];
  data?: Record<string, unknown>;
}

export interface BulkOperationsBody {
  operations: { op: "create" | "update" | "delete"; pk?: number | string; data?: Record<string, unknown> }[];
}
