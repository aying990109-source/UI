import { CsvImportButton } from './FileTransferActions';
import { ListFilterToolbar } from './ListFilterToolbar';
import { useEffect, useState } from 'react';
import { Alert, Button, DateRangePicker, Empty, Input, MessagePlugin, PrimaryTable, Select, Tabs, Tag, type PrimaryTableCol } from 'tdesign-react';
import { AddIcon, CheckIcon, DownloadIcon, SearchIcon } from 'tdesign-icons-react';
import { DetailDrawer } from './DetailDrawer';
import { PreviewDialog } from './PreviewDialog';
import { LogisticsEditor, ScheduleEditor, ShippingSourcePicker } from './ShippingForms';
import { exportDemo, quantity } from './processing-data';
import { changeDispatch, confirmed, confirmManifest, confirmSchedules, initialShippingState, manifestAllocated, manifestStatus, shippingPages, totalBoxes, totalQuantity, totalVolume, warehouses, type Goods, type ShippingPage, type ShippingState } from './shipping-data';

type ListRow = { id: string; date: string; party: string; warehouse: string; site: string; quantity: number; boxes: number; status: string; product?: string; sku?: string; order?: string; transport?: string; confirmed?: number; allocated?: number; trackingNo?: string; trackingText?: string; trackingStage?: string; file?: string };
type Modal = { kind: 'detail'; page: ShippingPage; id: string } | { kind: 'schedule'; id: string } | { kind: 'picker'; page: 'preparation' | 'dispatch' } | { kind: 'confirmSchedules'; ids: string[] } | { kind: 'confirmManifest' | 'export' | 'send' | 'trackingNo' | 'tracking'; id: string };
const tag = (value: string) => <Tag size="small" variant="light" theme={['已确认', '待物流下单', '已全部分配'].includes(value) ? 'success' : ['草稿', '待核对', '部分确认', '部分分配'].includes(value) ? 'warning' : 'primary'}>{value}</Tag>;
const opts = (values: string[]) => values.map(value => ({ label: value, value }));

function listRows(state: ShippingState, page: ShippingPage): ListRow[] {
  if (page === 'schedule') return state.schedules.map(row => ({ ...row, party: row.supplier, boxes: row.quantity / row.carton }));
  if (page === 'preparation') return state.manifests.map(row => ({ id: row.id, date: row.date, party: row.supplier, warehouse: [...new Set(row.lines.map(line => line.warehouse))].join('、'), site: [...new Set(row.lines.map(line => line.site))].join(' / '), product: row.lines.map(line => line.product).join('、'), quantity: totalQuantity(row.lines), boxes: totalBoxes(row.lines), confirmed: confirmed(row), allocated: manifestAllocated(state, row), status: manifestStatus(state, row) }));
  return state.dispatches.map(row => ({ ...row, party: row.carrier, site: [...new Set(row.lines.map(line => line.site))].join(' / '), product: row.lines.map(line => line.product).join('、'), quantity: totalQuantity(row.lines), boxes: totalBoxes(row.lines) }));
}

