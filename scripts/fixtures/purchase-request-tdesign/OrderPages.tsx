import { CsvImportButton } from './FileTransferActions';
import { ListFilterToolbar } from './ListFilterToolbar';
import { useEffect, useState } from 'react';
import { Button, DateRangePicker, Dropdown, Empty, Input, MessagePlugin, PrimaryTable, Select, Tabs, Tag, type PrimaryTableCol } from 'tdesign-react';
import { AddIcon, DownloadIcon, EditIcon, FileIcon, MoreIcon, SearchIcon } from 'tdesign-icons-react';
import { DetailDrawer } from './DetailDrawer';
import { AfterSaleForm, DailyForm, OrderCreateForm, ParcelForm, ReshipmentDeleteForm, options } from './OrderForms';
import { exportDemo } from './processing-data';
import { afterTimeline, allocated, currentReshipments, initialOrderState, orderGroups, orderPages, reshipmentStage, type OrderState, type Reshipment } from './order-data';

type Page = keyof typeof orderPages;
type Modal = { kind: 'detail'; page: Page; id: string } | { kind: 'new'; page: 'afterSales' | 'reshipments' } | { kind: 'daily'; ids: string[] } | { kind: 'follow' | 'close' | 'reopen' | 'parcel' | 'delete'; id: string };
type ListRow = { id: string; order: string; date: string; shop: string; group: string; product: string; subtitle: string; quantity: number; status: string; progress: string };
const tag = (status: string) => <Tag variant="light" size="small" theme={['已发货', '已签收', '已结案'].includes(status) ? 'success' : status === '需跟进' ? 'danger' : status === '处理中' || status === '已登记' ? 'primary' : 'warning'}>{status}</Tag>;

export function OrderPages({ active }: { active: string }) {
  const [state, setState] = useState(initialOrderState), [modal, setModal] = useState<Modal | null>(null);
  const close = () => setModal(null), save = (next: OrderState) => { setState(next); close(); void MessagePlugin.success('已保存本地示例'); };
  return <>
    {(Object.keys(orderPages) as Page[]).map(page => <div key={page} hidden={active !== page}><OrderList page={page} state={state} open={setModal} /></div>)}
    {modal?.kind === 'new' && <OrderCreateForm state={state} page={modal.page} onClose={close} onSave={save} />}
    {modal?.kind === 'daily' && <DailyForm state={state} ids={modal.ids} onClose={close} onSave={save} />}
    {modal && ['follow', 'close', 'reopen'].includes(modal.kind) && 'id' in modal && <AfterSaleForm state={state} row={state.afterSales.find(row => row.id === modal.id)!} action={modal.kind as 'follow' | 'close' | 'reopen'} onClose={close} onSave={save} />}
    {modal?.kind === 'parcel' && <ParcelForm state={state} row={state.reshipments.find(row => row.id === modal.id)!} onClose={close} onSave={save} />}
    {modal?.kind === 'delete' && <ReshipmentDeleteForm state={state} row={state.reshipments.find(row => row.id === modal.id)!} onClose={close} onSave={save} />}
    {modal?.kind === 'detail' && <OrderDetail state={state} page={modal.page} id={modal.id} onClose={close} open={setModal} />}
  </>;
}

