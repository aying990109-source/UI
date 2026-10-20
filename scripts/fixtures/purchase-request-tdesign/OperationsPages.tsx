import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Button, DateRangePicker, Dropdown, Empty, Input, MessagePlugin, PrimaryTable, Radio, Select, Tabs, Tag, Textarea, type PrimaryTableCol } from 'tdesign-react';
import { AddIcon, ChevronDownIcon, ChevronRightIcon, DownloadIcon, MoreIcon, SearchIcon } from 'tdesign-icons-react';
import { DetailDrawer } from './DetailDrawer';
import { CsvImportButton } from './FileTransferActions';
import type { FileTable } from './file-transfer-data';
import { ListFilterToolbar } from './ListFilterToolbar';
import { PreviewForm } from './PreviewForm';
import { ListingForm, ReplenishmentForm } from './OperationsForms';
import { exportDemo, quantity } from './processing-data';
import { allowance, changeListing, changeReplenishment, groups, initialOperationsState, inventoryProducts, inventoryValues, operationPages, reserved, type OperationsState, type Supply } from './operations-data';

type RequestPage = 'replenishment' | 'listing';
type Modal = { kind: 'new'; page: RequestPage } | { kind: 'detail'; page: RequestPage | 'inventory'; id: string } | { kind: 'edit'; id: string } | { kind: 'decision' | 'withdraw' | 'identity'; page: RequestPage; id: string };
const options = (values: string[]) => values.map(value => ({ value, label: value }));
const number = (value: number | null) => value === null ? '待核对' : quantity(value);
const statusTag = (status: string) => <Tag variant="light" size="small" theme={status === '已完成' ? 'success' : status === '已驳回' ? 'danger' : status === '已撤回' ? 'default' : status === '待发货' ? 'primary' : 'warning'}>{status}</Tag>;

export function OperationsPages({ active }: { active: string }) {
  const [state, setState] = useState(initialOperationsState), [modal, setModal] = useState<Modal | null>(null);
  const close = () => setModal(null), save = (next: OperationsState, message = '已保存本地示例') => { setState(next); close(); void MessagePlugin.success(message); };
  return <>
    {(['replenishment', 'listing'] as const).map(page => <div key={page} hidden={active !== page}><RequestList page={page} state={state} open={setModal} /></div>)}
    <div hidden={active !== 'inventory'}><InventoryList state={state} open={setModal} /></div>
    {modal?.kind === 'new' && modal.page === 'replenishment' && <ReplenishmentForm state={state} onClose={close} onSave={next => save(next, '示例补货申请已提交')} />}
    {(modal?.kind === 'new' && modal.page === 'listing' || modal?.kind === 'edit') && <ListingForm state={state} row={modal?.kind === 'edit' ? state.listings.find(row => row.id === modal.id) : undefined} onClose={close} onSave={next => save(next, '示例上架申请已提交')} />}
    {modal?.kind === 'detail' && <OperationDetail state={state} modal={modal} close={close} />}
    {modal && ['decision', 'withdraw', 'identity'].includes(modal.kind) && 'page' in modal && <RequestAction state={state} modal={modal as Extract<Modal, { kind: 'decision' | 'withdraw' | 'identity' }>} onClose={close} onSave={save} />}
  </>;
}

type Filters = { query: string; group: string; dates: string[] };
function FilterPanel({ page, filters, setFilters, apply, reset, create, actions, importData }: { page: keyof typeof operationPages; filters: Filters; setFilters: (filters: Filters) => void; apply: () => void; reset: () => void; create?: ReactNode; actions: ReactNode[]; importData: FileTable }) {
  return <section className="filter-panel" aria-label={`筛选${operationPages[page]}`}><form onSubmit={event => { event.preventDefault(); apply(); }}><ListFilterToolbar
    create={create} fileActions={<><CsvImportButton title={operationPages[page]} data={importData} />{actions}</>} active={[!!filters.query, !!filters.group, !!filters.dates.length]}
    fields={[
      <label key="query" className="keyword-filter"><span>关键词</span><Input value={filters.query} onChange={query => setFilters({ ...filters, query })} prefixIcon={<SearchIcon />} aria-label={`${operationPages[page]}关键词`} placeholder={page === 'inventory' ? '品名、采购来源编码' : '申请编号、品名、店铺'} clearable /></label>,
      <label key="group"><span>所属小组</span><Select value={filters.group} options={options(groups)} clearable placeholder="全部小组" inputProps={{ name: `${page}-group` }} onChange={value => setFilters({ ...filters, group: String(value || '') })} /></label>,
      ...(page !== 'inventory' ? [<label key="dates" className="date-filter"><span>申请日期</span><DateRangePicker value={filters.dates} clearable onChange={value => setFilters({ ...filters, dates: value.map(String) })} /></label>] : []),
    ]}
    query={<Button type="submit" theme={create ? 'default' : 'primary'} variant={create ? 'outline' : 'base'}>查询</Button>}
    reset={<Button type="button" variant="text" onClick={reset}>重置</Button>}
  /></form></section>;
}

