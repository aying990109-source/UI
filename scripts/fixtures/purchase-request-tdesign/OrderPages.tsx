import { CsvImportButton } from './FileTransferActions';
import { ListFilterToolbar } from './ListFilterToolbar';
import { useEffect, useState, type ReactNode } from 'react';
import { Button, DateRangePicker, Descriptions, Dropdown, Empty, Input, MessagePlugin, PrimaryTable, Select, Tabs, Tag, type PrimaryTableCol } from 'tdesign-react';
import { AddIcon, DownloadIcon, FileIcon, MoreIcon, SearchIcon } from 'tdesign-icons-react';
import { DetailDrawer } from './DetailDrawer';
import { AfterSaleImages } from './AfterSaleImages';
import { CopyableText } from './CopyableText';
import { DailyShippingPage } from './DailyShippingPage';
import { ReshipmentDetail, ReshipmentPage } from './ReshipmentPage';
import { AfterSaleForm, OrderCreateForm, ParcelForm, ReshipmentDeleteForm, options } from './OrderForms';
import { exportDemo } from './processing-data';
import { afterSaleExport, afterSaleHandlingEvents, afterSaleResult, afterSaleToday, afterTimeline, currentReshipments, initialOrderState, orderGroups, orderPages, reshipmentStage, type AfterSale, type OrderState } from './order-data';

type Page = Exclude<keyof typeof orderPages, 'dailyShipping'>;
type Modal = { kind: 'detail'; page: Page; id: string } | { kind: 'new'; page: 'afterSales' | 'reshipments' } | { kind: 'follow' | 'close' | 'reopen' | 'parcel' | 'delete'; id: string };
type ListRow = AfterSale & { product: string; quantity: number; result: string; creator: string; updated: string };
const tag = (status: string) => <Tag variant="light" size="small" theme={['已签收', '已结案'].includes(status) ? 'success' : status === '需跟进' ? 'danger' : status === '处理中' || status === '已登记' ? 'primary' : 'warning'}>{status}</Tag>;

export function OrderPages({ active }: { active: string }) {
  const [state, setState] = useState(initialOrderState), [modal, setModal] = useState<Modal | null>(null);
  const close = () => setModal(null), save = (next: OrderState) => { setState(next); close(); void MessagePlugin.success('已保存本地示例'); };
  return <>
    <div hidden={active !== 'dailyShipping'}><DailyShippingPage state={state} onSave={setState} /></div>
    <div hidden={active !== 'afterSales'}><OrderList page="afterSales" state={state} open={setModal} /></div>
    <div hidden={active !== 'reshipments'}><ReshipmentPage state={state} open={action => setModal(action.kind === 'new' ? { kind: 'new', page: 'reshipments' } : action.kind === 'detail' ? { kind: 'detail', page: 'reshipments', id: action.id } : { kind: action.kind, id: action.id })} /></div>
    {modal?.kind === 'new' && <OrderCreateForm state={state} page={modal.page} onClose={close} onSave={save} />}
    {modal && ['follow', 'close', 'reopen'].includes(modal.kind) && 'id' in modal && <AfterSaleForm state={state} row={state.afterSales.find(row => row.id === modal.id)!} action={modal.kind as 'follow' | 'close' | 'reopen'} onClose={close} onSave={save} />}
    {modal?.kind === 'parcel' && <ParcelForm state={state} row={state.reshipments.find(row => row.id === modal.id)!} onClose={close} onSave={save} />}
    {modal?.kind === 'delete' && <ReshipmentDeleteForm state={state} row={state.reshipments.find(row => row.id === modal.id)!} onClose={close} onSave={save} />}
    {modal?.kind === 'detail' && (modal.page === 'reshipments' ? <ReshipmentDetail row={state.reshipments.find(row => row.id === modal.id)!} onClose={close} onSource={id => setModal({ kind: 'detail', page: 'afterSales', id })} /> : <OrderDetail state={state} page={modal.page} id={modal.id} onClose={close} open={setModal} />)}
  </>;
}