export function ShippingPages({ active }: { active: string }) {
  const [state, setState] = useState(initialShippingState), [modal, setModal] = useState<Modal | null>(null), [error, setError] = useState('');
  const close = () => { setModal(null); setError(''); };
  const open = (next: Modal) => { setError(''); setModal(next); };
  const save = (next: ShippingState, message: string) => { setState(next); close(); void MessagePlugin.success(message); };
  const dispatch = modal && 'id' in modal ? state.dispatches.find(row => row.id === modal.id) : undefined;
  const schedule = modal?.kind === 'schedule' ? state.schedules.find(row => row.id === modal.id) : undefined;
  const manifest = modal?.kind === 'confirmManifest' ? state.manifests.find(row => row.id === modal.id) : undefined;
  const confirmTitle = modal?.kind === 'confirmSchedules' ? '确认出货排期' : modal?.kind === 'confirmManifest' ? '确认核对资料' : modal?.kind === 'export' ? '生成示例物流清单' : '记录示例发送';
  function confirmAction() {
    try {
      if (modal?.kind === 'confirmSchedules') save(confirmSchedules(state, modal.ids), `已确认 ${modal.ids.length} 条示例排期`);
      else if (modal?.kind === 'confirmManifest') save(confirmManifest(state, modal.id), '示例核对资料已确认，可用于物流下单');
      else if (modal?.kind === 'export' && dispatch) {
        const next = changeDispatch(state, dispatch.id, 'export');
        exportDemo(dispatch.id, ['示例物流单', '品名', '来源核对单', '数量', '箱数', '目的仓', '运输方式'], dispatch.lines.map(line => [dispatch.id, line.product, line.manifestId, line.quantity, line.quantity / line.carton, line.warehouse, dispatch.transport]));
        save(next, '已导出示例清单，可继续体验记录发送');
      } else if (modal?.kind === 'send') save(changeDispatch(state, modal.id, 'send'), '已记录示例发送状态，未发送任何真实文件');
    } catch (error) { setError((error as Error).message); }
  }
  return <>
    {(Object.keys(shippingPages) as ShippingPage[]).map(page => <div hidden={active !== page} key={page}><ShippingList page={page} state={state} onModal={open} /></div>)}
    {modal?.kind === 'detail' && <ShippingDetail state={state} page={modal.page} id={modal.id} onClose={close} />}
    {modal?.kind === 'picker' && <ShippingSourcePicker mode={modal.page} state={state} onClose={close} onSave={next => save(next, modal.page === 'preparation' ? '已按供应商生成示例核对资料' : '示例物流单已创建')} />}
    {schedule && <ScheduleEditor row={schedule} onClose={close} onSave={next => save({ ...state, schedules: state.schedules.map(row => row.id === next.id ? next : row) }, '示例出货排期已保存')} />}
    {modal && ['confirmSchedules', 'confirmManifest', 'export', 'send'].includes(modal.kind) && <PreviewDialog title={confirmTitle} onClose={close} width={680} footer={<div className="form-footer"><span>仅更新本地示例</span><div><Button variant="outline" onClick={close}>取消</Button><Button theme="primary" onClick={confirmAction}>{modal.kind === 'export' ? '生成并下载示例' : '确认'}</Button></div></div>}>
      <div className="preview-content">
        {modal.kind === 'confirmSchedules' && <><p>确认以下 {modal.ids.length} 条排期后，可在出货核对中选货。</p><ul className="shipping-confirm-list">{state.schedules.filter(row => modal.ids.includes(row.id)).map(row => <li key={row.id}><strong>{row.product}</strong><span>{row.id} · {quantity(row.quantity)} 件 · {row.warehouse || '目的仓待补充'}</span></li>)}</ul><p className="secondary">此操作确认出货计划，不表示已实际发货。</p></>}
        {manifest && <><p>{manifest.id} · {manifest.supplier}</p><p>本次确认 <strong>{quantity(totalQuantity(manifest.lines) - confirmed(manifest))} 件</strong>，已确认部分保持不变。</p><GoodsTable rows={manifest.lines} /></>}
        {dispatch && <><p>{dispatch.id} · {dispatch.carrier}</p><p>{quantity(totalQuantity(dispatch.lines))} 件 / {totalBoxes(dispatch.lines)} 箱 · {dispatch.warehouse}</p><Alert theme="info" message={modal.kind === 'export' ? '下载仅用于体验的 CSV 清单，不是正式物流商文件或回导模板。' : '仅记录本地示例发送状态，不会联系物流商或发送文件。'} /></>}
        {error && <div role="alert" className="shipping-form-error"><Alert theme="error" message={error} /></div>}
      </div>
    </PreviewDialog>}
    {dispatch && (modal?.kind === 'trackingNo' || modal?.kind === 'tracking') && <LogisticsEditor title={modal.kind === 'trackingNo' ? '登记运单' : '更新物流信息'} label={modal.kind === 'trackingNo' ? '运单号' : '最新物流信息'} initial={modal.kind === 'trackingNo' ? dispatch.trackingNo : dispatch.trackingText} multiline={modal.kind === 'tracking'} onClose={close} onSave={value => save(changeDispatch(state, dispatch.id, modal.kind === 'trackingNo' ? 'trackingNo' : 'tracking', value), modal.kind === 'trackingNo' ? '示例运单已登记' : '示例物流信息已保存')} />}
  </>;
}

