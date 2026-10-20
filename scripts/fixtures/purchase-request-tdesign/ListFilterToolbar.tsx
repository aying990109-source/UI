import { Children, Fragment, cloneElement, isValidElement, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { Button, DateRangePicker, Select } from 'tdesign-react';
import { ChevronDownIcon } from 'tdesign-icons-react';
import { fieldWidthForLayout, planToolbar, toolbarGap, type FieldWidthSample, type ToolbarKind, type ToolbarLayout, type ToolbarSizes } from './list-filter-toolbar-layout';
import { datePresetNames, datePresetRanges, matchingDatePreset } from './date-range-presets';

type Props = { fields: ReactNode; active?: boolean[]; create?: ReactNode; query?: ReactNode; reset?: ReactNode; actions?: ReactNode; fileActions?: ReactNode; batch?: ReactNode };

function items(node: ReactNode): ReactNode[] {
  return Children.toArray(node).flatMap(child => isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment ? items(child.props.children) : [child]);
}

function hasValue(node: ReactNode): boolean {
  if (!isValidElement(node)) return false;
  const props = node.props as { value?: unknown; children?: ReactNode };
  if (props.value !== undefined) return Array.isArray(props.value) ? props.value.length > 0 : props.value !== '' && props.value !== null && props.value !== 'all' && props.value !== '全部';
  return Children.toArray(props.children).some(hasValue);
}

function plainText(node: ReactNode): string {
  return Children.toArray(node).map(child => typeof child === 'string' || typeof child === 'number' ? String(child) : isValidElement<{ children?: ReactNode }>(child) ? plainText(child.props.children) : '').join('').trim();
}

function fieldTitle(field: ReactNode): string {
  if (!isValidElement<{ children?: ReactNode }>(field)) return '';
  const title = items(field.props.children).find(child => isValidElement(child) && child.type === 'span');
  return isValidElement<{ children?: ReactNode }>(title) ? plainText(title.props.children) : '';
}

function fieldSelect(field: ReactNode): ReactElement<Record<string, unknown>> | undefined {
  if (!isValidElement<{ children?: ReactNode }>(field)) return undefined;
  return items(field.props.children).find(child => isValidElement(child) && child.type === Select) as ReactElement<Record<string, unknown>> | undefined;
}

function selectText(field: ReactNode): string {
  const select = fieldSelect(field);
  if (!select) return '';
  const value = select.props.value;
  const values = Array.isArray(value) ? value : [value];
  const options = (select.props.options as Array<{ value?: unknown; label?: ReactNode }> | undefined) ?? [];
  const selected = values.filter(item => item !== undefined && item !== null && item !== '');
  if (!selected.length) {
    const placeholder = String(select.props.placeholder ?? '');
    return !placeholder || ['全部', '全部类型', '全部状态', '全部资料'].includes(placeholder) ? `全部${fieldTitle(field)}` : placeholder;
  }
  const names = selected.map(item => plainText(options.find(option => option.value === item)?.label ?? String(item)));
  return `${fieldTitle(field)} · ${Array.isArray(value) ? `${names[0]}${names.length > 1 ? ` +${names.length - 1}` : ''}` : names[0]}`;
}

function NamedDateRange({ control, title }: { control: ReactElement<Record<string, unknown>>; title: string }) {
  const wrapper = useRef<HTMLSpanElement>(null);
  const [, refreshPresets] = useState(0);
  const [popupVisible, setPopupVisible] = useState(false);
  const [pickerVersion, resetPicker] = useState(0);
  const [picking, setPicking] = useState(false);
  const [placement, setPlacement] = useState<'bottom-left' | 'top-left'>('bottom-left');
  const [availableHeight, setAvailableHeight] = useState(window.innerHeight - 16);
  const prefix = title.replace(/日期$/, '');
  useLayoutEffect(() => {
    const node = wrapper.current;
    if (!node) return;
    const nameInputs = () => node.querySelectorAll('input').forEach((input, index) => {
      const name = `${prefix}${index ? '结束' : '开始'}日期`;
      if (input.getAttribute('aria-label') !== name) input.setAttribute('aria-label', name);
    });
    nameInputs();
    const observer = new MutationObserver(nameInputs);
    observer.observe(node, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [prefix]);
  const visibleSuffix = prefix.length > 2 ? '' : '日期';
  const popupProps = (control.props.popupProps as Record<string, unknown> | undefined) ?? {};
  const overlayClassName = `${String(popupProps.overlayClassName ?? '')} list-toolbar-date-popup`.trim();
  const overlayStyle = (trigger: HTMLElement, popup: HTMLElement) => ({
    ...(typeof popupProps.overlayStyle === 'function' ? popupProps.overlayStyle(trigger, popup) : popupProps.overlayStyle as object | undefined),
    maxWidth: 'calc(100vw - 16px)',
    maxHeight: `${Math.max(180, window.innerHeight - 16)}px`,
  });
  const overlayInnerStyle = (trigger: HTMLElement, popup: HTMLElement) => ({
    width: 'auto',
    ...(typeof popupProps.overlayInnerStyle === 'function' ? popupProps.overlayInnerStyle(trigger, popup) : popupProps.overlayInnerStyle as object | undefined),
    maxHeight: `${availableHeight}px`,
    overflowY: 'auto' as const,
  });
  const ranges = datePresetRanges();
  const selected = picking ? -1 : matchingDatePreset(control.props.value, ranges);
  const closePopup = (trigger: string) => {
    setPopupVisible(false);
    setPicking(false);
    resetPicker(value => value + 1);
    (popupProps.onVisibleChange as ((visible: boolean, context: { trigger: string }) => void) | undefined)?.(false, { trigger });
    requestAnimationFrame(() => wrapper.current?.querySelector<HTMLInputElement>('input')?.focus());
  };
  const choose = (index: number, e: React.MouseEvent<HTMLButtonElement>) => {
    const next = datePresetRanges()[index];
    (control.props.onChange as (value: string[]) => void)?.(next);
    closePopup('preset');
    (control.props.onPresetClick as ((context: { e: React.MouseEvent<HTMLButtonElement>; preset: Record<string, string[]> }) => void) | undefined)?.({ e, preset: { [datePresetNames[index]]: next } });
  };
  const presets = <div className="list-date-presets" role="group" aria-label="快捷日期范围">{datePresetNames.map((name, index) => <button key={name} type="button" className={selected === index ? 'is-selected' : ''} aria-pressed={selected === index} onClick={event => choose(index, event)}>{name}</button>)}</div>;
  return <span className="toolbar-date-range" ref={wrapper} onKeyDownCapture={event => {
    if (event.key !== 'Escape' || !popupVisible) return;
    event.preventDefault(); event.stopPropagation();
    closePopup('escape');
  }}>{cloneElement(control, { key: pickerVersion, placeholder: [`${prefix}开始${visibleSuffix}`, `${prefix}结束${visibleSuffix}`], presets, presetsPlacement: 'left', onPick: (...args: unknown[]) => { setPicking(true); (control.props.onPick as ((...args: unknown[]) => void) | undefined)?.(...args); }, popupProps: { ...popupProps, visible: popupVisible, placement, overlayClassName, overlayStyle, overlayInnerStyle, onVisibleChange: (visible: boolean, context: unknown) => {
    (popupProps.onVisibleChange as ((visible: boolean, context: unknown) => void) | undefined)?.(visible, context);
    setPopupVisible(visible);
    if (!visible) setPicking(false);
    if (visible) {
      const rect = wrapper.current?.getBoundingClientRect();
      if (rect) {
        const below = window.innerHeight - rect.bottom - 8, above = rect.top - 8;
        const openAbove = below < 300 && above > below;
        setPlacement(openAbove ? 'top-left' : 'bottom-left');
        setAvailableHeight(Math.max(40, openAbove ? above : below));
      }
      refreshPresets(value => value + 1);
    }
  } } })}</span>;
}

function preparedField(field: ReactNode, compact: boolean): ReactNode {
  if (!isValidElement<{ children?: ReactNode }>(field) || field.type !== 'label') return field;
  const title = fieldTitle(field);
  return cloneElement(field, { children: items(field.props.children).map((child, index) => {
    if (!isValidElement<Record<string, unknown>>(child)) return child;
    if (child.type === Select) {
      const placeholder = String(child.props.placeholder ?? '');
      const ambiguous = !placeholder || ['全部', '全部类型', '全部状态', '全部资料'].includes(placeholder);
      const selected = child.props.value !== undefined && child.props.value !== null && child.props.value !== '';
      return cloneElement(child, { key: index, autoWidth: !child.props.multiple, minCollapsedNum: child.props.multiple ? 1 : child.props.minCollapsedNum, placeholder: ambiguous ? `全部${title}` : placeholder, label: compact && selected && !child.props.multiple ? <span aria-hidden="true">{title} ·</span> : undefined });
    }
    if (child.type === DateRangePicker) {
      return <NamedDateRange key={index} control={child} title={title} />;
    }
    return child;
  }) });
}

function outline(node: ReactNode): ReactNode {
  return isValidElement<{ theme?: 'default' | 'primary'; variant?: 'outline' | 'base' | 'text' }>(node) ? cloneElement(node, { theme: 'default', variant: 'outline' }) : node;
}

function fallbackFieldWidth(field: ReactNode): number {
  return isValidElement<{ className?: string }>(field) && field.props.className?.includes('keyword-filter') ? 220 : isValidElement<{ className?: string }>(field) && field.props.className?.includes('date-filter') ? 260 : 160;
}

function probe(node: ReactNode): ReactNode {
  return isValidElement<{ type?: string; onClick?: unknown; tabIndex?: number }>(node) ? cloneElement(node, { type: 'button', onClick: undefined, tabIndex: -1 }) : node;
}

export function ListFilterToolbar({ fields: fieldNodes, active, create, query, reset, actions: actionNodes, fileActions, batch }: Props) {
  const fields = items(fieldNodes);
  const keywordFirst = isValidElement<{ className?: string }>(fields[0]) && !!fields[0].props.className?.includes('keyword-filter');
  const actions = items(actionNodes).map(outline);
  active ??= fields.map(hasValue);
  if (query && isValidElement<{ theme?: 'default' | 'primary'; variant?: 'outline' | 'base' | 'text' }>(query)) query = cloneElement(query, { theme: 'primary', variant: create ? 'outline' : 'base' });
  if (reset && isValidElement<{ theme?: 'default' | 'primary'; variant?: 'outline' | 'base' | 'text' }>(reset)) reset = cloneElement(reset, { theme: 'default', variant: 'text' });
  const batchButton = items(batch)[0];
  const availableBatch = isValidElement<{ disabled?: boolean }>(batchButton) && !batchButton.props.disabled ? outline(batchButton) : undefined;
  const root = useRef<HTMLDivElement>(null);
  const fieldWidthCache = useRef<FieldWidthSample[]>([]);
  const filterButton = useRef<HTMLButtonElement>(null);
  const actionButton = useRef<HTMLButtonElement>(null);
  const [measured, setMeasured] = useState(0);
  const [layout, setLayout] = useState<ToolbarLayout>({ visibleFields: fields.length, inlineActions: actions.length, batchInline: !!availableBatch, commandsInline: true, merged: false });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const visibleFields = Math.min(layout.visibleFields, fields.length);
  const inlineActions = Math.min(layout.inlineActions, actions.length);
  const hiddenFields = fields.slice(visibleFields);
  const hiddenActions = [...(availableBatch && !layout.batchInline ? [availableBatch] : []), ...actions.slice(inlineActions)];
  const selected = active.slice(visibleFields).filter(Boolean).length;
  const countText = (count: number) => count ? measured < 400 ? String(count) : `（${count}）` : '';
  const filterLabel = (count: number) => { const activeCount = active.slice(count).filter(Boolean).length; return `${count ? '更多筛选' : '筛选'}${countText(activeCount)}`; };
  const showFilter = hiddenFields.length > 0 || !layout.commandsInline && !!(query || reset) || layout.merged;

  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return;
    const measure = (selector: string, fallback: number) => node.querySelector<HTMLElement>(selector)?.getBoundingClientRect().width || fallback;
    const update = () => {
      const next = node.getBoundingClientRect().width;
      if (!next) return;
      const sizes: ToolbarSizes = {
        width: next, keywordFirst, create: create ? measure('[data-create-probe]', 140) : 0,
        fields: fields.map((field, index) => {
          const select = fieldSelect(field);
          if (!select) return fallbackFieldWidth(field);
          const probe = measure(`[data-field-text-probe="${index}"]`, 88);
          const text = selectText(field);
          const actual = node.querySelector<HTMLElement>(`[data-toolbar-field="${index}"]`)?.getBoundingClientRect().width;
          const sample = fieldWidthForLayout(text, probe, actual, fieldWidthCache.current[index], !!select.props.multiple);
          if (actual) fieldWidthCache.current[index] = sample;
          return sample.width;
        }),
        query: query ? measure('[data-query-probe]', 76) : 0, reset: reset ? measure('[data-reset-probe]', 48) : 0,
        batch: availableBatch ? measure('[data-batch-probe]', 120) : 0,
        actions: actions.map((_, index) => measure(`[data-action-width-probe="${index}"]`, 120)),
        filterButtons: Array.from({ length: fields.length + 1 }, (_, index) => measure(`[data-filter-probe="${index}"]`, 120)),
        actionButton: measure('[data-action-probe]', 110), mergedButton: measure('[data-merged-probe]', 86),
      };
      const planned = planToolbar(sizes);
      const layoutChanges = Object.keys(planned).some(key => layout[key as keyof ToolbarLayout] !== planned[key as keyof ToolbarLayout]);
      const closesPopup = (filtersOpen || actionsOpen) && Math.abs(next - measured) > 1;
      const focused = document.activeElement as HTMLElement | null;
      const focusInToolbar = !!focused && node.contains(focused) && !node.querySelector('.list-filter-measure')?.contains(focused);
      const wasAction = !!focused?.closest('.list-filter-operations, .list-filter-action, .list-filter-batch, .list-filter-merged-actions');
      if (closesPopup) {
        setFiltersOpen(false); setActionsOpen(false);
      }
      setMeasured(next);
      setLayout(previous => Object.keys(planned).every(key => previous[key as keyof ToolbarLayout] === planned[key as keyof ToolbarLayout]) ? previous : planned);
      if (focusInToolbar && (closesPopup || layoutChanges)) requestAnimationFrame(() => {
        if (focused.isConnected && node.contains(focused) && focused.getClientRects().length) return;
        const preferred = wasAction
          ? ['.list-filter-operations button', '.list-filter-action button', '.list-filter-batch button', '.list-filter-create button']
          : ['.list-filter-disclosure:not(.list-filter-operations) > button', '.list-filter-field input', '.list-filter-field button', '.list-filter-query button', '.list-filter-create button'];
        preferred.map(selector => node.querySelector<HTMLElement>(selector)).find(candidate => candidate?.getClientRects().length && !candidate.matches(':disabled'))?.focus();
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    node.querySelectorAll('[data-field-text-probe]').forEach(probe => observer.observe(probe));
    node.querySelectorAll('.list-filter-field:not(.is-keyword):not(.is-date)').forEach(field => observer.observe(field));
    document.fonts?.addEventListener('loadingdone', update);
    return () => { observer.disconnect(); document.fonts?.removeEventListener('loadingdone', update); };
  });

  const closeFilters = () => { setFiltersOpen(false); requestAnimationFrame(() => filterButton.current?.focus()); };
  const closeActions = () => { setActionsOpen(false); requestAnimationFrame(() => actionButton.current?.focus()); };
  const afterAction = (kind: 'filters' | 'actions') => {
    (kind === 'filters' ? filterButton.current : actionButton.current)?.focus();
    if (kind === 'filters') setFiltersOpen(false); else setActionsOpen(false);
  };
  const margins = new Map<string, number>();
  let previousKind: ToolbarKind | undefined;
  const place = (key: string, kind: ToolbarKind) => { margins.set(key, toolbarGap(previousKind, kind, measured < 400)); previousKind = kind; };
  if (create) place('create', 'create');
  for (let index = 0; index < visibleFields; index++) place(`field-${index}`, 'field');
  if (showFilter) place('filter', 'filter');
  if (layout.commandsInline && query) place('query', 'query');
  if (layout.commandsInline && reset) place('reset', 'reset');
  if (availableBatch && layout.batchInline) place('batch', 'batch');
  for (let index = 0; index < inlineActions; index++) place(`action-${index}`, 'action');
  if (!layout.merged && hiddenActions.length) place('operations', 'operations');
  const margin = (key: string) => ({ marginLeft: margins.get(key) || 0 });

  return <div className={fileActions ? 'list-filter-with-files' : undefined}><div ref={root} className={`list-filter-toolbar${measured < 650 ? ' is-small' : ''}${keywordFirst ? ' has-keyword' : ''}`} onKeyDown={event => {
    if (event.key === 'Escape' && filtersOpen) { event.preventDefault(); event.stopPropagation(); closeFilters(); }
    else if (event.key === 'Escape' && actionsOpen) { event.preventDefault(); event.stopPropagation(); closeActions(); }
  }}>
    {create && <div className="list-filter-create" style={margin('create')}>{create}</div>}
    {fields.slice(0, visibleFields).map((field, index) => <div data-toolbar-field={index} className={`list-filter-field${isValidElement<{ className?: string }>(field) && field.props.className?.includes('keyword-filter') ? ' is-keyword' : ''}${isValidElement<{ className?: string }>(field) && field.props.className?.includes('date-filter') ? ' is-date' : ''}${fieldSelect(field)?.props.multiple ? ' is-multiple' : ''}`} style={margin(`field-${index}`)} key={index}>{preparedField(field, true)}</div>)}
    {showFilter && <div className={`list-filter-disclosure${layout.merged ? ' is-merged' : ''}`} style={margin('filter')}>
      <Button ref={filterButton} variant="outline" type="button" icon={<ChevronDownIcon />} aria-label={layout.merged ? `筛选与操作${selected ? `，${selected}项已选` : ''}` : selected && measured < 400 ? `筛选，${selected}项已选` : undefined} aria-expanded={filtersOpen} onClick={() => { setActionsOpen(false); setFiltersOpen(value => !value); }}>{layout.merged ? `更多${countText(selected)}` : filterLabel(visibleFields)}</Button>
      {filtersOpen && <div className="list-filter-popover" role="group" aria-label={layout.merged ? '筛选与操作' : '更多筛选'}>{hiddenFields.map((field, index) => <div className="list-filter-popover-field" key={visibleFields + index}>{preparedField(field, false)}</div>)}{!layout.commandsInline && <div className="list-filter-popover-commands">{query}{reset}</div>}{layout.merged && <div className="list-filter-merged-actions" onClick={() => afterAction('filters')}><strong>操作</strong>{hiddenActions.map((action, index) => <div key={index}>{action}</div>)}</div>}<Button type="button" variant="text" onClick={closeFilters}>收起筛选</Button></div>}
    </div>}
    {layout.commandsInline && query && <div className="list-filter-query" style={margin('query')}>{query}</div>}
    {layout.commandsInline && reset && <div className="list-filter-reset" style={margin('reset')}>{reset}</div>}
    {availableBatch && layout.batchInline && <div className="list-filter-batch" style={margin('batch')}>{availableBatch}</div>}
    {actions.slice(0, inlineActions).map((action, index) => <div data-toolbar-action={index} className="list-filter-action" style={margin(`action-${index}`)} key={index}>{action}</div>)}
    {!layout.merged && hiddenActions.length > 0 && <div className="list-filter-disclosure list-filter-operations" style={margin('operations')}><Button ref={actionButton} type="button" variant="outline" icon={<ChevronDownIcon />} aria-expanded={actionsOpen} onClick={() => { setFiltersOpen(false); setActionsOpen(value => !value); }}>更多操作</Button>{actionsOpen && <div className="list-filter-popover" role="group" aria-label="更多操作" onClick={() => afterAction('actions')}>{hiddenActions.map((action, index) => <div key={inlineActions + index}>{action}</div>)}<Button type="button" variant="text" onClick={closeActions}>收起操作</Button></div>}</div>}
    <div className="list-filter-measure" aria-hidden="true">{fields.map((field, index) => fieldSelect(field) && <span className="list-filter-text-probe" data-field-text-probe={index} key={index}>{selectText(field)}</span>)}{create && <div data-create-probe>{items(create).map(probe)}</div>}{query && <div data-query-probe>{probe(query)}</div>}{reset && <div data-reset-probe>{probe(reset)}</div>}{availableBatch && <div data-batch-probe>{probe(availableBatch)}</div>}{actions.map((action, index) => <div data-action-width-probe={index} key={index}>{probe(action)}</div>)}{Array.from({ length: fields.length + 1 }, (_, index) => <Button key={index} tabIndex={-1} data-filter-probe={index} type="button" variant="outline" icon={<ChevronDownIcon />}>{filterLabel(index)}</Button>)}<Button tabIndex={-1} data-action-probe type="button" variant="outline" icon={<ChevronDownIcon />}>更多操作</Button><Button tabIndex={-1} data-merged-probe type="button" variant="outline" icon={<ChevronDownIcon />}>更多{countText(active.filter(Boolean).length)}</Button></div>
  </div>{fileActions && <div className="list-filter-files" role="group" aria-label="导入导出">{fileActions}</div>}</div>;
}
