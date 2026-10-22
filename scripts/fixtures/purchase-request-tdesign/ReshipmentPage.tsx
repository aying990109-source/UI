import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Button, Checkbox, DateRangePicker, Descriptions, Dropdown, Empty, Input, MessagePlugin, Pagination, PrimaryTable, Select, Tabs, Tag, type PrimaryTableCol } from 'tdesign-react';
import { AddIcon, DownloadIcon, FileIcon, MoreIcon, SearchIcon, UploadIcon } from 'tdesign-icons-react';
import { CopyableText } from './CopyableText';
import { DetailDrawer } from './DetailDrawer';
import { ImportPreviewDialog } from './FileTransferActions';
import { ListFilterToolbar } from './ListFilterToolbar';
import { MobilePagination } from './PreviewPagination';
import { options } from './OrderForms';
import { exportDemo } from './processing-data';
import { allocated, orderGroups, reshipmentStage, transitStates, type OrderState, type Reshipment } from './order-data';
import { emptyReshipmentFilters, filterReshipments, reshipmentCreation, reshipmentExport, reshipmentLines, type ReshipmentLine } from './reshipment-data';
import './reshipment.css';

type Action = { kind: 'detail' | 'parcel' | 'delete'; id: string } | { kind: 'new' };
const stages = ['全部', '待登记', '已登记', '已签收', '需跟进'];
const requestColumns = new Set(['select', 'order', 'creator', 'created', 'remark', 'actions']);
function Status({ value }: { value: string }) {
  return <Tag size="small" variant="light" theme={value === '已签收' ? 'success' : ['运输异常', '已退回', '需跟进'].includes(value) ? 'danger' : ['未分包', '未登记', '待登记'].includes(value) ? 'default' : 'primary'}>{value}</Tag>;
}