function OrderList({ state, page, open }: { state: OrderState; page: 'afterSales'; open: (modal: Modal) => void }) {
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 650px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 650px)'), update = () => setNarrow(media.matches);
    media.addEventListener('change', update); return () => media.removeEventListener('change', update);
  }, []);
  const empty = { query: '', group: '', dates: [] as string[] };
  const [filters, setFilters] = useState(empty), [applied, setApplied] = useState(empty), [stage, setStage] = useState('全部'), [selected, setSelected] = useState<(string | number)[]>([]), [current, setCurrent] = useState(1), [pageSize, setPageSize] = useState(10);
  const rows: ListRow[] = state.afterSales.map(row => ({ ...row, product: row.items.map(item => item.product || item.model || '未填写品名').join('、'), quantity: row.items.reduce((sum, item) => sum + item.quantity, 0), result: afterSaleResult(state, row), creator: row.timeline[0]?.operator || '未记录', updated: afterTimeline(state, row).at(-1)?.time || '' }));
  const filtered = rows.filter(row => (!applied.query.trim() || `${row.id} ${row.order} ${row.product} ${row.items.map(item => item.model).join(' ')} ${row.shop} ${row.reason} ${row.description} ${row.creator}`.toLowerCase().includes(applied.query.trim().toLowerCase())) && (!applied.group || row.group === applied.group) && (!applied.dates[0] || row.date >= applied.dates[0]) && (!applied.dates[1] || row.date <= applied.dates[1]));
  const visible = filtered.filter(row => stage === '全部' || row.status === stage), keys = visible.map(row => row.id).join('|');
  useEffect(() => { const allowed = new Set(keys.split('|')); setSelected(previous => previous.filter(id => allowed.has(String(id)))); setCurrent(previous => Math.min(previous, Math.max(1, Math.ceil(visible.length / pageSize)))); }, [keys, pageSize]);
  const reset = () => { setFilters(empty); setApplied(empty); setStage('全部'); setSelected([]); setCurrent(1); };
  const detail = (id: string) => open({ kind: 'detail', page, id });
  const stages = ['全部', '待处理', '处理中', '已结案'];
  const columns: PrimaryTableCol<ListRow>[] = [
    { colKey: 'select', type: 'multiple', width: 32, fixed: narrow ? undefined : 'left', checkProps: ({ row }) => ({ label: <span className="sr-only">选择 {row.id}</span> }) },
    { colKey: 'status', title: '状态', width: 80, cell: ({ row }) => tag(row.status) },
    { colKey: 'order', title: narrow ? '订单 / 售后问题' : '订单 / 店铺', width: narrow ? undefined : 170, cell: ({ row }) => <div className="cell-stack"><CopyableText label="原始订单编号" value={row.order} multiline={narrow} /><span className="secondary after-sale-cell-line" title={row.shop}>{row.shop}</span>{narrow && <><span>{row.reason} · {row.quantity} 件</span>{tag(row.status)}<span className={row.status !== '已结案' && row.nextDate && row.nextDate < afterSaleToday() ? 'after-sale-overdue' : 'secondary'}>{row.status === '已结案' ? '已结束跟进' : row.nextDate ? `${row.nextDate} 跟进${row.nextDate < afterSaleToday() ? ' · 已逾期' : ''}` : '未安排跟进'}</span></>}</div> },
    { colKey: 'product', title: '涉事商品', width: 145, cell: ({ row }) => <div className="cell-stack"><span className="product-name after-sale-cell-line" title={row.product}>{row.items[0]?.product || row.items[0]?.model || '未填写品名'}</span><span className="secondary">{row.items.length > 1 ? `另 ${row.items.length - 1} 种 · 共 ${row.quantity} 件` : `${row.items[0]?.model || '型号未填写'} · ${row.quantity} 件`}</span></div> },
    { colKey: 'reason', title: '问题摘要', width: 168, cell: ({ row }) => <div className="cell-stack"><span>{row.reason}</span><span className="secondary after-sale-cell-line" title={row.description}>{row.description}</span></div> },
    { colKey: 'result', title: '处理结果', width: 150, cell: ({ row }) => <span className="after-sale-cell-result" title={row.result}>{row.result}</span> },
    { colKey: 'creator', title: '登记人', width: 105, cell: ({ row }) => <div className="cell-stack"><span>{row.creator}</span><span className="secondary">{row.group}</span></div> },
    { colKey: 'followUp', title: '跟进 / 更新', width: 155, cell: ({ row }) => <div className="cell-stack"><span className={row.status !== '已结案' && row.nextDate && row.nextDate < afterSaleToday() ? 'after-sale-overdue' : ''}>{row.status === '已结案' ? '—' : row.nextDate || '未安排'}{row.status !== '已结案' && row.nextDate && row.nextDate <= afterSaleToday() ? <small>{row.nextDate === afterSaleToday() ? '今日跟进' : '已逾期'}</small> : null}</span><span className="secondary" title={`最近更新时间：${row.updated}`}>更新 {row.updated.slice(5, 16)}</span></div> },
    { colKey: 'actions', title: '操作', width: narrow ? 62 : 116, fixed: narrow ? undefined : 'right', cell: ({ row }) => <div className="row-buttons"><Button variant="text" theme="primary" aria-label={`详情 ${row.id}`} onClick={() => detail(row.id)}>详情</Button>
      <><Button variant="text" theme="primary" aria-label={`${row.status === '已结案' ? '重开' : '跟进'} ${row.id}`} onClick={() => open({ kind: row.status === '已结案' ? 'reopen' : 'follow', id: row.id })}>{row.status === '已结案' ? '重开' : '跟进'}</Button>{row.status !== '已结案' && <Dropdown trigger="click" options={[{ content: '结案', value: 'close' }]} onClick={() => open({ kind: 'close', id: row.id })}><Button variant="text" shape="square" icon={<MoreIcon />} aria-label={`更多操作 ${row.id}`} /></Dropdown>}</>
    </div> },
  ];
  const download = () => { const chosen = selected.length ? visible.filter(row => selected.includes(row.id)) : visible, output = afterSaleExport(state, chosen); exportDemo(orderPages[page], output.headers, output.rows); void MessagePlugin.success(`已导出 ${chosen.length} 条示例记录`); };
  return <><h1 className="sr-only">{orderPages[page]}</h1><section className="filter-panel" aria-label={`筛选${orderPages[page]}`}><form onSubmit={event => { event.preventDefault(); setApplied({ ...filters }); setCurrent(1); setSelected([]); }}><ListFilterToolbar fields={<>
    <label className="keyword-filter"><span>关键词</span><Input prefixIcon={<SearchIcon />} value={filters.query} onChange={query => setFilters({ ...filters, query })} clearable aria-label={`${orderPages[page]}关键词`} placeholder="编号、订单、商品、店铺" /></label><label><span>所属小组</span><Select value={filters.group} options={options(orderGroups)} onChange={value => setFilters({ ...filters, group: String(value || '') })} clearable placeholder="全部小组" inputProps={{ name: `${page}-group` }} /></label><label className="date-filter"><span>{'登记日期'}</span><DateRangePicker value={filters.dates} onChange={value => setFilters({ ...filters, dates: value.map(String) })} clearable /></label>
  </>} create={<Button theme="primary" icon={<AddIcon />} onClick={() => open({ kind: 'new', page })}>登记售后</Button>} fileActions={<><CsvImportButton title={orderPages[page]} data={afterSaleExport(state, visible)} />{<Button variant="outline" icon={<DownloadIcon />} onClick={download}>{selected.length ? '导出所选' : '导出当前筛选'}</Button>}</>} query={<Button type="submit">查询</Button>} reset={<Button onClick={reset}>重置</Button>} /></form></section>
    <section className="list-panel" aria-label={`${orderPages[page]}列表`}><div className="list-heading"><Tabs value={stage} onChange={value => { setStage(String(value)); setSelected([]); setCurrent(1); }}>{stages.map(value => <Tabs.TabPanel key={value} value={value} label={<button className="tab-label" aria-pressed={value === stage}>{value}<span className="tab-count">{filtered.filter(row => value === '全部' || row.status === value).length}</span></button>} />)}</Tabs><div className="list-meta"><div className="selection-summary" aria-live="polite"><strong>{selected.length || visible.length}</strong>{selected.length ? <>条已选<Button variant="text" theme="primary" onClick={() => setSelected([])}>取消选择</Button></> : '条记录'}<span className="toolbar-hint">人工结案，补发签收不自动改变售后状态</span></div></div></div>
      <div className="table-scroll operations-table order-table after-sale-table" role="region" tabIndex={0} aria-label={`${orderPages[page]}表格，可横向滚动`}><PrimaryTable rowKey="id" columns={narrow ? columns.filter(column => ['select', 'order', 'actions'].includes(String(column.colKey))) : columns} data={visible} size="small" hover tableLayout="fixed" selectedRowKeys={selected} onSelectChange={setSelected} pagination={{ current, pageSize, total: visible.length, showJumper: true, pageSizeOptions: [10, 20, 50] }} onPageChange={info => { setCurrent(info.current); setPageSize(info.pageSize); }} empty={<Empty title="没有符合条件的记录" action={<Button variant="outline" onClick={reset}>重置筛选</Button>} />} /></div>
    </section></>;
}

