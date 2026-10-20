import { CsvImportButton } from './FileTransferActions';
import { ListFilterToolbar } from './ListFilterToolbar';
import { PurchaseRouteCell, purchaseRouteTitle } from './PurchaseRouteCell';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, DateRangePicker, Empty, Input, InputNumber, MessagePlugin, PrimaryTable, Select, Tabs, Tag, Textarea, Tooltip } from 'tdesign-react';
import type { PrimaryTableCol } from 'tdesign-react';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, DownloadIcon, SearchIcon } from 'tdesign-icons-react';
import { PreviewDialog } from './PreviewDialog';
import { DetailDrawer } from './DetailDrawer';
import { companies, demandStatus, exportDemo, groupLines, initialOrders, missingFields, money, previewOrders, processingPages, purchaseLines, quantity, remaining, saveReviewDetails, sum, suppliers } from './processing-data';
import type { DemoOrder, ProcessingPage, PurchaseGroup, PurchaseLine } from './processing-data';
import { createEvent } from './history';

const options = (values: string[]) => values.map(value => ({ label: value, value }));
const emptyFilters = { query: '', type: '', supplier: '', dates: [] as string[] };
const badge = (text: string) => <Tag size="small" variant="light" theme={['已下单', '资料齐全', '可下单', '已入国内仓'].includes(text) ? 'success' : ['待补充', '待确认', '部分下单'].includes(text) ? 'warning' : 'primary'}>{text}</Tag>;
const productCell = (row: PurchaseLine) => <div className="cell-stack"><span className="product-name">{row.product}</span><span className="secondary">{row.color} · {row.executionCarton ? `${row.executionCarton} 件/箱` : '装箱数待确认'}</span></div>;
type ModalState = { kind: 'detail' | 'edit' | 'reject'; row: PurchaseLine } | { kind: 'approve'; rows: PurchaseLine[] } | { kind: 'preview'; rows: PurchaseLine[] };