function ShippingList({ page, state, onModal }: { page: ShippingPage; state: ShippingState; onModal: (modal: Modal) => void }) {
  const empty = { query: '', warehouse: '', dates: [] as string[] };
  const [filters, setFilters] = useState(empty), [applied, setApplied] = useState(empty), [stage, setStage] = useState('全部');
  const [selected, setSelected] = useState<(string | number)[]>([]), [current, setCurrent] = useState(1), [pageSize, setPageSize] = useState(10);
  const rows = listRows(state, page);
  const filtered = rows.filter(row => (!applied.query.trim() || `${row.id} ${row.party} ${row.product} ${row.order || ''} ${row.trackingNo || ''}`.toLowerCase().includes(applied.query.trim().toLowerCase())) && (!applied.warehouse || row.warehouse.split('、').includes(applied.warehouse)) && (!applied.dates[0] || row.date >= applied.dates[0]) && (!applied.dates[1] || row.date <= applied.dates[1]));
  const visible = filtered.filter(row => stage === '全部' || row.status === stage);
  const stages = page === 'schedule' ? ['全部', '草稿', '已确认'] : page === 'preparation' ? ['全部', '待核对', '部分确认', '待物流下单', '部分分配', '已全部分配'] : ['全部', '草稿', '已导出', '已发送，待回运单', '已接单，处理中'];
  const visibleIds = visible.map(row => row.id).join('|');
  useEffect(() => { const ids = new Set(visibleIds.split('|')); setSelected(current => current.filter(id => ids.has(String(id)))); setCurrent(current => Math.min(current, Math.max(1, Math.ceil(visibleIds ? visibleIds.split('|').length / pageSize : 1)))); }, [visibleIds, pageSize]);
  const reset = () => { setFilters(empty); setApplied(empty); setStage('全部'); setSelected([]); setCurrent(1); };
  const detail = (row: ListRow) => onModal({ kind: 'detail', page, id: row.id });
  const nextAction = (row: ListRow) => {
    if (page === 'schedule') return row.status === '草稿' ? <Button variant="text" theme="primary" aria-label={`编辑 ${row.id}`} onClick={() => onModal({ kind: 'schedule', id: row.id })}>编辑</Button> : null;
    if (page === 'preparation') return row.confirmed! < row.quantity ? <Button variant="text" theme="primary" aria-label={`确认核对 ${row.id}`} onClick={() => onModal({ kind: 'confirmManifest', id: row.id })}>确认核对</Button> : null;
    const action = row.status === '草稿' ? { kind: 'export' as const, label: '示例文件' } : row.status === '已导出' ? { kind: 'send' as const, label: '记录发送' } : row.status === '已发送，待回运单' ? { kind: 'trackingNo' as const, label: '登记运单' } : { kind: 'tracking' as const, label: '更新物流' };
    return <Button variant="text" theme="primary" aria-label={`${action.label} ${row.id}`} onClick={() => onModal({ kind: action.kind, id: row.id })}>{action.label}</Button>;
  };
  const columns: PrimaryTableCol<ListRow>[] = [
    { colKey: 'select', type: 'multiple', fixed: 'left', width: 40, checkProps: ({ row }) => ({ label: <span className="sr-only">选择 {row.id}</span> }) },
    { colKey: 'id', title: page === 'schedule' ? '排期编号 / 采购订单' : page === 'preparation' ? '资料单号 / 创建日期' : '物流单号 / 创建日期', width: 172, cell: ({ row }) => <div className="cell-stack"><Button variant="text" theme="primary" onClick={() => detail(row)}>{row.id}</Button><span className="secondary numeric">{row.order || row.date}</span></div> },
    { colKey: 'party', title: page === 'schedule' ? '采购商品 / 供应商' : page === 'preparation' ? '供应商 / 商品' : '物流商 / 运单号', width: 210, cell: ({ row }) => <div className="cell-stack"><span className="product-name">{page === 'schedule' ? row.product : row.party}</span><span className="secondary">{page === 'schedule' ? row.party : page === 'preparation' ? row.product : row.trackingNo || '待登记运单'}</span></div> },
    { colKey: 'warehouse', title: page === 'schedule' ? '目的仓 / 出货日期' : '目的仓 / 站点', width: 156, cell: ({ row }) => <div className="cell-stack"><span className={!row.warehouse ? 'pending-field' : undefined}>{row.warehouse || '待补充目的仓'}</span><span className="secondary">{page === 'schedule' ? row.date : row.site}</span></div> },
    { colKey: 'quantity', title: '件数 / 箱数', width: 104, align: 'right', cell: ({ row }) => <div className="cell-stack align-end numeric"><strong>{quantity(row.quantity)} 件</strong><span className="secondary">{row.boxes} 箱</span></div> },
    ...(page === 'preparation' ? [{ colKey: 'progress', title: '已确认 / 已分配', align: 'right', width: 128, cell: ({ row }) => <span className="numeric">{quantity(row.confirmed!)} / {quantity(row.allocated!)}</span> }] satisfies PrimaryTableCol<ListRow>[] : [{ colKey: 'transport', title: page === 'schedule' ? '排期运输' : '实际运输 / 物流节点', width: 150, cell: ({ row }) => <div className="cell-stack"><span>{row.transport}</span>{page === 'dispatch' && <span className="secondary">{row.trackingStage || '尚未登记运单'}</span>}</div> }] satisfies PrimaryTableCol<ListRow>[]),
    { colKey: 'status', title: '状态', width: page === 'dispatch' ? 160 : 124, cell: ({ row }) => tag(row.status) },
    { colKey: 'action', title: '操作', fixed: 'right', width: 150, cell: ({ row }) => <div className="row-buttons"><Button variant="text" theme="primary" onClick={() => detail(row)}>详情</Button>{nextAction(row)}</div> },
  ];
  function exportRows() {
    const chosen = selected.length ? visible.filter(row => selected.includes(row.id)) : visible;
    exportDemo(shippingPages[page], ['编号', '日期', '供应商或物流商', '目的仓', '件数', '箱数', '状态'], chosen.map(row => [row.id, row.date, row.party, row.warehouse, row.quantity, row.boxes, row.status]));
    void MessagePlugin.success(`已导出 ${chosen.length} 条示例记录`);
  }
  return <>
    <h1 className="sr-only">{shippingPages[page]}</h1>
    <section className="filter-panel" aria-label={`筛选${shippingPages[page]}`}><form onSubmit={event => { event.preventDefault(); setApplied({ ...filters }); setSelected([]); setCurrent(1); }}>
      <ListFilterToolbar fields={<><label className="keyword-filter"><span>关键词</span><Input value={filters.query} onChange={query => setFilters({ ...filters, query })} prefixIcon={<SearchIcon />} clearable aria-label={`${shippingPages[page]}关键词`} placeholder={page === 'dispatch' ? '物流单号、物流商、运单号' : '编号、品名、供应商'} /></label><label><span>目的仓</span><Select value={filters.warehouse} onChange={value => setFilters({ ...filters, warehouse: String(value || '') })} options={opts(warehouses)} inputProps={{ name: `${page}-warehouse` }} clearable placeholder="全部目的仓" /></label><label className="date-filter"><span>{page === 'schedule' ? '计划出货日期' : '创建日期'}</span><DateRangePicker value={filters.dates} onChange={values => setFilters({ ...filters, dates: values.map(String) })} clearable /></label></>} create={page !== 'schedule' ? <Button theme="primary" icon={<AddIcon />} onClick={() => onModal({ kind: 'picker', page })}>{page === 'preparation' ? '从排期选货' : '新建物流单'}</Button> : undefined} batch={page === 'schedule' ? <Button variant="outline" icon={<CheckIcon />} disabled={!selected.length || visible.some(row => selected.includes(row.id) && row.status !== '草稿')} onClick={() => onModal({ kind: 'confirmSchedules', ids: selected.map(String) })}>确认所选排期{selected.length ? `（${selected.length}）` : ''}</Button> : undefined} fileActions={<><CsvImportButton title={shippingPages[page]} data={{ headers: ['编号', '日期', '供应商或物流商', '目的仓', '件数', '箱数', '状态'], rows: visible.map(row => [row.id, row.date, row.party, row.warehouse, row.quantity, row.boxes, row.status]) }} />{<Button variant="outline" icon={<DownloadIcon />} onClick={exportRows}>{selected.length ? '导出所选' : '导出当前筛选'}</Button>}</>} query={<Button type="submit">查询</Button>} reset={<Button onClick={reset}>重置</Button>} />
      
    </form></section>
    <section className="list-panel" aria-label={`${shippingPages[page]}列表`}><div className="list-heading"><Tabs value={stage} onChange={value => { setStage(String(value)); setSelected([]); setCurrent(1); }}>{stages.map(value => <Tabs.TabPanel key={value} value={value} label={<button className="tab-label" aria-pressed={stage === value}>{value}<span className="tab-count">{filtered.filter(row => value === '全部' || row.status === value).length}</span></button>} />)}</Tabs>
      <div className={`list-meta${selected.length ? ' has-selection' : ''}`}><div className="selection-summary" aria-live="polite">{selected.length ? <>已选 <strong>{selected.length}</strong> 条<Button variant="text" theme="primary" onClick={() => setSelected([])}>取消选择</Button></> : <><strong>{visible.length}</strong> 条记录</>}<span className="toolbar-hint">{page === 'schedule' ? '确认计划后进入出货核对' : page === 'preparation' ? '核对与物流分配分别计量' : '文件、运单与物流反馈集中维护'}</span></div></div></div>
      <div className="table-scroll shipping-table" tabIndex={0} role="region" aria-label={`${shippingPages[page]}表格，可横向滚动`}><PrimaryTable rowKey="id" data={visible} columns={columns} hover size="small" tableLayout="fixed" selectedRowKeys={selected} onSelectChange={setSelected} pagination={{ current, pageSize, total: visible.length, pageSizeOptions: [10, 20, 50], showJumper: true }} onPageChange={info => { setCurrent(info.current); setPageSize(info.pageSize); }} empty={<Empty title="没有符合条件的记录" description="调整筛选条件，或重置查看全部示例。" action={<Button variant="outline" onClick={reset}>重置筛选</Button>} />} /></div>
    </section>
  </>;
}