function RequestList({ page, state, open }: { page: RequestPage; state: OperationsState; open: (modal: Modal) => void }) {
  const empty: Filters = { query: '', group: '', dates: [] };
  const [filters, setFilters] = useState(empty), [applied, setApplied] = useState(empty), [stage, setStage] = useState('全部'), [selected, setSelected] = useState<(string | number)[]>([]), [current, setCurrent] = useState(1), [pageSize, setPageSize] = useState(10);
  const rows = page === 'listing' ? state.listings.map(row => ({ ...row, metric: `${row.shop.includes('CA') ? 'CAD' : 'USD'} ${row.price.toFixed(2)}`, secondary: row.ean || '审批后分配示例 EAN' })) : state.replenishments.map(row => { const source = state.sources.find(source => source.id === row.sourceId)!; return { ...row, product: source.product, metric: `${quantity(row.quantity)} 件`, secondary: `${row.quantity / source.carton} 箱 · ${source.group === row.group ? '同组' : '跨组'}` }; });
  type Row = (typeof rows)[number];
  const filtered = rows.filter(row => (!applied.query.trim() || `${row.id} ${row.product} ${row.shop}`.toLowerCase().includes(applied.query.trim().toLowerCase())) && (!applied.group || row.group === applied.group) && (!applied.dates[0] || row.date >= applied.dates[0]) && (!applied.dates[1] || row.date <= applied.dates[1]));
  const visible = filtered.filter(row => stage === '全部' || row.status === stage), ids = visible.map(row => row.id).join('|');
  useEffect(() => { const allowed = new Set(ids.split('|')); setSelected(previous => previous.filter(id => allowed.has(String(id)))); setCurrent(previous => Math.min(previous, Math.max(1, Math.ceil(visible.length / pageSize)))); }, [ids, pageSize]);
  const reset = () => { setFilters(empty); setApplied(empty); setStage('全部'); setSelected([]); setCurrent(1); };
  const detail = (id: string) => open({ kind: 'detail', page, id });
  const stages = page === 'listing' ? ['全部', '待审批', '已完成', '已驳回', '已撤回'] : ['全部', '待货源确认', '待申请审批', '待发货', '已驳回', '已撤回'];
  const columns: PrimaryTableCol<Row>[] = [
    { colKey: 'select', type: 'multiple', width: 40, fixed: 'left', checkProps: ({ row }) => ({ label: <span className="sr-only">选择 {row.id}</span> }) },
    { colKey: 'id', title: '申请编号 / 日期', width: 180, cell: ({ row }) => <div className="cell-stack"><Button theme="primary" variant="text" onClick={() => detail(row.id)}>{row.id}</Button><span className="secondary">{row.date}</span></div> },
    { colKey: 'product', title: '商品 / 所属小组', width: 190, cell: ({ row }) => <div className="cell-stack"><span className="product-name">{row.product}</span><span className="secondary">{row.group}</span></div> },
    { colKey: 'shop', title: '店铺 / 申请人', width: 220, cell: ({ row }) => <div className="cell-stack"><span>{row.shop}</span><span className="secondary">演示用户</span></div> },
    { colKey: 'metric', title: page === 'listing' ? '定价 / 示例 EAN' : '申请件数 / 箱数', width: 180, cell: ({ row }) => <div className="cell-stack numeric"><strong>{row.metric}</strong><span className="secondary">{row.secondary}</span></div> },
    { colKey: 'status', title: '状态', width: 116, cell: ({ row }) => statusTag(row.status) },
    { colKey: 'actions', title: '操作', fixed: 'right', width: 160, cell: ({ row }) => { const pending = ['待审批', '待货源确认', '待申请审批'].includes(row.status); return <div className="row-buttons"><Button variant="text" theme="primary" onClick={() => detail(row.id)}>详情</Button>{pending ? <><Button variant="text" theme="primary" aria-label={`审批 ${row.id}`} onClick={() => open({ kind: 'decision', page, id: row.id })}>{row.status === '待货源确认' ? '确认货源' : '审批'}</Button><Dropdown trigger="click" options={[...(page === 'listing' ? [{ content: '修改并提交', value: 'edit' }] : []), { content: '撤回申请', value: 'withdraw' }]} onClick={data => open(data.value === 'edit' ? { kind: 'edit', id: row.id } : { kind: 'withdraw', page, id: row.id })}><Button variant="text" shape="square" icon={<MoreIcon />} aria-label={`更多操作 ${row.id}`} /></Dropdown></> : page === 'listing' && <Button variant="text" theme="primary" aria-label={`${row.status === '已完成' ? '补充资料' : '修改重提'} ${row.id}`} onClick={() => open(row.status === '已完成' ? { kind: 'identity', page, id: row.id } : { kind: 'edit', id: row.id })}>{row.status === '已完成' ? '补充资料' : '修改重提'}</Button>}</div>; } },
  ];
  function download() { const chosen = selected.length ? visible.filter(row => selected.includes(row.id)) : visible; exportDemo(operationPages[page], ['编号', '商品', '小组', '店铺', page === 'listing' ? '定价' : '申请量', '状态'], chosen.map(row => [row.id, row.product, row.group, row.shop, row.metric, row.status])); void MessagePlugin.success(`已导出 ${chosen.length} 条示例记录`); }
  return <><h1 className="sr-only">{operationPages[page]}</h1><FilterPanel importData={{ headers: ['编号', '商品', '小组', '店铺', page === 'listing' ? '定价' : '申请量', '状态'], rows: visible.map(row => [row.id, row.product, row.group, row.shop, row.metric, row.status]) }} page={page} filters={filters} setFilters={setFilters} apply={() => { setApplied({ ...filters }); setCurrent(1); setSelected([]); }} reset={reset} create={<Button theme="primary" icon={<AddIcon />} onClick={() => open({ kind: 'new', page })}>新建{operationPages[page]}</Button>} actions={[<Button key="export" variant="outline" icon={<DownloadIcon />} onClick={download}>{selected.length ? '导出所选' : '导出当前筛选'}</Button>]} />
    <section className="list-panel" aria-label={`${operationPages[page]}列表`}><div className="list-heading"><Tabs value={stage} onChange={value => { setStage(String(value)); setCurrent(1); setSelected([]); }}>{stages.map(value => <Tabs.TabPanel key={value} value={value} label={<button className="tab-label" aria-pressed={stage === value}>{value}<span className="tab-count">{filtered.filter(row => value === '全部' || row.status === value).length}</span></button>} />)}</Tabs><div className="list-meta"><div className="selection-summary" aria-live="polite"><strong>{selected.length || visible.length}</strong>{selected.length ? <>条已选<Button variant="text" theme="primary" onClick={() => setSelected([])}>取消选择</Button></> : '条申请'}<span className="toolbar-hint">{page === 'listing' ? '商品刊登审批，与实物上架分别记录' : '按采购来源申请，审批与发货分开处理'}</span></div></div></div>
      <div className="table-scroll operations-table" role="region" tabIndex={0} aria-label={`${operationPages[page]}表格，可横向滚动`}><PrimaryTable rowKey="id" data={visible} columns={columns} size="small" hover tableLayout="fixed" selectedRowKeys={selected} onSelectChange={setSelected} pagination={{ current, pageSize, total: visible.length, showJumper: true, pageSizeOptions: [10, 20, 50] }} onPageChange={info => { setCurrent(info.current); setPageSize(info.pageSize); }} empty={<Empty title="没有符合条件的申请" action={<Button variant="outline" onClick={reset}>重置筛选</Button>} />} /></div>
    </section></>;
}

