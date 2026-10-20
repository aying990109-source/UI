export type ToolbarSizes = {
  width: number;
  create: number;
  fields: number[];
  query: number;
  reset: number;
  batch: number;
  actions: number[];
  filterButtons: number[];
  actionButton: number;
  mergedButton: number;
  keywordFirst?: boolean;
};

export type ToolbarLayout = {
  visibleFields: number;
  inlineActions: number;
  batchInline: boolean;
  commandsInline: boolean;
  merged: boolean;
};

export type ToolbarKind = 'create' | 'field' | 'filter' | 'query' | 'reset' | 'batch' | 'action' | 'operations';

export function selectFieldWidth(textWidth: number, multiple = false): number {
  return Math.min(multiple ? 280 : 240, Math.max(multiple ? 180 : 0, Math.ceil(textWidth) + 42));
}

export type FieldWidthSample = { text: string; probe: number; width: number };

export function fieldWidthForLayout(text: string, probe: number, actual: number | undefined, cached: FieldWidthSample | undefined, multiple = false): FieldWidthSample {
  if (actual) return { text, probe, width: actual };
  return cached?.text === text && cached.probe === probe ? cached : { text, probe, width: selectFieldWidth(probe, multiple) };
}

export function toolbarGap(previous: ToolbarKind | undefined, next: ToolbarKind, compact = false): number {
  if (!previous) return 0;
  if (compact && previous === 'create' && next === 'filter') return 8;
  if (previous === 'query' && next === 'reset') return 8;
  if (previous === 'field' && (next === 'field' || next === 'filter')) return 12;
  if ((previous === 'batch' || previous === 'action') && (next === 'action' || next === 'operations')) return 8;
  return 24;
}

export function toolbarRowWidth(sizes: ToolbarSizes, layout: ToolbarLayout): number {
  const row: Array<[ToolbarKind, number]> = [];
  if (sizes.create) row.push(['create', sizes.create]);
  const separateKeyword = sizes.keywordFirst && sizes.width < 650 && layout.visibleFields > 0;
  for (let index = separateKeyword ? 1 : 0; index < layout.visibleFields; index++) row.push(['field', sizes.fields[index]]);
  const hasFilter = layout.visibleFields < sizes.fields.length || !layout.commandsInline && !!(sizes.query || sizes.reset) || layout.merged;
  if (hasFilter) row.push(['filter', layout.merged ? sizes.mergedButton : sizes.filterButtons[layout.visibleFields]]);
  if (layout.commandsInline) {
    if (sizes.query) row.push(['query', sizes.query]);
    if (sizes.reset) row.push(['reset', sizes.reset]);
  }
  if (layout.batchInline && sizes.batch) row.push(['batch', sizes.batch]);
  for (let index = 0; index < layout.inlineActions; index++) row.push(['action', sizes.actions[index]]);
  if (!layout.merged && (layout.inlineActions < sizes.actions.length || sizes.batch && !layout.batchInline)) row.push(['operations', sizes.actionButton]);
  const rowWidth = row.reduce((sum, [kind, width], index) => sum + width + toolbarGap(row[index - 1]?.[0], kind, sizes.width < 400), 0);
  if (separateKeyword && sizes.width < 400 && layout.visibleFields === 1 && !layout.commandsInline && rowWidth > sizes.width) {
    return Math.max(sizes.fields[0], ...row.map(([, width]) => width));
  }
  return separateKeyword ? Math.max(sizes.fields[0], rowWidth) : rowWidth;
}

export function planToolbar(sizes: ToolbarSizes): ToolbarLayout {
  const layout: ToolbarLayout = {
    visibleFields: sizes.fields.length,
    inlineActions: sizes.actions.length,
    batchInline: !!sizes.batch,
    commandsInline: true,
    merged: false,
  };
  for (;;) {
    if (toolbarRowWidth(sizes, layout) <= sizes.width) return layout;
    if (layout.inlineActions) layout.inlineActions--;
    else if (layout.batchInline) layout.batchInline = false;
    else if (layout.visibleFields > (sizes.keywordFirst && sizes.width < 650 ? 1 : 0)) layout.visibleFields--;
    else if (layout.commandsInline && (sizes.query || sizes.reset)) layout.commandsInline = false;
    else if (layout.visibleFields) layout.visibleFields--;
    else if (!layout.merged && (sizes.actions.length || sizes.batch)) layout.merged = true;
    else return layout;
  }
}