export function ProcessingPages({ active, narrow }: { active: string; narrow: boolean }) {
  const [lines, setLines] = useState(purchaseLines);
  const [orders, setOrders] = useState(initialOrders);
  const [modal, setModal] = useState<ModalState | null>(null);
  const close = () => setModal(null);
  const proposed = modal?.kind === 'preview' ? previewOrders(modal.rows, orders.length + 1) : [];
  return <>
    {(Object.keys(processingPages) as ProcessingPage[]).map(kind => <div hidden={active !== kind} key={kind}>
      <ProcessingList kind={kind} lines={lines} orders={orders} onModal={setModal} narrow={narrow} />
    </div>)}
    {modal?.kind === 'edit' && <ReviewEditor row={modal.row} onClose={close} onSave={next => { const saved = saveReviewDetails(modal.row, next); setLines(current => current.map(row => row.id === next.id ? saved : row)); close(); void MessagePlugin.success('示例复审资料已保存'); }} />}
    {modal?.kind === 'detail' && <DetailDrawer title="采购需求详情" timeline={modal.row.timeline} onClose={close}>
      <div className="detail-content"><div className="detail-title"><div><h2>{modal.row.product}</h2><span className="secondary">{modal.row.id} · {modal.row.date}</span></div>{badge(modal.row.review ? '待复审' : demandStatus(modal.row))}</div>
        <h3>数量进度</h3><div className="quantity-overview">{[['申请', modal.row.quantity], ['计划', modal.row.planned], ['已下单', modal.row.ordered], ['未下单', remaining(modal.row)]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{quantity(Number(value))}<small> 件</small></strong></div>)}</div>
        <h3>采购与去向</h3><dl>{[['供应商', modal.row.supplier || '待补充'], ['采购单价', modal.row.price == null ? '待补充' : money(modal.row.price)], ['采购方', modal.row.company], ['采购类型', modal.row.purchaseType], ['站点 / 备货类型', `${modal.row.site} / ${modal.row.stockingType}`], ['货物路径', modal.row.stockPath], ['申请运输方式', modal.row.transport], ['申请人', `${modal.row.applicant} · ${modal.row.group}`], ['申请备注', modal.row.remark || '—'], ['数量调整原因', modal.row.adjustmentReason || '—']].map(([label, value]) => <div className="detail-pair" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      </div>
    </DetailDrawer>}
    {modal?.kind === 'approve' && <PreviewDialog title="确认通过复审" width={760} onClose={close} footer={<div className="form-footer"><span>共 {modal.rows.length} 条采购申请</span><div><Button variant="outline" onClick={close}>取消</Button><Button theme="primary" onClick={() => { close(); void MessagePlugin.success('已演示通过复审，列表数据保持不变'); }}>确认通过（{modal.rows.length}）</Button></div></div>}>
      <div className="preview-content"><p>以下 {modal.rows.length} 条申请资料齐全，请核对后确认通过复审。</p><LineItems rows={modal.rows} mode="review" /></div>
    </PreviewDialog>}
    {modal?.kind === 'reject' && <ReviewRejectDialog row={modal.row} onClose={close} />}
    {modal?.kind === 'preview' && <PreviewDialog title="采购订单预览" width={980} onClose={close} footer={<div className="form-footer"><span>合计 {proposed.length} 单 · {quantity(sum(modal.rows, remaining))} 件</span><div><Button variant="outline" onClick={close}>返回调整</Button><Button theme="primary" disabled={!proposed.length} onClick={() => {
      const events = new Map(modal.rows.map(row => [row.id, createEvent('采购下单', '演示用户', `订单 ${proposed.find(order => order.lines.some(line => line.id === row.id))!.id}\n本次下单 ${remaining(row)} 件，累计下单 ${row.planned} 件。`)]));
      setOrders(current => [...proposed, ...current]); setLines(current => current.map(row => events.has(row.id) ? { ...row, ordered: row.planned, timeline: [...row.timeline, events.get(row.id)!] } : row)); close(); void MessagePlugin.success(`已生成 ${proposed.length} 个示例订单，可在采购订单页查看`);
    }}>生成示例订单（{proposed.length}）</Button></div></div>}>
      <div className="preview-content"><Alert theme="info" message="按采购类型、采购方与供应商分单，仅模拟当前页面的数据变化。" />{proposed.map(group => <section className="order-preview-group" key={group.id}><div className="group-heading"><div><h3>{group.supplier}</h3><span className="secondary">{group.company} · {group.purchaseType}</span></div><strong className="numeric">{quantity(sum(group.lines, row => row.planned))} 件</strong></div><LineItems rows={group.lines} mode="order" /></section>)}</div>
    </PreviewDialog>}
  </>;
}

function LineItems({ rows, mode, onDetail }: { rows: PurchaseLine[]; mode: 'review' | 'summary' | 'order'; onDetail?: (row: PurchaseLine) => void }) {
  const columns: PrimaryTableCol<PurchaseLine>[] = [
    { colKey: 'product', title: '品名 / 颜色', width: 200, cell: ({ row }) => productCell(row) },
    { colKey: 'site', title: '站点 / 去向', width: 136, cell: ({ row }) => <div className="cell-stack"><span>{row.site} · {row.stockingType}</span><span className="secondary">{row.stockPath} · {row.transport}</span></div> },
    { colKey: 'planned', title: mode === 'summary' ? '未下单数量' : '计划数量', width: 104, align: 'right', cell: ({ row }) => <span className="numeric">{quantity(mode === 'summary' ? remaining(row) : row.planned)}</span> },
    { colKey: 'price', title: '采购单价', width: 100, align: 'right', cell: ({ row }) => <span className="numeric">{row.price == null ? '待补充' : money(row.price)}</span> },
    { colKey: 'source', title: '来源申请', width: 176, cell: ({ row }) => <div className="cell-stack">{onDetail ? <Button variant="text" theme="primary" onClick={() => onDetail(row)}>{row.id}</Button> : <span>{row.id}</span>}<span className="secondary">{row.applicant} · {row.group}</span></div> },
  ];
  return <div className="line-items-scroll" tabIndex={0} role="region" aria-label="采购商品明细，可横向滚动"><PrimaryTable rowKey="id" data={rows} columns={columns} size="small" tableLayout="fixed" hover /></div>;
}

function ProcessingList({ kind, lines, orders, onModal, narrow }: { kind: ProcessingPage; lines: PurchaseLine[]; orders: DemoOrder[]; onModal: (modal: ModalState) => void; narrow: boolean }) {
  const [filters, setFilters] = useState(emptyFilters), [applied, setApplied] = useState(emptyFilters);
  const [stage, setStage] = useState('全部'), [selected, setSelected] = useState<(string | number)[]>([]);
  const [expanded, setExpanded] = useState<(string | number)[]>([]), [page, setPage] = useState(1), [pageSize, setPageSize] = useState(10);
  const reset = () => { setFilters(emptyFilters); setApplied(emptyFilters); setStage('全部'); setSelected([]); setPage(1); };
  const matches = (row: { purchaseType: string; supplier: string; date: string }, search: string) => (!applied.query.trim() || search.toLowerCase().includes(applied.query.trim().toLowerCase())) && (!applied.type || row.purchaseType === applied.type) && (!applied.supplier || row.supplier === applied.supplier) && (!applied.dates[0] || row.date >= applied.dates[0]) && (!applied.dates[1] || row.date <= applied.dates[1]);
  const filtered = lines.filter(row => (kind === 'review' ? row.review : !row.review) && (kind !== 'summary' || remaining(row) > 0) && matches(row, `${row.id} ${row.product} ${row.applicant} ${row.supplier}`));
  const lineStatus = (row: PurchaseLine) => kind === 'review' ? missingFields(row).length ? '待补充' : '资料齐全' : demandStatus(row);
  const groupStatus = (group: PurchaseGroup) => group.lines.some(row => missingFields(row).length) ? '待确认' : '可下单';
  const allGroups = groupLines(filtered);
  const allOrders = orders.filter(order => matches(order, `${order.id} ${order.supplier} ${order.lines.map(row => row.product).join(' ')}`));
  const visible = filtered.filter(row => stage === '全部' || lineStatus(row) === stage);
  const groups = allGroups.filter(group => stage === '全部' || groupStatus(group) === stage);
  const shownOrders = allOrders.filter(order => stage === '全部' || order.orderStatus === stage);
  const grouped = kind === 'summary' || kind === 'orders';
  const groupRows = kind === 'summary' ? groups : shownOrders;
  const pickedLines = grouped ? groupRows.filter(group => selected.includes(group.id)).flatMap(group => group.lines) : visible.filter(row => selected.includes(row.id));
  const blocked = pickedLines.some(row => missingFields(row).length);
  const count = grouped ? groupRows.length : visible.length;
  const stages = kind === 'review' ? ['全部', '资料齐全', '待补充'] : kind === 'summary' ? ['全部', '可下单', '待确认'] : kind === 'orders' ? ['全部', '待交货', '已下单', '已入国内仓'] : ['全部', '待采购', '部分下单', '已下单'];
  const stageCount = (value: string) => kind === 'summary' ? allGroups.filter(row => value === '全部' || groupStatus(row) === value).length : kind === 'orders' ? allOrders.filter(row => value === '全部' || row.orderStatus === value).length : filtered.filter(row => value === '全部' || lineStatus(row) === value).length;
  const visibleIds = (grouped ? groupRows : visible).map(row => row.id).join('|');
  useEffect(() => { const ids = new Set(visibleIds.split('|')); setSelected(current => current.filter(id => ids.has(String(id)))); setPage(current => Math.min(current, Math.max(1, Math.ceil(count / pageSize)))); }, [visibleIds, count, pageSize]);
  const detail = (row: PurchaseLine) => onModal({ kind: 'detail', row: lines.find(source => source.id === row.id) ?? row });
  const toggle = (id: string) => setExpanded(current => current.includes(id) ? current.filter(key => key !== id) : [...current, id]);
  const selectColumn: PrimaryTableCol<PurchaseLine> = { colKey: 'row-select', type: 'multiple', width: 40, fixed: 'left', checkProps: ({ row }) => ({ label: <span className="sr-only">选择 {row.id}</span> }) };
  const columns: PrimaryTableCol<PurchaseLine>[] = [selectColumn,
    { colKey: 'id', title: '采购编码 / 申请日期', width: 162, cell: ({ row }) => <div className="cell-stack"><Button variant="text" theme="primary" onClick={() => detail(row)}>{row.id}</Button><span className="secondary numeric">{row.date}</span></div> },
    { colKey: 'product', title: '采购商品', width: 190, cell: ({ row }) => productCell(row) },
    ...(kind === 'review' ? [
      { colKey: 'planned', title: '计划数量', width: 100, align: 'right', cell: ({ row }) => <span className="numeric quantity">{quantity(row.planned)} <small>件</small></span> },
      { colKey: 'purchaseType', title: purchaseRouteTitle, width: 154, cell: ({ row }) => <PurchaseRouteCell row={row} /> },
      { colKey: 'applicant', title: '申请人 / 所属小组', width: 110, cell: ({ row }) => <div className="cell-stack"><span>{row.applicant}</span><span className="secondary">{row.group}</span></div> },
      { colKey: 'supplier', title: '供应商 / 采购单价', width: 208, cell: ({ row }) => <div className="cell-stack"><span>{row.supplier || '待补充供应商'}</span><span className="secondary numeric">本次单价 {row.price == null ? '待确认' : money(row.price)}</span></div> },
      { colKey: 'pending', title: '待补项', width: 112, cell: ({ row }) => missingFields(row).length ? <div className="cell-stack">{missingFields(row).map(field => <span className="pending-field" key={field}>{field}</span>)}</div> : <span className="complete-label"><CheckIcon />资料齐全</span> },
    ] satisfies PrimaryTableCol<PurchaseLine>[] : [
      { colKey: 'quantity', title: '申请 / 计划', width: 110, align: 'right', cell: ({ row }) => <div className="numeric quantity-cell"><span>{quantity(row.quantity)} / {quantity(row.planned)}</span></div> },
      { colKey: 'progress', title: '已下单 / 未下单', width: 132, align: 'right', cell: ({ row }) => <span className="numeric">{quantity(row.ordered)} / <strong>{quantity(remaining(row))}</strong></span> },
      { colKey: 'status', title: '采购状态', width: 100, cell: ({ row }) => badge(demandStatus(row)) },
      { colKey: 'site', title: '类型 / 站点', width: 130, cell: ({ row }) => <div className="cell-stack"><span>{row.purchaseType}</span><span className="secondary">{row.site} · {row.stockingType} · {row.applicant}</span></div> },
    ] satisfies PrimaryTableCol<PurchaseLine>[]),
    { colKey: 'action', title: '操作', fixed: 'right', width: kind === 'review' ? narrow ? 112 : 208 : 72, cell: ({ row }) => {
      const missing = missingFields(row);
      return <div className={kind === 'review' ? 'purchase-row-actions review-row-actions' : 'row-buttons'}>
        <Button variant="text" theme={kind === 'review' ? 'default' : 'primary'} onClick={() => detail(row)}>详情</Button>
        {kind === 'review' && <>
          <Button variant="text" theme="primary" aria-label={`修改 ${row.id}`} onClick={() => onModal({ kind: 'edit', row })}>修改</Button>
          <Tooltip content={missing.length ? `请先补齐：${missing.join('、')}` : '资料齐全，可通过复审'}>
            <span className="review-approve-trigger" tabIndex={missing.length ? 0 : undefined} aria-label={missing.length ? `暂不能通过，请先补齐：${missing.join('、')}` : undefined}>
              <Button variant="text" theme="primary" aria-label={`通过 ${row.id}`} disabled={!!missing.length} onClick={() => onModal({ kind: 'approve', rows: [row] })}>通过</Button>
            </span>
          </Tooltip>
          <Button variant="text" theme="danger" aria-label={`驳回 ${row.id}`} onClick={() => onModal({ kind: 'reject', row })}>驳回</Button>
        </>}
      </div>;
    } },
  ];
  const groupColumns: PrimaryTableCol<PurchaseGroup>[] = [
    { colKey: 'row-select', type: 'multiple', width: 40, fixed: 'left', checkProps: ({ row }) => ({ label: <span className="sr-only">选择 {kind === 'orders' ? row.id : row.supplier}</span> }) },
    ...(kind === 'orders' ? [{ colKey: 'id', title: '订单号 / 创建日期', width: 168, cell: ({ row }) => <div className="cell-stack"><Button variant="text" theme="primary" aria-expanded={expanded.includes(row.id)} onClick={() => toggle(row.id)}>{row.id}</Button><span className="secondary">{(row as DemoOrder).date}</span></div> }] satisfies PrimaryTableCol<PurchaseGroup>[] : []),
    { colKey: 'supplier', title: '供应商 / 采购方', width: 238, cell: ({ row }) => <div className="cell-stack"><span className="product-name">{row.supplier || '待补充供应商'}</span><span className="secondary">{row.company}</span></div> },
    { colKey: 'purchaseType', title: '采购类型', width: 100 },
    { colKey: 'count', title: '明细 / 数量', align: 'right', width: 122, cell: ({ row }) => <div className="cell-stack align-end"><strong className="numeric">{quantity(sum(row.lines, kind === 'summary' ? remaining : line => line.planned))} 件</strong><span className="secondary">{row.lines.length} 条明细</span></div> },
    { colKey: 'amount', title: '采购金额', align: 'right', width: 120, cell: ({ row }) => <span className="numeric">{row.lines.some(line => line.price == null) ? '待确认' : money(sum(row.lines, line => (kind === 'summary' ? remaining(line) : line.planned) * (line.price ?? 0)))}</span> },
    ...(kind === 'orders' ? [{ colKey: 'delivery', title: '预计交期', width: 114, cell: ({ row }) => <span className={(row as DemoOrder).delivery ? 'numeric' : 'secondary'}>{(row as DemoOrder).delivery || '待补充'}</span> }] satisfies PrimaryTableCol<PurchaseGroup>[] : [{ colKey: 'pending', title: '待补项', width: 124, cell: ({ row }) => <span className="secondary">{[...new Set(row.lines.flatMap(missingFields))].join('、') || '—'}</span> }] satisfies PrimaryTableCol<PurchaseGroup>[]),
    { colKey: 'status', title: '状态', width: 100, cell: ({ row }) => badge(kind === 'summary' ? groupStatus(row) : (row as DemoOrder).orderStatus) },
    { colKey: 'action', title: '操作', fixed: 'right', width: kind === 'summary' ? 170 : 84, cell: ({ row }) => <div className="row-buttons">{kind === 'summary' && <Button variant="text" theme="primary" disabled={row.lines.some(line => missingFields(line).length > 0)} onClick={() => onModal({ kind: 'preview', rows: row.lines })}>预览订单</Button>}<Button variant="text" theme="primary" icon={expanded.includes(row.id) ? <ChevronUpIcon /> : <ChevronDownIcon />} aria-expanded={expanded.includes(row.id)} aria-label={`${expanded.includes(row.id) ? '收起' : '展开'} ${kind === 'orders' ? row.id : row.supplier}`} onClick={() => toggle(row.id)}>{expanded.includes(row.id) ? '收起' : '明细'}</Button></div> },
  ];
  function exportRows() {
    const records = selected.length ? pickedLines : grouped ? groupRows.flatMap(group => group.lines) : visible;
    if (kind === 'orders') {
      const exported = selected.length ? shownOrders.filter(order => selected.includes(order.id)) : shownOrders;
      exportDemo(processingPages[kind], ['采购订单号', '来源采购编码', '品名', '供应商', '订单数量', '采购单价', '预计交期'], exported.flatMap(order => order.lines.map(row => [order.id, row.id, row.product, order.supplier, row.planned, row.price ?? '待补充', order.delivery || '待补充'])));
    } else exportDemo(processingPages[kind], ['采购编码', '品名', '采购类型', '供应商', '计划数量', '已下单', '采购单价'], records.map(row => [row.id, row.product, row.purchaseType, row.supplier, row.planned, row.ordered, row.price ?? '待补充']));
    void MessagePlugin.success(`已导出 ${records.length} 条示例明细`);
  }
  return <>
    <h1 className="sr-only">{processingPages[kind]}</h1>
    <section className="filter-panel" aria-label={`筛选${processingPages[kind]}`}><form onSubmit={event => { event.preventDefault(); setApplied({ ...filters }); setPage(1); setSelected([]); }}>
      <ListFilterToolbar fields={<>
        <label className="keyword-filter"><span>关键词</span><Input aria-label={`${processingPages[kind]}关键词`} value={filters.query} onChange={query => setFilters({ ...filters, query })} prefixIcon={<SearchIcon />} clearable placeholder={kind === 'orders' ? '订单号、品名、供应商' : '采购编码、品名、申请人'} /></label>
        <label><span>采购类型</span><Select value={filters.type} onChange={value => setFilters({ ...filters, type: String(value || '') })} options={options(['国内采购', '海外采购'])} clearable placeholder="全部类型" /></label>
        <label><span>供应商</span><Select value={filters.supplier} onChange={value => setFilters({ ...filters, supplier: String(value || '') })} options={options(suppliers)} filterable clearable placeholder="全部供应商" /></label>
        <label className="date-filter"><span>{kind === 'orders' ? '创建日期' : '申请日期'}</span><DateRangePicker value={filters.dates} onChange={dates => setFilters({ ...filters, dates: dates.map(String) })} clearable /></label>
      </>} batch={kind === 'review' ? <Button variant="outline" type="button" icon={<CheckIcon />} disabled={!pickedLines.length || blocked} onClick={() => onModal({ kind: 'approve', rows: pickedLines })}>批量通过{pickedLines.length ? `（${pickedLines.length}）` : ''}</Button> : kind === 'summary' ? <Button variant="outline" type="button" disabled={!pickedLines.length || blocked} onClick={() => onModal({ kind: 'preview', rows: pickedLines })}>预览采购订单{selected.length ? `（${selected.length}）` : ''}</Button> : undefined} fileActions={<><CsvImportButton title={processingPages[kind]} data={kind === 'orders' ? { headers: ['采购订单号', '来源采购编码', '品名', '供应商', '订单数量', '采购单价', '预计交期'], rows: shownOrders.flatMap(order => order.lines.map(row => [order.id, row.id, row.product, order.supplier, row.planned, row.price ?? '待补充', order.delivery || '待补充'])) } : { headers: ['采购编码', '品名', '采购类型', '供应商', '计划数量', '已下单', '采购单价'], rows: (grouped ? groupRows.flatMap(group => group.lines) : visible).map(row => [row.id, row.product, row.purchaseType, row.supplier, row.planned, row.ordered, row.price ?? '待补充']) }} />{<Button variant="outline" type="button" icon={<DownloadIcon />} disabled={!count} onClick={exportRows}>{selected.length ? '导出所选' : '导出当前筛选'}</Button>}</>} query={<Button type="submit">查询</Button>} reset={<Button type="button" onClick={reset}>重置</Button>} />
      
    </form></section>
    <section className="list-panel" aria-label={`${processingPages[kind]}列表`}>
      <div className="list-heading"><Tabs value={stage} onChange={value => { setStage(String(value)); setPage(1); setSelected([]); }}>{stages.map(value => <Tabs.TabPanel key={value} value={value} label={<button className="tab-label" aria-pressed={value === stage}>{value}<span className="tab-count">{stageCount(value)}</span></button>} />)}</Tabs>
      <div className={`list-meta${selected.length ? ' has-selection' : ''}`}><div className="selection-summary" aria-live="polite">{selected.length ? <>已选 <strong>{selected.length}</strong> {grouped ? '组' : '条'}<Button variant="text" theme="primary" onClick={() => setSelected([])}>取消选择</Button></> : <><strong>{count}</strong> {kind === 'orders' ? '个订单' : kind === 'summary' ? '个采购分组' : '条记录'}</>}<span className="toolbar-hint">{kind === 'review' ? '通过复审后进入采购汇总' : kind === 'summary' ? '按采购类型、采购方与供应商分组' : kind === 'orders' ? '展开查看商品与来源申请' : '追踪申请到下单的数量变化'}</span></div></div></div>
      {blocked && (kind === 'review' || kind === 'summary') && <Alert className="selection-alert" theme="warning" message="所选记录有待补资料，请先补齐或取消选择这些记录。" />}
      <div className={`table-scroll processing-table${kind === 'review' ? ' review-table' : ''}`} role="region" aria-label={`${processingPages[kind]}表格，可横向滚动`} tabIndex={0}>
        {grouped ? <PrimaryTable<PurchaseGroup> rowKey="id" data={groupRows} columns={groupColumns} size="small" hover tableLayout="fixed" selectedRowKeys={selected} onSelectChange={setSelected} expandIcon={false} expandedRowKeys={expanded}
          expandedRow={({ row }) => <div className="expanded-products"><LineItems rows={row.lines} mode={kind === 'summary' ? 'summary' : 'order'} onDetail={detail} /></div>}
          pagination={{ current: page, pageSize, total: count, pageSizeOptions: [10, 20, 50], showJumper: true }} onPageChange={info => { setPage(info.current); setPageSize(info.pageSize); }}
          empty={<Empty title="没有符合条件的记录" description="调整条件，或重置筛选查看全部记录。" action={<Button variant="outline" onClick={reset}>重置筛选</Button>} />} /> :
          <PrimaryTable<PurchaseLine> rowKey="id" data={visible} columns={columns} size="small" hover tableLayout="fixed" selectedRowKeys={selected} onSelectChange={setSelected}
            pagination={{ current: page, pageSize, total: count, pageSizeOptions: [10, 20, 50], showJumper: true }} onPageChange={info => { setPage(info.current); setPageSize(info.pageSize); }}
            empty={<Empty title="没有符合条件的记录" description="调整条件，或重置筛选查看全部记录。" action={<Button variant="outline" onClick={reset}>重置筛选</Button>} />} />}
      </div>
    </section>
  </>;
}

function ReviewRejectDialog({ row, onClose }: { row: PurchaseLine; onClose: () => void }) {
  const [reason, setReason] = useState(''), [error, setError] = useState(false);
  const confirm = () => {
    if (!reason.trim()) {
      setError(true);
      document.getElementById('review-reject-reason')?.focus();
      return;
    }
    onClose();
    void MessagePlugin.success('已演示驳回复审，列表数据保持不变');
  };
  return <PreviewDialog title="驳回复审" width={520} onClose={onClose} initialFocus="textarea" footer={<div className="purchase-reject-footer"><span>请说明需要调整的内容</span><div><Button variant="outline" onClick={onClose}>取消</Button><Button theme="danger" onClick={confirm}>确认驳回</Button></div></div>}>
    <div className="purchase-reject-body">
      <p><strong>{row.id}</strong><span>{row.product}</span></p>
      <label htmlFor="review-reject-reason"><span>驳回原因（必填）</span><Textarea name="review-reject-reason" value={reason} onChange={value => { setReason(value); setError(false); }} maxlength={300} autosize={{ minRows: 4, maxRows: 6 }} placeholder="请说明驳回原因，便于申请人修改" status={error ? 'error' : 'default'} aria-label="驳回原因" aria-required="true" aria-invalid={error} aria-describedby={error ? 'review-reject-error' : undefined} /></label>
      {error && <p className="purchase-action-error" id="review-reject-error" role="alert">请填写驳回原因</p>}
    </div>
  </PreviewDialog>;
}

function ReviewEditor({ row, onClose, onSave }: { row: PurchaseLine; onClose: () => void; onSave: (row: PurchaseLine) => void }) {
  const [draft, setDraft] = useState(row), [dirty, setDirty] = useState(false), [discard, setDiscard] = useState(false), [error, setError] = useState('');
  const changed = (next: Partial<PurchaseLine>) => { setDraft(current => ({ ...current, ...next })); setDirty(true); setError(''); };
  const close = () => dirty ? setDiscard(true) : onClose();
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
  const validQuantity = useMemo(() => Number.isInteger(draft.planned) && draft.planned > 0 && draft.planned <= 2147483647 && !!draft.executionCarton && Number.isInteger(draft.executionCarton) && draft.executionCarton > 0 && draft.planned % draft.executionCarton === 0, [draft]);
  function save() {
    const issue = !draft.supplier ? ['review-supplier', '请选择供应商'] : draft.price == null || draft.price <= 0 ? ['review-price', '采购单价须大于 0'] : !validQuantity ? ['review-quantity', '计划数量须为正整数，且是本次装箱数的整数倍'] : draft.planned !== row.planned && !draft.adjustmentReason.trim() ? ['review-reason', '调整计划数量时请填写原因'] : null;
    if (issue) { setError(issue[1]); requestAnimationFrame(() => document.getElementById(issue[0])?.focus()); return; }
    onSave(draft);
  }
  return <PreviewDialog title="修改复审资料" onClose={close} footer={<div className="form-footer"><span>{discard ? '放弃后不会保存本次修改' : dirty ? '有未保存的修改' : '仅更新本地示例'}</span><div>{discard ? <><Button variant="outline" onClick={() => setDiscard(false)}>继续编辑</Button><Button theme="danger" onClick={onClose}>放弃修改</Button></> : <><Button variant="outline" onClick={close}>取消</Button><Button theme="primary" onClick={save}>保存资料</Button></>}</div></div>}>
    <div className="review-editor">
      <div className="editor-product"><strong>{row.product}</strong><span className="secondary">{row.id} · {row.color} · {row.site}</span></div>
      {discard && <div role="alert"><Alert theme="warning" message="有未保存的修改。继续编辑，或在底部选择放弃修改。" /></div>}
      {error && <div role="alert"><Alert theme="error" message={error} /></div>}
      <section className="form-section"><h3>采购资料</h3><div className="form-grid">
        <label htmlFor="review-supplier"><span>供应商 <em>*</em></span><Select inputProps={{ name: 'review-supplier' }} value={draft.supplier} onChange={value => changed({ supplier: String(value || '') })} options={options(suppliers)} filterable clearable placeholder="请选择供应商" /></label>
        <label htmlFor="review-price"><span>本次采购单价 <em>*</em></span><InputNumber inputProps={{ name: 'review-price' }} value={draft.price ?? undefined} onChange={value => changed({ price: value === '' || value === undefined ? null : Number(value) })} min={0.01} decimalPlaces={2} placeholder="请输入单价" /></label>
        <label htmlFor="review-company"><span>采购方</span><Select inputProps={{ name: 'review-company' }} value={draft.company} onChange={value => changed({ company: String(value) })} options={options(companies)} /></label>
        <div className="carton-reference"><span>申请数量</span><strong className="numeric">{quantity(row.quantity)} 件</strong><small>本次修改不覆盖运营提交的原始申请数量</small></div>
      </div></section>
      <section className="form-section"><h3>计划数量</h3><div className="form-grid">
        <label htmlFor="review-quantity"><span>计划采购量 <em>*</em></span><InputNumber inputProps={{ name: 'review-quantity' }} value={draft.planned} onChange={value => changed({ planned: Number(value) })} min={1} max={2147483647} decimalPlaces={0} suffix="件" /></label>
        <label htmlFor="review-carton"><span>本次装箱数 <em>*</em></span><InputNumber inputProps={{ name: 'review-carton' }} value={draft.executionCarton ?? undefined} onChange={value => changed({ executionCarton: Number(value) })} min={1} decimalPlaces={0} suffix="件/箱" /></label>
        <label htmlFor="review-reason" className="full-field"><span>数量调整原因{draft.planned !== row.planned && <em> *</em>}</span><Input name="review-reason" value={draft.adjustmentReason} onChange={value => changed({ adjustmentReason: value })} placeholder="调整计划数量时填写" maxlength={300} /></label>
      </div></section>
    </div>
  </PreviewDialog>;
}