function InventoryList({ state, open }: { state: OperationsState; open: (modal: Modal) => void }) {
  const empty: Filters = { query: '', group: '', dates: [] };
  const [filters, setFilters] = useState(empty), [applied, setApplied] = useState(empty), [expanded, setExpanded] = useState<(string | number)[]>([]), [stage, setStage] = useState('全部'), [current, setCurrent] = useState(1);
  const rows = inventoryProducts(state, applied.query, applied.group), visible = rows.filter(row => stage === '全部' || row.incomplete);
  type Row = (typeof rows)[number];
  const reset = () => { setFilters(empty); setApplied(empty); setStage('全部'); setExpanded([]); setCurrent(1); };
  const columns: PrimaryTableCol<Row>[] = [
    { colKey: 'product', title: '品名 / 来源小组', width: 274, cell: ({ row }) => <div className="cell-stack"><Button variant="text" theme="primary" icon={expanded.includes(row.id) ? <ChevronDownIcon /> : <ChevronRightIcon />} aria-expanded={expanded.includes(row.id)} onClick={() => setExpanded(expanded.includes(row.id) ? expanded.filter(id => id !== row.id) : [...expanded, row.id])}>{row.id}</Button><span className="secondary">{row.group} · {row.sources.length} 个采购来源</span></div> },
    ...(['pending', 'transit', 'available', 'total'] as const).map((key, i) => ({ colKey: key, title: ['待出货', '未占用在途', '可用库存', '合计'][i], align: 'right' as const, width: 132, cell: ({ row }: { row: Row }) => <span className={`numeric${row.incomplete ? ' pending-field' : ''}`}>{number(row[key])}</span> })),
    { colKey: 'status', title: '数据状态', width: 130, cell: ({ row }) => row.incomplete ? <Tag size="small" theme="warning" variant="light">含待核对来源</Tag> : <span className="secondary">已核对</span> },
  ];
  const sourceColumns: PrimaryTableCol<Supply>[] = [
    { colKey: 'id', title: '采购来源 / 规格', width: 240, cell: ({ row }) => <div className="cell-stack"><Button variant="text" theme="primary" onClick={() => open({ kind: 'detail', page: 'inventory', id: row.id })}>{row.id}</Button><span className="secondary">{row.model} · {row.sku}</span></div> },
    { colKey: 'group', title: '归属 / 所在仓', width: 210, cell: ({ row }) => <div className="cell-stack"><span>{row.group}</span><span className="secondary">{row.warehouse}</span></div> },
    ...(['pending', 'transit', 'available'] as const).map((key, i) => ({ colKey: key, title: ['待出货', '未占用在途', '可用库存'][i], width: 120, align: 'right' as const, cell: ({ row }: { row: Supply }) => number(inventoryValues(state, row)[key]) })),
    { colKey: 'detail', title: '操作', width: 100, cell: ({ row }) => <Button variant="text" theme="primary" onClick={() => open({ kind: 'detail', page: 'inventory', id: row.id })}>来源详情</Button> },
  ];
  return <><h1 className="sr-only">库存明细</h1><FilterPanel importData={{ headers: ['品名', '小组', '待出货', '未占用在途', '可用库存', '合计'], rows: visible.map(row => [row.id, row.group, number(row.pending), number(row.transit), number(row.available), number(row.total)]) }} page="inventory" filters={filters} setFilters={setFilters} apply={() => { setApplied({ ...filters }); setCurrent(1); setExpanded([]); }} reset={reset} actions={[<Button key="export" variant="outline" icon={<DownloadIcon />} onClick={() => { exportDemo('库存明细', ['品名', '小组', '待出货', '未占用在途', '可用库存', '合计'], visible.map(row => [row.id, row.group, number(row.pending), number(row.transit), number(row.available), number(row.total)])); void MessagePlugin.success('已导出当前示例汇总'); }}>导出当前筛选</Button>]} />
    <section className="list-panel" aria-label="库存明细列表"><div className="list-heading"><Tabs value={stage} onChange={value => { setStage(String(value)); setCurrent(1); }}>{['全部', '待核对'].map(value => <Tabs.TabPanel key={value} value={value} label={<button className="tab-label" aria-pressed={stage === value}>{value}<span className="tab-count">{value === '全部' ? rows.length : rows.filter(row => row.incomplete).length}</span></button>} />)}</Tabs><div className="list-meta"><div className="selection-summary"><strong>{visible.length}</strong> 个品名<span className="toolbar-hint">单位：件 · 合计＝待出货＋未占用在途＋可用库存</span></div></div></div><p className="inventory-note">按品名汇总展示，点击品名查看小组与采购来源。同名商品的规格和来源不能互换；合计不等于仓内实存量。</p>
      <div className="table-scroll operations-table" role="region" aria-label="库存明细表格，可横向滚动" tabIndex={0}><PrimaryTable rowKey="id" columns={columns} data={visible} size="small" hover tableLayout="fixed" expandIcon={false} expandedRowKeys={expanded} expandedRow={({ row }) => <div className="expanded-products"><PrimaryTable rowKey="id" size="small" data={row.sources} columns={sourceColumns} tableLayout="fixed" /></div>} pagination={{ current, pageSize: 10, total: visible.length, showJumper: true, showPageSize: false }} onPageChange={info => setCurrent(info.current)} empty={<Empty title="没有符合条件的库存来源" action={<Button variant="outline" onClick={reset}>重置筛选</Button>} />} /></div></section></>;
}

