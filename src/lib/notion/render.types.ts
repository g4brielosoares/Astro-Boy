export type RenderText = {
  text: string;
  href?: string | null;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
};

export type RenderNode =
  | { kind: "paragraph"; text: RenderText[] }
  | { kind: "heading-1"; text: RenderText[] }
  | { kind: "heading-2"; text: RenderText[] }
  | { kind: "heading-3"; text: RenderText[] }
  | { kind: "quote"; text: RenderText[] }
  | { kind: "divider" }
  | { kind: "bulleted-list"; items: RenderNode[] }
  | { kind: "numbered-list"; items: RenderNode[] }
  | { kind: "list-item"; text: RenderText[]; children?: RenderNode[] }
  | { kind: "todo"; text: RenderText[]; checked: boolean; children?: RenderNode[] }
  | { kind: "toggle"; text: RenderText[]; children?: RenderNode[] }
  | { kind: "callout"; text: RenderText[]; icon?: string; children?: RenderNode[] }
  | { kind: "code"; code: string; language?: string }
  | { kind: "image"; src: string; caption?: RenderText[] }
  | { kind: "video"; src: string; caption?: RenderText[] }
  | { kind: "embed"; url: string }
  | { kind: "bookmark"; url: string }
  | { kind: "file"; url: string; label: string }
  | { kind: "pdf"; url: string }
  | { kind: "table"; rows: RenderText[][][] }
  | { kind: "unsupported"; blockType: string };