export function ReshipmentPage({ state, open }: { state: OrderState; open: (action: Action) => void }) {
  const [filters, setFilters] = useState(emptyReshipmentFilters), [applied, setApplied] = useState(emptyReshipmentFilters);
  const [stage, setStage] = useState('全部'), [selected, setSelected] = useState<string[]>([]);
  const [current, setCurrent] = useState(1), [pageSize, setPageSize] = useState(10), [importOpen, setImportOpen] = useState(false);
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 650px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 650px)'), update = () => setNarrow(media.matches);
    media.addEventListener('change', update); return () => media.removeEventListener('change', update);
  }, []);
  const filtered = filterReshipments(state.reshipments, applied);
  const visible = filtered.filter(row => stage === '全部' || reshipmentStage(row) === stage);
  const keys = visible.map(row => row.id).join('|');
  const counted = selected.length ? visible.filter(row => selected.includes(row.id)) : visible;
  useEffect(() => {
    const allowed = new Set(keys.split('|'));
    setSelected(previous => previous.filter(id => allowed.has(id)));
    setCurrent(previous => Math.min(previous, Math.max(1, Math.ceil(visible.length / pageSize))));
  }, [keys, pageSize]);
  const pageRecords = visible.slice((current - 1) * pageSize, current * pageSize), lines = reshipmentLines(pageRecords);
  const allChecked = pageRecords.length > 0 && pageRecords.every(row => selected.includes(row.id));
  const someChecked = pageRecords.some(row => selected.includes(row.id));
  const reset = () => { setFilters(emptyReshipmentFilters); setApplied(emptyReshipmentFilters); setStage('全部'); setCurrent(1); setSelected([]); };
  const dirty = JSON.stringify(filters) !== JSON.stringify(applied);
  const download = () => {
    const records = selected.length ? visible.filter(row => selected.includes(row.id)) : visible;
    const data = reshipmentExport(records);
    try { exportDemo('补发表', data.headers, data.rows); void MessagePlugin.success(`已导出 ${records.length} 次补发申请、${data.rows.length} 行商品包裹明细`); }
    catch { void MessagePlugin.error('导出失败，请重试'); }
  };
  const columns: PrimaryTableCol<ReshipmentLine>[] = [
    { colKey: 'select', width: 40, fixed: narrow ? undefined : 'left', title: <Checkbox aria-label="选择本页全部补发申请" checked={allChecked} indeterminate={!allChecked && someChecked} disabled={!pageRecords.length} onChange={checked => setSelected(previous => checked ? [...new Set([...previous, ...pageRecords.map(row => row.id)])] : previous.filter(id => !pageRecords.some(row => row.id === id)))} />, cell: ({ row }) => <Checkbox aria-label={`选择补发申请 ${row.request.id}`} checked={selected.includes(row.request.id)} onChange={checked => setSelected(previous => checked ? [...new Set([...previous, row.request.id])] : previous.filter(id => id !== row.request.id))} /> },
    { colKey: 'order', title: '店铺 / 原始订单', width: 230, fixed: narrow ? undefined : 'left', cell: ({ row: { request } }) => <div className="cell-stack"><CopyableText label="店铺名" value={request.shop} className="product-name" /><CopyableText label="原始订单编号" value={request.order} onClick={() => open({ kind: 'detail', id: request.id })} /></div> },
    { colKey: 'goods', title: '型号 / 颜色', width: 172, cell: ({ row }) => <div className="cell-stack"><CopyableText label="型号" value={row.item.model} className="product-name" /><span className="secondary">{row.item.color || '颜色未填写'}</span></div> },
    { colKey: 'quantity', title: '数量', width: 68, align: 'right', cell: ({ row }) => <strong className="numeric">{row.quantity}</strong> },
    { colKey: 'creator', title: '创建人 / 组别', width: 135, cell: ({ row }) => <div className="cell-stack"><span>{reshipmentCreation(row.request)?.operator || '未记录'}</span><span className="secondary">{row.request.group}</span></div> },
    { colKey: 'execution', title: '处理人 / 补发系统单号', width: 184, cell: ({ row }) => <div className="cell-stack"><span>{row.parcel?.handler || '未登记处理人'}</span><CopyableText label="补发系统单号" value={row.parcel?.order || ''} className="secondary" /></div> },
    { colKey: 'shipping', title: '补发日期 / 发货渠道', width: 164, cell: ({ row }) => <div className="cell-stack"><span>{row.parcel?.date || '未登记补发日期'}</span><span className="secondary">{row.parcel?.channel || '渠道未填写'}</span></div> },
    { colKey: 'tracking', title: '运单号 / 运输状态', width: 190, cell: ({ row }) => <div className="cell-stack"><CopyableText label="运单号" value={row.parcel?.tracking || ''} /><div><Status value={row.parcel?.status || '未分包'} /></div></div> },
    { colKey: 'created', title: '创建日期', width: 120, cell: ({ row }) => { const date = reshipmentCreation(row.request)?.time || row.request.date; return <div className="cell-stack"><span>{date.slice(0, 10)}</span><span className="secondary">{date.slice(11)}</span></div>; } },
    { colKey: 'remark', title: '备注', width: 190, ellipsis: true, cell: ({ row }) => row.request.remark || '—' },
    { colKey: 'actions', title: '操作', width: 148, fixed: narrow ? undefined : 'right', cell: ({ row }) => <div className="row-buttons"><Button variant="text" theme="primary" aria-label={`详情 ${row.request.id}`} onClick={() => open({ kind: 'detail', id: row.request.id })}>详情</Button><Button variant="text" theme="primary" aria-label={`维护发货 ${row.request.id}`} onClick={() => open({ kind: 'parcel', id: row.request.id })}>维护</Button><Dropdown trigger="click" options={[{ content: '删除申请', value: 'delete' }]} onClick={() => open({ kind: 'delete', id: row.request.id })}><Button variant="text" shape="square" icon={<MoreIcon />} aria-label={`更多操作 ${row.request.id}`} /></Dropdown></div> },
  ];
  return <div className="reshipment-page"><h1 className="sr-only">补发表</h1>
    <section className="filter-panel" aria-label="筛选补发表"><form onSubmit={event => { event.preventDefault(); setApplied({ ...filters }); setCurrent(1); setSelected([]); }}><ListFilterToolbar
      create={<Button theme="primary" icon={<AddIcon />} onClick={() => open({ kind: 'new' })}>新建补发</Button>}
      fields={<>
        <label className="keyword-filter"><span>关键词</span><Input prefixIcon={<SearchIcon />} value={filters.query} onChange={query => setFilters({ ...filters, query })} clearable placeholder="原订单、补发单号、运单、型号" aria-label="补发表关键词" /></label>
        <label><span>运输状态</span><Select value={filters.status} options={options(transitStates)} onChange={value => setFilters({ ...filters, status: String(value || '') })} clearable placeholder="全部运输状态" /></label>
        <label><span>店铺名</span><Select value={filters.shop} options={options([...new Set(state.reshipments.filter(row => !row.deleted).map(row => row.shop))])} onChange={value => setFilters({ ...filters, shop: String(value || '') })} clearable placeholder="全部店铺" /></label>
        <label><span>所属小组</span><Select value={filters.group} options={options(orderGroups)} onChange={value => setFilters({ ...filters, group: String(value || '') })} clearable placeholder="全部小组" /></label>
        <label><span>创建人</span><Input value={filters.creator} onChange={creator => setFilters({ ...filters, creator })} clearable placeholder="创建人" /></label>
        <label><span>处理人</span><Input value={filters.handler} onChange={handler => setFilters({ ...filters, handler })} clearable placeholder="实际处理人" /></label>
        <label><span>发货渠道</span><Input value={filters.channel} onChange={channel => setFilters({ ...filters, channel })} clearable placeholder="手填渠道关键词" /></label>
        <label className="date-filter"><span>创建日期</span><DateRangePicker value={filters.createdDates} onChange={value => setFilters({ ...filters, createdDates: value.map(String) })} clearable /></label>
        <label className="date-filter"><span>补发日期</span><DateRangePicker value={filters.shippedDates} onChange={value => setFilters({ ...filters, shippedDates: value.map(String) })} clearable /></label>
      </>}
      query={<Button type="submit">查询</Button>} reset={<Button onClick={reset}>重置</Button>}
      fileActions={<><Button variant="outline" icon={<UploadIcon />} onClick={() => setImportOpen(true)}>导入 CSV</Button><Button variant="outline" icon={<DownloadIcon />} disabled={dirty || !visible.length} onClick={download}>{selected.length ? `导出所选（${selected.length}）` : '导出当前筛选'}</Button></>}
    /></form>{dirty && <Alert className="reshipment-filter-notice" theme="info" message="筛选条件已修改，点击查询后应用。" />}</section>
    <section className="list-panel" aria-label="补发表列表"><div className="list-heading"><Tabs value={stage} onChange={value => { setStage(String(value)); setSelected([]); setCurrent(1); }}>{stages.map(value => <Tabs.TabPanel key={value} value={value} label={<button className="tab-label" aria-pressed={stage === value}>{value}<span className="tab-count">{filtered.filter(row => value === '全部' || reshipmentStage(row) === value).length}</span></button>} />)}</Tabs>
      <div className="list-meta"><div className="selection-summary" aria-live="polite"><strong>{selected.length || visible.length}</strong>{selected.length ? <>次补发已选<Button variant="text" theme="primary" onClick={() => setSelected([])}>取消选择</Button></> : '次补发申请'}<span className="toolbar-hint">共 {counted.reduce((sum, row) => sum + row.items.reduce((total, item) => total + item.quantity, 0), 0)} 件 · 页签为申请进度</span></div></div></div>
      <div className="reshipment-table-hint secondary">按商品与包裹展示，勾选整次申请；横向滚动查看完整字段。</div>
      <div className="table-scroll reshipment-table" role="region" tabIndex={0} aria-label="补发表明细，可横向滚动"><PrimaryTable rowKey="id" data={lines} columns={columns} size="small" hover tableLayout="fixed" rowspanAndColspan={({ row, col }) => row.first && requestColumns.has(col.colKey || '') ? { rowspan: row.span, colspan: 1 } : {}} empty={<Empty title="没有符合条件的补发申请" action={<Button variant="outline" onClick={reset}>重置筛选</Button>} />} /></div>
      <div className="reshipment-pagination"><span className="secondary">本页 {pageRecords.length} 次申请 · {lines.length} 行明细</span><Pagination current={current} pageSize={pageSize} total={visible.length} totalContent={false} pageSizeOptions={[10, 20, 50]} showJumper onChange={info => { setCurrent(info.current); setPageSize(info.pageSize); }} /><MobilePagination current={current} pageSize={pageSize} total={visible.length} onChange={setCurrent} /></div>
    </section>
    {importOpen && <ImportPreviewDialog title="补发表" data={reshipmentExport(visible)} uniqueFirstColumn={false} onClose={() => setImportOpen(false)} />}
  </div>;
}