function Facts({ rows, column }: { rows: [string, ReactNode, number?][]; column: number }) {
  return <Descriptions size="small" column={column} tableLayout="fixed" labelStyle={{ width: 96, whiteSpace: 'normal' }} contentStyle={{ width: `calc(${100 / column}% - 96px)`, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap', paddingRight: column > 1 ? 16 : 0 }} items={rows.map(([label, content, span = 1]) => ({ label, content: content === '' ? '未填写' : content, span: Math.min(span, column) }))} />;
}
function OrderDetail({ state, page, id, onClose, open }: { state: OrderState; page: 'afterSales'; id: string; onClose: () => void; open: (modal: Modal) => void }) {
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 650px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 650px)'), update = () => setNarrow(media.matches);
    media.addEventListener('change', update); return () => media.removeEventListener('change', update);
  }, []);
  const row = state.afterSales.find(row => row.id === id);
  if (!row) return null;
  const column = narrow ? 1 : 2;
  const linkedRequests = currentReshipments(state, row.id);
  return <DetailDrawer title={`${orderPages[page]}详情`} timeline={afterTimeline(state, row)} onClose={onClose} size={narrow ? '100%' : '1080px'}><div className="detail-content after-sale-detail">
    <div className="detail-title"><FileIcon /><div><h2>{row.id}</h2><span className="secondary">{row.date} · {row.group}</span></div>{tag(row.status)}</div>
    <h3>订单与来源</h3><Facts column={column} rows={[['原始订单', row.order], ['店铺', row.shop], ['所属小组', row.group], ['登记来源', '人工登记，未关联导入订单']]} />
    <h3>商品明细</h3><ul className="after-sale-goods-list">{row.items.map(item => <li key={item.id}><Facts column={column} rows={[
      ['品名', item.product || '品名未填写'], ['型号', item.model || '型号未填写'], ['颜色', item.color || '颜色未填写'], ['涉事数量', `${item.quantity} 件`],
    ]} /></li>)}</ul>
    <h3>问题与处理计划</h3><Facts column={column} rows={[
      ['问题原因', row.reason], ['下次跟进', row.nextDate || '未安排'], ['最新处理', afterSaleHandlingEvents(row)[0]?.time || '尚无跟进'], ['登记人', row.timeline[0]?.operator || '未记录'], ['问题描述', row.description, 2], ['结案说明', row.resolution || '尚未结案', 2],
    ]} />
    <AfterSaleImages readOnly />
    <h3>当前关联补发</h3>{linkedRequests.length ? linkedRequests.map(request => <div className="order-linked-request" key={request.id}><div><Button variant="text" theme="primary" onClick={() => open({ kind: 'detail', page: 'reshipments', id: request.id })}>{request.id}</Button><span>{request.purpose} · {reshipmentStage(request)}</span></div><p className="secondary">{request.parcels.length ? request.parcels.map(parcel => `${parcel.tracking || '无运单'} · ${parcel.status}`).join('；') : '尚未登记包裹'}</p></div>) : <p className="secondary">暂无有效关联申请。已删除申请的历史仍在流程时间线中保留。</p>}<p className="secondary">物流进度与售后状态分别记录；已签收仍需人工结案。</p>
  </div></DetailDrawer>;
}