function OrderList({ state, page, open }: { state: OrderState; page: Page; open: (modal: Modal) => void }) {
  const empty = { query: '', group: '', dates: [] as string[] };
  const [filters, setFilters] = useState(empty), [applied, setApplied] = useState(empty), [stage, setStage] = useState('全部'), [selected, setSelected] = useState<(string | number)[]>([]), [current, setCurrent] = useState(1), [pageSize, setPageSize] = useState(10);
  const rows: ListRow[] = page === 'dailyShipping' ? state.daily.map(row => ({ ...row, subtitle: `${row.model} · ${row.color}`, progress: row.remark || '暂无内部备注' })) : page === 'afterSales' ? state.afterSales.map(row => {
    const links = currentReshipments(state, row.id);
    return { ...row, product: row.items.map(item => item.product || item.model || '未填写型号').join('、'), subtitle: row.reason, quantity: row.items.reduce((sum, item) => sum + item.quantity, 0), progress: links.length ? `${links.length} 次关联申请 · ${links.map(reshipmentStage).join(' / ')}` : row.nextDate ? `下次跟进 ${row.nextDate}` : '暂无关联补发' };
  }) : state.reshipments.filter(row => !row.deleted).map(row => ({ ...row, product: row.items.map(item => item.product || item.model || '未填写型号').join('、'), subtitle: `${row.purpose} · ${row.sourceId || '直接申请'}`, quantity: row.items.reduce((sum, item) => sum + item.quantity, 0), status: reshipmentStage(row), progress: row.parcels.length ? `${row.parcels.length} 个包裹 · ${row.parcels.map(parcel => parcel.status).join(' / ')}` : '等待维护发货资料' }));
  const filtered = rows.filter(row => (!applied.query.trim() || `${row.id} ${row.order} ${row.product} ${row.shop} ${row.subtitle}`.toLowerCase().includes(applied.query.trim().toLowerCase())) && (!applied.group || row.group === applied.group) && (!applied.dates[0] || row.date >= applied.dates[0]) && (!applied.dates[1] || row.date <= applied.dates[1]));
  const visible = filtered.filter(row => stage === '全部' || row.status === stage), keys = visible.map(row => row.id).join('|');
  useEffect(() => { const allowed = new Set(keys.split('|')); setSelected(previous => previous.filter(id => allowed.has(String(id)))); setCurrent(previous => Math.min(previous, Math.max(1, Math.ceil(visible.length / pageSize)))); }, [keys, pageSize]);
  const reset = () => { setFilters(empty); setApplied(empty); setStage('全部'); setSelected([]); setCurrent(1); };
  const detail = (id: string) => open({ kind: 'detail', page, id });
  const stages = page === 'dailyShipping' ? ['全部', '待发货', '已发货'] : page === 'afterSales' ? ['全部', '待处理', '处理中', '已结案'] : ['全部', '待登记', '已登记', '已签收', '需跟进'];
  const columns: PrimaryTableCol<ListRow>[] = [
    { colKey: 'select', type: 'multiple', width: 32, fixed: 'left', checkProps: ({ row }) => ({ label: <span className="sr-only">选择 {page === 'dailyShipping' ? `${row.order} ${row.subtitle}` : row.id}</span> }) },
    { colKey: 'id', title: page === 'dailyShipping' ? '系统单号 / 订单日期' : '记录编号 / 登记日期', width: 168, cell: ({ row }) => <div className="cell-stack"><Button variant="text" theme="primary" onClick={() => detail(row.id)}>{page === 'dailyShipping' ? row.order : row.id}</Button><span className="secondary">{row.date}</span></div> },
    { colKey: 'product', title: page === 'afterSales' ? '涉事商品 / 问题原因' : '商品 / 来源', width: 180, cell: ({ row }) => <div className="cell-stack"><span className="product-name">{row.product}</span><span className="secondary">{row.subtitle}</span></div> },
    { colKey: 'shop', title: '店铺 / 所属小组', width: 185, cell: ({ row }) => <div className="cell-stack"><span>{row.shop}</span><span className="secondary">{row.group}</span></div> },
    { colKey: 'quantity', title: '件数', width: 60, align: 'right', cell: ({ row }) => <strong className="numeric">{row.quantity}</strong> },
    { colKey: 'progress', title: page === 'dailyShipping' ? '内部备注' : '当前进度', width: 165, cell: ({ row }) => <div className="cell-stack"><span>{row.progress}</span>{page !== 'dailyShipping' && <span className="secondary">原始订单 {row.order}</span>}</div> },
    { colKey: 'status', title: page === 'afterSales' ? '售后状态' : page === 'dailyShipping' ? '发货状态' : '发货登记', width: 88, cell: ({ row }) => tag(row.status) },
    { colKey: 'actions', title: '操作', width: 128, fixed: 'right', cell: ({ row }) => <div className="row-buttons"><Button variant="text" theme="primary" aria-label={`详情 ${row.id}`} onClick={() => detail(row.id)}>详情</Button>
      {page === 'dailyShipping' ? <Button variant="text" theme="primary" aria-label={`维护 ${row.id}`} onClick={() => open({ kind: 'daily', ids: [row.id] })}>维护</Button> : page === 'afterSales' ? <><Button variant="text" theme="primary" aria-label={`${row.status === '已结案' ? '重开' : '跟进'} ${row.id}`} onClick={() => open({ kind: row.status === '已结案' ? 'reopen' : 'follow', id: row.id })}>{row.status === '已结案' ? '重开' : '跟进'}</Button>{row.status !== '已结案' && <Dropdown trigger="click" options={[{ content: '结案', value: 'close' }]} onClick={() => open({ kind: 'close', id: row.id })}><Button variant="text" shape="square" icon={<MoreIcon />} aria-label={`更多操作 ${row.id}`} /></Dropdown>}</> : <><Button variant="text" theme="primary" aria-label={`维护 ${row.id}`} onClick={() => open({ kind: 'parcel', id: row.id })}>维护</Button><Dropdown trigger="click" options={[{ content: '删除申请', value: 'delete' }]} onClick={() => open({ kind: 'delete', id: row.id })}><Button variant="text" shape="square" icon={<MoreIcon />} aria-label={`更多操作 ${row.id}`} /></Dropdown></>}
    </div> },
  ];
  const download = () => { const chosen = selected.length ? visible.filter(row => selected.includes(row.id)) : visible; exportDemo(orderPages[page], ['编号', '原始或系统订单', '商品', '小组', '店铺', '数量', '状态', '进度'], chosen.map(row => [row.id, row.order, row.product, row.group, row.shop, row.quantity, row.status, row.progress])); void MessagePlugin.success(`已导出 ${chosen.length} 条示例记录`); };
  return <><h1 className="sr-only">{orderPages[page]}</h1><section className="filter-panel" aria-label={`筛选${orderPages[page]}`}><form onSubmit={event => { event.preventDefault(); setApplied({ ...filters }); setCurrent(1); setSelected([]); }}><ListFilterToolbar fields={<>
    <label className="keyword-filter"><span>关键词</span><Input prefixIcon={<SearchIcon />} value={filters.query} onChange={query => setFilters({ ...filters, query })} clearable aria-label={`${orderPages[page]}关键词`} placeholder="编号、订单、商品、店铺" /></label><label><span>所属小组</span><Select value={filters.group} options={options(orderGroups)} onChange={value => setFilters({ ...filters, group: String(value || '') })} clearable placeholder="全部小组" inputProps={{ name: `${page}-group` }} /></label><label className="date-filter"><span>{page === 'dailyShipping' ? '订单日期' : '登记日期'}</span><DateRangePicker value={filters.dates} onChange={value => setFilters({ ...filters, dates: value.map(String) })} clearable /></label>
  </>} create={page !== 'dailyShipping' ? <Button theme="primary" icon={<AddIcon />} onClick={() => open({ kind: 'new', page })}>{page === 'afterSales' ? '登记售后' : '新建补发申请'}</Button> : undefined} batch={page === 'dailyShipping' ? <Button variant="outline" icon={<EditIcon />} disabled={!selected.length} onClick={() => open({ kind: 'daily', ids: selected.map(String) })}>批量维护发货</Button> : undefined} fileActions={<><CsvImportButton title={orderPages[page]} data={{ headers: ['编号', '原始或系统订单', '商品', '小组', '店铺', '数量', '状态', '进度'], rows: visible.map(row => [row.id, row.order, row.product, row.group, row.shop, row.quantity, row.status, row.progress]) }} />{<Button variant="outline" icon={<DownloadIcon />} onClick={download}>{selected.length ? '导出所选' : '导出当前筛选'}</Button>}</>} query={<Button type="submit">查询</Button>} reset={<Button onClick={reset}>重置</Button>} /></form></section>
    <section className="list-panel" aria-label={`${orderPages[page]}列表`}><div className="list-heading"><Tabs value={stage} onChange={value => { setStage(String(value)); setSelected([]); setCurrent(1); }}>{stages.map(value => <Tabs.TabPanel key={value} value={value} label={<button className="tab-label" aria-pressed={value === stage}>{value}<span className="tab-count">{filtered.filter(row => value === '全部' || row.status === value).length}</span></button>} />)}</Tabs><div className="list-meta"><div className="selection-summary" aria-live="polite"><strong>{selected.length || visible.length}</strong>{selected.length ? <>条已选<Button variant="text" theme="primary" onClick={() => setSelected([])}>取消选择</Button></> : page === 'dailyShipping' ? '条商品明细' : '条记录'}<span className="toolbar-hint">{page === 'dailyShipping' ? '同系统单号的发货状态与备注同步维护' : page === 'afterSales' ? '人工结案，补发签收不自动改变售后状态' : '多商品、多包裹；运输状态按实际登记'}</span></div></div></div>
      <div className="table-scroll operations-table order-table" role="region" tabIndex={0} aria-label={`${orderPages[page]}表格，可横向滚动`}><PrimaryTable rowKey="id" columns={columns} data={visible} size="small" hover tableLayout="fixed" selectedRowKeys={selected} onSelectChange={setSelected} pagination={{ current, pageSize, total: visible.length, showJumper: true, pageSizeOptions: [10, 20, 50] }} onPageChange={info => { setCurrent(info.current); setPageSize(info.pageSize); }} empty={<Empty title="没有符合条件的记录" action={<Button variant="outline" onClick={reset}>重置筛选</Button>} />} /></div>
    </section></>;
}

