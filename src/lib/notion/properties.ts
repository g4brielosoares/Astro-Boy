export function richTextToPlainText(richText: any[] = []): string {
  return richText.map((item) => item.plain_text ?? "").join("");
}

export function getTitle(prop: any): string {
  return prop?.type === "title" ? richTextToPlainText(prop.title) : "";
}

export function getRichText(prop: any): string {
  return prop?.type === "rich_text" ? richTextToPlainText(prop.rich_text) : "";
}

export function getMultiSelect(prop: any): string[] {
  return prop?.type === "multi_select"
    ? (prop.multi_select ?? []).map((item: any) => item.name)
    : [];
}

export function getUniqueId(prop: any): string {
  if (prop?.type !== "unique_id") return "";
  return `${prop.unique_id?.prefix ?? ""}${prop.unique_id?.number ?? ""}`;
}

export function getStatus(prop: any): string {
  return prop?.type === "status" ? prop.status?.name ?? "" : "";
}

export function getCreatedBy(prop: any): string {
  return prop?.type === "created_by" ? prop.created_by?.name ?? "" : "";
}

export function getLastEditedBy(prop: any): string {
  return prop?.type === "last_edited_by" ? prop.last_edited_by?.name ?? "" : "";
}

export function getCreatedTime(prop: any): string {
  return prop?.type === "created_time" ? prop.created_time ?? "" : "";
}

export function getLastEditedTime(prop: any): string {
  return prop?.type === "last_edited_time" ? prop.last_edited_time ?? "" : "";
}

export function getFileUrl(file: any): string {
  if (!file) return "";
  if (file.type === "file") return file.file?.url ?? "";
  if (file.type === "external") return file.external?.url ?? "";
  return "";
}

export function getCover(prop: any): string {
  if (prop?.type !== "files") return "";
  const firstFile = prop.files?.[0];
  return getFileUrl(firstFile);
}