export function ReshipmentDetail({ row, onClose, onSource }: { row: Reshipment; onClose: () => void; onSource: (id: string) => void }) {
  const creation = reshipmentCreation(row);
  const facts = (items: [string, ReactNode][]) => <Descriptions size="small" column={1} tableLayout="fixed" items={items.map(([label, content]) => ({ label, content: content || '未填写' }))} />;
  return <DetailDrawer title="补发表详情" timeline={row.timeline} onClose={onClose}><div className="detail-content reshipment-detail">
    <div className="detail-title"><FileIcon /><div><h2>{row.shop}</h2><CopyableText label="原始订单编号" value={row.order} /></div><Status value={reshipmentStage(row)} /></div>
    <h3>申请资料</h3>{facts([['补发申请编号', row.id], ['申请用途', row.purpose], ['创建人', creation?.operator || '未记录'], ['组别', row.group], ['创建日期', creation?.time || row.date], ['来源', row.sourceId ? <Button variant="text" theme="primary" onClick={() => onSource(row.sourceId)}>{row.sourceId}</Button> : '直接申请']])}
    <h3>申请商品</h3><ul className="shipping-confirm-list">{row.items.map(item => <li key={item.id}><strong>{item.model || '型号未填写'} · {item.color || '颜色未填写'}</strong><span>申请 {item.quantity} 件 · 已分配 {allocated(row, item.id)} 件 · 待分配 {item.quantity - allocated(row, item.id)} 件</span></li>)}</ul>
    <h3>包裹与发货资料</h3>{row.parcels.length ? row.parcels.map((parcel, index) => <section className="order-detail-parcel" key={parcel.id}><div className="order-section-heading"><h3>包裹 {index + 1}</h3><Status value={parcel.status} /></div>{facts([['处理人', parcel.handler], ['补发系统单号', <CopyableText label="补发系统单号" value={parcel.order} />], ['补发日期', parcel.date], ['发货渠道', parcel.channel], ['运单号', <CopyableText label="运单号" value={parcel.tracking} />], ['分配商品', row.items.filter(item => parcel.allocations[item.id] > 0).map(item => <div key={item.id}>{item.model || '型号未填写'} · {item.color || '颜色未填写'} × {parcel.allocations[item.id]} 件</div>)]])}</section>) : <p className="secondary">尚未登记包裹，补发日期和物流资料待实际处理后填写。</p>}
    <h3>备注</h3><p className="reshipment-remark">{row.remark || '未填写备注'}</p>
  </div></DetailDrawer>;
}