function Facts({ rows }: { rows: [string, string | number][] }) { return <dl>{rows.map(([key, value]) => <div className="detail-pair" key={key}><dt>{key}</dt><dd>{value || '未填写'}</dd></div>)}</dl>; }
function ParcelDetails({ row }: { row: Reshipment }) { return <>{row.parcels.length ? row.parcels.map((parcel, index) => <section className="order-detail-parcel" key={parcel.id}><h3>包裹 {index + 1} · {parcel.status}</h3><Facts rows={[["系统单号", parcel.order], ["渠道 / 运单", `${parcel.channel || '未填写'} / ${parcel.tracking || '未填写'}`], ["日期 / 处理人", `${parcel.date} / ${parcel.handler}`], ["分配商品", Object.entries(parcel.allocations).map(([id, quantity]) => `${row.items.find(item => item.id === id)?.model || '商品'} × ${quantity}`).join('；')]]} /></section>) : <p className="secondary">尚未登记包裹，申请和发货资料分别记录。</p>}</>; }
function OrderDetail({ state, page, id, onClose, open }: { state: OrderState; page: Page; id: string; onClose: () => void; open: (modal: Modal) => void }) {
  const daily = page === 'dailyShipping' ? state.daily.find(row => row.id === id) : undefined;
  const after = page === 'afterSales' ? state.afterSales.find(row => row.id === id) : undefined;
  const reshipment = page === 'reshipments' ? state.reshipments.find(row => row.id === id && !row.deleted) : undefined;
  const row = daily || after || reshipment;
  if (!row) return null;
  const status = daily?.status || after?.status || reshipmentStage(reshipment!);
  const items = daily ? state.daily.filter(item => item.order === daily.order) : (after || reshipment)!.items;
  return <DetailDrawer title={`${orderPages[page]}详情`} timeline={after ? afterTimeline(state, after) : row.timeline} onClose={onClose}><div className="detail-content">
    <div className="detail-title"><FileIcon /><div><h2>{daily ? daily.order : row.id}</h2><span className="secondary">{row.date} · {row.group}</span></div>{tag(status)}</div>
    <h3>订单与来源</h3><Facts rows={[[daily ? '系统单号' : '原始订单', row.order], ['店铺', row.shop], ['所属小组', row.group], ...(daily ? [['平台单号', daily.platform], ['国家 / 渠道', `${daily.country} / ${daily.channel}`], ['完整地址', daily.address]] as [string, string][] : [['登记来源', after ? '人工登记，未关联导入订单' : reshipment!.sourceId || '直接申请，未关联售后']] as [string, string][])]} />
    <h3>{daily ? `同单商品 · ${items.length} 条明细` : '商品明细'}</h3><ul className="shipping-confirm-list">{items.map(item => <li key={item.id}><strong>{item.product || item.model || '未填写品名'} × {item.quantity} 件</strong><span>{item.model || '型号未填写'} · {item.color || '颜色未填写'}{reshipment ? ` · 已分配 ${allocated(reshipment, item.id)} 件` : ''}</span></li>)}</ul>
    {daily && <><h3>内部备注</h3><p className="tracking-original">{daily.remark || '暂无备注'}</p><p className="secondary">同系统单号下全部商品共用；来源字段仅供查阅。</p></>}
    {after && <><h3>问题与处理计划</h3><Facts rows={[["问题原因", after.reason], ["问题描述", after.description], ["下次跟进", after.nextDate || '未安排'], ["结案说明", after.resolution || '尚未结案']]} /><h3>当前关联补发</h3>{currentReshipments(state, after.id).length ? currentReshipments(state, after.id).map(request => <div className="order-linked-request" key={request.id}><div><Button variant="text" theme="primary" onClick={() => open({ kind: 'detail', page: 'reshipments', id: request.id })}>{request.id}</Button><span>{request.purpose} · {reshipmentStage(request)}</span></div><p className="secondary">{request.parcels.length ? request.parcels.map(parcel => `${parcel.tracking || '无运单'} · ${parcel.status}`).join('；') : '尚未登记包裹'}</p></div>) : <p className="secondary">暂无有效关联申请。已删除申请的历史仍在右侧时间线中保留。</p>}<p className="secondary">物流进度与售后状态分别记录；已签收仍需人工结案。</p></>}
    {reshipment && <><h3>申请信息</h3><Facts rows={[["申请用途", reshipment.purpose], ["申请备注", reshipment.remark]]} /><ParcelDetails row={reshipment} />{reshipment.sourceId && <Button variant="text" theme="primary" onClick={() => open({ kind: 'detail', page: 'afterSales', id: reshipment.sourceId })}>查看来源售后 {reshipment.sourceId}</Button>}</>}
  </div></DetailDrawer>;
}