function RequestAction({ state, modal, onSave, onClose }: { state: OperationsState; modal: Extract<Modal, { kind: 'decision' | 'withdraw' | 'identity' }>; onSave: (state: OperationsState, message?: string) => void; onClose: () => void }) {
  const row = modal.page === 'listing' ? state.listings.find(row => row.id === modal.id)! : state.replenishments.find(row => row.id === modal.id)!;
  const [decision, setDecision] = useState('approve'), [reason, setReason] = useState(''), [asin, setAsin] = useState('asin' in row ? row.asin : ''), [brand, setBrand] = useState('brand' in row ? row.brand : ''), [error, setError] = useState('');
  const title = modal.kind === 'identity' ? '补充刊登资料' : modal.kind === 'withdraw' ? '撤回申请' : row.status === '待货源确认' ? '确认补货货源' : '申请审批';
  function submit() { try { const action = modal.kind === 'decision' ? decision as 'approve' | 'reject' : modal.kind; onSave(modal.page === 'listing' ? changeListing(state, row.id, action, { reason, asin, brand }) : changeReplenishment(state, row.id, action as 'approve' | 'reject' | 'withdraw', reason)); } catch (error) { setError((error as Error).message); requestAnimationFrame(() => document.getElementById('action-error')?.focus()); } }
  return <PreviewForm className="operations-form" title={title} dirty={decision !== 'approve' || !!reason || asin !== row.asin || ('brand' in row && brand !== row.brand)} onClose={onClose} onSave={submit} submit={modal.kind === 'identity' ? '保存示例资料' : '确认操作'}>
    <div className="shipping-template"><span>{row.id} · {row.group}</span><strong>{'product' in row ? row.product : state.sources.find(source => source.id === row.sourceId)?.product}</strong></div>
    {modal.kind === 'decision' && <><label><span>审批结果</span><Radio.Group value={decision} onChange={value => { setDecision(String(value)); setError(''); }} options={[{ label: row.status === '待货源确认' ? '确认货源' : '通过', value: 'approve' }, { label: '驳回', value: 'reject' }]} /></label><p className="secondary">{modal.page === 'listing' ? '通过后完成刊登申请并分配示例 EAN，不登记实物上架。' : row.status === '待货源确认' ? '确认货源后预留数量，仍需申请审批。' : '审批通过后进入待发货，本操作不会登记出库。'}</p>{decision === 'reject' && <label htmlFor="action-reason"><span>驳回原因 <em>*</em></span><Textarea value={reason} onChange={setReason} /></label>}</>}
    {modal.kind === 'withdraw' && <p>撤回后保留本申请及历史。{modal.page === 'replenishment' ? '已预留的本申请数量将释放。' : '可修改后重新提交。'}</p>}
    {modal.kind === 'identity' && <><label htmlFor="identity-asin"><span>ASIN</span><Input value={asin} onChange={setAsin} /></label><label htmlFor="identity-brand"><span>品牌</span><Input value={brand} onChange={setBrand} /></label><p className="secondary">保留原示例 EAN，不重复发码。</p></>}
    {error && <div id="action-error" tabIndex={-1} role="alert"><Alert theme="error" message={error} /></div>}
  </PreviewForm>;
}