function GoodsTable({ rows }: { rows: Goods[] }) {
  const columns: PrimaryTableCol<Goods>[] = [
    { colKey: 'product', title: '品名 / 来源', width: 200, cell: ({ row }) => <div className="cell-stack"><strong>{row.product}</strong><span className="secondary">{row.scheduleId}</span></div> },
    { colKey: 'warehouse', title: '目的仓', width: 130 },
    { colKey: 'quantity', title: '件数 / 箱数', align: 'right', width: 112, cell: ({ row }) => <span className="numeric">{quantity(row.quantity)} / {row.quantity / row.carton}</span> },
    { colKey: 'carton', title: '每箱件数', align: 'right', width: 96 },
  ];
  return <div className="shipping-goods-scroll" tabIndex={0} role="region" aria-label="出货商品与来源，可横向滚动"><PrimaryTable rowKey="id" columns={columns} data={rows} size="small" tableLayout="fixed" /></div>;
}

function ShippingDetail({ state, page, id, onClose }: { state: ShippingState; page: ShippingPage; id: string; onClose: () => void }) {
  const row = listRows(state, page).find(row => row.id === id)!;
  const schedule = page === 'schedule' ? state.schedules.find(row => row.id === id) : undefined;
  const manifest = page === 'preparation' ? state.manifests.find(row => row.id === id) : undefined;
  const dispatch = page === 'dispatch' ? state.dispatches.find(row => row.id === id) : undefined;
  const lines = schedule ? [schedule] : manifest?.lines || dispatch!.lines;
  const timeline = schedule?.timeline || manifest?.timeline || dispatch!.timeline;
  const pairs = schedule ? [['采购订单', schedule.order], ['采购商品', schedule.product], ['供应商', schedule.supplier], ['站点', schedule.site], ['目的仓', schedule.warehouse || '待补充'], ['预计交期', schedule.delivery], ['计划出货', schedule.date], ['排期运输', schedule.transport], ['提货仓', schedule.pickup], ['备注', schedule.remark || '—']] : manifest ? [['供应商', manifest.supplier], ['目的仓', row.warehouse], ['待核对', `${quantity(row.quantity - row.confirmed!)} 件`], ['待分配物流', `${quantity(row.confirmed! - row.allocated!)} 件`]] : [['物流商', dispatch!.carrier], ['目的仓', dispatch!.warehouse], ['采用模板', dispatch!.template], ['实际运输', dispatch!.transport], ['变更原因', dispatch!.changeReason || '—'], ['示例文件', dispatch!.file || '尚未生成'], ['运单号', dispatch!.trackingNo || '待登记'], ['物流节点', dispatch!.trackingStage || '尚未登记运单']];
  return <DetailDrawer title={`${shippingPages[page]}详情`} timeline={timeline} onClose={onClose}><div className="detail-content"><div className="detail-title"><div><h2>{id}</h2><span className="secondary">{row.party}</span></div>{tag(row.status)}</div>
    <h3>数量概览</h3><div className="quantity-overview">{(manifest ? [['总件数', row.quantity], ['已确认', row.confirmed!], ['已分配', row.allocated!], ['箱数', row.boxes]] : [['件数', row.quantity], ['箱数', row.boxes], ['体积 m³', Number(totalVolume(lines).toFixed(3))]]).map(([label, value]) => <div key={label}><span>{label}</span><strong>{quantity(Number(value))}</strong></div>)}</div>
    <h3>{page === 'schedule' ? '出货安排' : page === 'preparation' ? '核对资料' : '承运与运单'}</h3><dl>{pairs.map(([label, value]) => <div className="detail-pair" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    {!schedule && <><h3>商品与来源</h3><GoodsTable rows={lines} /></>}
    {dispatch && <><h3>最新物流信息</h3><p className="tracking-original">{dispatch.trackingText || '暂无物流反馈'}</p></>}
  </div></DetailDrawer>;
}