function OperationDetail({ state, modal, close }: { state: OperationsState; modal: Extract<Modal, { kind: 'detail' }>; close: () => void }) {
  if (modal.page === 'inventory') {
    const row = state.sources.find(source => source.id === modal.id)!, values = inventoryValues(state, row);
    return <DetailDrawer title="库存来源详情" timeline={row.timeline} onClose={close}><div className="detail-content"><div className="detail-title"><div><h2>{row.id}</h2><span className="secondary">{row.product} · {row.model}</span></div></div>{values.issue && <Alert theme="warning" message="运输数量超过下单数量，派生库存暂不显示。请核对来源事实。" />}<h3>数量概览</h3><div className="quantity-overview">{([['待出货', values.pending], ['未占用在途', values.transit], ['可用库存', values.available], ['合计', values.total]] as const).map(([label, value]) => <div key={label}><span>{label}</span><strong>{number(value)}</strong></div>)}</div><h3>来源与口径</h3><dl><dt>小组 / 所在仓</dt><dd>{row.group} / {row.warehouse}</dd><dt>有效下单量</dt><dd>{row.ordered} 件</dd><dt>已进入运输</dt><dd>{row.transported} 件</dd><dt>累计净上架</dt><dd>{row.shelved} 件</dd><dt>已发消耗 / 退回</dt><dd>{row.consumed} / {row.returned} 件</dd><dt>补货已预留</dt><dd>{reserved(state, row.id)} 件</dd><dt>可申请额度</dt><dd>{values.issue ? '待核对' : `${allowance(state, row)} 件`}</dd></dl><h3>实物上架记录</h3><div className="shelving-record"><strong>{row.shelved} 件 · 有效记录</strong><span>实物日期 2026-10-10 · {row.warehouse}</span><span>2026-10-11 09:00:00 · 仓库核对员（示例）</span></div><p className="secondary">记录来自本地合成实物事实。刊登审批与物流文字不会生成本记录。</p></div></DetailDrawer>;
  }
  if (modal.page === 'listing') {
    const row = state.listings.find(row => row.id === modal.id)!;
    return <DetailDrawer title="上架申请详情" timeline={row.timeline} onClose={close}><div className="detail-content"><div className="detail-title"><div><h2>{row.id}</h2><span className="secondary">{row.date} · {row.group}</span></div>{statusTag(row.status)}</div><h3>刊登资料</h3>{row.image ? <img className="listing-detail-image" src={row.image} alt={`${row.product} 主图`} /> : <p className="secondary">此历史样例未附主图，新建时须选择主图。</p>}<dl><dt>品名</dt><dd>{row.product}</dd><dt>店铺</dt><dd>{row.shop}</dd><dt>定价</dt><dd>{row.shop.includes('CA') ? 'CAD' : 'USD'} {row.price.toFixed(2)}</dd><dt>标题</dt><dd>{row.title}</dd><dt>五点描述</dt><dd className="tracking-original">{row.bullets}</dd><dt>示例 EAN</dt><dd>{row.ean || '审批后分配'}</dd><dt>ASIN / 品牌</dt><dd>{row.asin || '未补充'} / {row.brand || '未补充'}</dd><dt>备注</dt><dd>{row.remark || '—'}</dd></dl><p className="secondary">EAN 为样板标识，不是正式条码；申请完成不表示实物入仓或刊登上线。</p></div></DetailDrawer>;
  }
  const row = state.replenishments.find(row => row.id === modal.id)!, source = state.sources.find(source => source.id === row.sourceId)!;
  return <DetailDrawer title="补货申请详情" timeline={row.timeline} onClose={close}><div className="detail-content"><div className="detail-title"><div><h2>{row.id}</h2><span className="secondary">{source.product} · {row.group}</span></div>{statusTag(row.status)}</div><h3>申请与预留</h3><div className="quantity-overview"><div><span>申请数量</span><strong>{row.quantity} 件</strong></div><div><span>本申请预留</span><strong>{['待申请审批', '待发货'].includes(row.status) ? row.quantity : 0} 件</strong></div><div><span>申请箱数</span><strong>{row.quantity / source.carton} 箱</strong></div></div><h3>采购来源</h3><dl><dt>采购编码</dt><dd>{source.id}</dd><dt>来源小组</dt><dd>{source.group}</dd><dt>申请小组</dt><dd>{row.group}</dd><dt>来源当前额度</dt><dd>{allowance(state, source)} 件</dd><dt>所在地</dt><dd>{source.warehouse}</dd><dt>ERP 店铺</dt><dd>{row.shop}</dd><dt>ASIN</dt><dd>{row.asin}</dd><dt>FNSKU</dt><dd>{row.fnsku}</dd><dt>MSKU</dt><dd>{row.msku}</dd><dt>备注</dt><dd>{row.remark || '—'}</dd></dl><p className="secondary">此样板演示至待发货，不表示已出库、FBA 收货或上架。</p></div></DetailDrawer>;
}

