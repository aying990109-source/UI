import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Button, DateRangePicker, Descriptions, Empty, Input, MessagePlugin, PrimaryTable, Select, Space, Tabs, Tag, Tooltip, type PrimaryTableCol } from 'tdesign-react';
import { DeleteIcon, DownloadIcon, SearchIcon, UploadIcon } from 'tdesign-icons-react';
import { downloadSimpleWorkbook } from '../../../src/lib/workbook';
import { DetailDrawer } from './DetailDrawer';
import { PreviewDialog } from './PreviewDialog';
import { CopyableText } from './CopyableText';
import { ImportPreviewDialog } from './FileTransferActions';
import { ListFilterToolbar } from './ListFilterToolbar';
import { options } from './OrderForms';
import { dailyWorkbook, filterDaily, type DailyFilters } from './daily-shipping-data';
import { dailyStatusLabel, updateDaily, type DailyLine, type OrderState } from './order-data';
import './daily-shipping.css';

const emptyFilters: DailyFilters = { query: '', group: '', channel: '', dates: [] };
const statuses = [{ value: 'pending', label: '待发货' }, { value: 'shipped', label: '已发货' }, { value: 'all', label: '全部' }] as const;
function Status({ value, onShip, actionLabel }: { value: DailyLine['shipping_status']; onShip?: () => void; actionLabel?: string }) {
  const tag = <Tag variant="light" size="small" theme={value === 'shipped' ? 'success' : 'warning'}>{dailyStatusLabel(value)}</Tag>;
  return value === 'pending' && onShip ? <Button className="daily-status-button" variant="text" theme="warning" size="small" aria-label={actionLabel} onClick={onShip}>{tag}</Button> : tag;
}
function Facts({ rows, column }: { rows: [ReactNode, ReactNode, number?][]; column: number }) {
  return <Descriptions size="small" column={column} tableLayout="fixed" labelStyle={{ width: 'var(--daily-label-width)', whiteSpace: 'normal' }} contentStyle={{ width: `calc(${100 / column}% - var(--daily-label-width))`, overflowWrap: 'anywhere', paddingRight: column > 1 ? 16 : 0 }} items={rows.map(([label, value, span = 1]) => ({ label, content: value === '' ? '未提供' : value, span: Math.min(span, column) }))} />;
}

export function DailyShippingPage({ state, onSave }: { state: OrderState; onSave: (state: OrderState) => void }) {
  const [filters, setFilters] = useState(emptyFilters), [applied, setApplied] = useState(emptyFilters);
  const [stage, setStage] = useState('pending'), [selected, setSelected] = useState<(string | number)[]>([]);
  const [current, setCurrent] = useState(1), [pageSize, setPageSize] = useState(10);
  const [detailId, setDetailId] = useState(''), [importOpen, setImportOpen] = useState(false);
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 650px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 650px)'), update = () => setNarrow(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const filtered = filterDaily(state.daily, applied), visible = filtered.filter(row => stage === 'all' || row.shipping_status === stage);
  const keys = visible.map(row => row.id).join('|');
  useEffect(() => {
    const allowed = new Set(keys.split('|'));
    setSelected(previous => previous.filter(id => allowed.has(String(id))));
    setCurrent(previous => Math.min(previous, Math.max(1, Math.ceil(visible.length / pageSize))));
  }, [keys, pageSize]);
  const chosen = visible.filter(row => selected.includes(row.id));
  const orderCount = new Set(visible.map(row => row.lingxing_order_no)).size;
  const selectedOrders = new Set(chosen.map(row => row.lingxing_order_no));
  const detail = state.daily.find(row => row.id === detailId);
  const reset = () => { setFilters(emptyFilters); setApplied(emptyFilters); setStage('all'); setSelected([]); setCurrent(1); };
  const dirtyFilters = JSON.stringify(filters) !== JSON.stringify(applied);
  const markShipped = (row: DailyLine) => {
    try {
      onSave(updateDaily(state, [row.id], 'shipped'));
      void MessagePlugin.success(`${row.lingxing_order_no} 已标记为已发货`);
    } catch (error) { void MessagePlugin.error((error as Error).message); }
  };
  const statusCell = (row: DailyLine) => <Status value={row.shipping_status} actionLabel={`标记已发货 ${row.lingxing_order_no} ${row.product_name}`} onShip={() => markShipped(row)} />;
  const download = () => {
    const data = dailyWorkbook(selected.length ? chosen : visible);
    try {
      downloadSimpleWorkbook('每日订单发货-示例.xlsx', '每日订单发货', data.headers, data.rows, {
        textColumns: [2, 3, 4], columnWidths: [14, 18, 22, 22, 24, 18, 28, 24, 18, 10, 54, 24, 12, 26, 36, 36],
      });
      void MessagePlugin.success(`已导出 ${data.rows.length} 条商品明细`);
    } catch { void MessagePlugin.error('导出失败，请重试'); }
  };
  const columns: PrimaryTableCol<DailyLine>[] = [
    { colKey: 'select', type: 'multiple', width: narrow ? 32 : 40, fixed: narrow ? undefined : 'left', checkProps: ({ row }) => ({ label: <span className="sr-only">选择 {row.lingxing_order_no} {row.product_name}</span> }) },
    { colKey: 'order_info', title: narrow ? '订单 / 商品' : '系统单号 / 订单日期', width: narrow ? undefined : 168, cell: ({ row }) => narrow ? <Space direction="vertical" size={4} className="cell-stack daily-compact-order">
      <Button variant="text" theme="primary" onClick={() => setDetailId(row.id)}>{row.lingxing_order_no}</Button>
      <CopyableText label="品名" value={row.product_name} className="product-name" /><span className="secondary">{row.model} · {row.quantity} 件</span>{statusCell(row)}
    </Space> : <div className="cell-stack">
      <Button variant="text" theme="primary" onClick={() => setDetailId(row.id)}>{row.lingxing_order_no}</Button><span className="secondary">{row.order_date}</span>
    </div> },
    { colKey: 'product_name', title: '订单商品', width: 216, cell: ({ row }) => <div className="cell-stack purchase-product-cell"><CopyableText label="品名" value={row.product_name} className="product-name" /><span className="secondary">{row.model}</span></div> },
    { colKey: 'store', title: '店铺 / 组别', width: 160, cell: ({ row }) => <div className="cell-stack"><CopyableText label="店铺" value={row.store} /><span className="secondary">{row.group_name}</span></div> },
    { colKey: 'quantity', title: '数量', width: 65, align: 'right' },
    { colKey: 'shipping_status', title: '发货状态', width: 90, cell: ({ row }) => statusCell(row) },
    { colKey: 'platform_order_no', title: '平台单号 / 参考号', width: 208, cell: ({ row }) => <div className="cell-stack"><CopyableText label="平台单号" value={row.platform_order_no} /><CopyableText label="参考号" value={row.reference_no} className="secondary" /></div> },
    { colKey: 'price', title: <Tooltip content="减去平台费"><span>价格</span></Tooltip>, width: 115, align: 'right', cell: ({ row }) => row.price.toFixed(2) },
    { colKey: 'country', title: '国家', width: 65 },
    { colKey: 'address', title: '收货地址', width: 210, cell: ({ row }) => <CopyableText label="收货地址" value={row.address} /> },
    { colKey: 'shipping_channel', title: '发货渠道 / 渠道明细', width: 185, cell: ({ row }) => <div className="cell-stack"><CopyableText label="发货渠道" value={row.shipping_channel} /><CopyableText label="渠道明细" value={row.channel_detail} className="secondary" /></div> },
    { colKey: 'source_remark', title: '来源备注', width: 165, ellipsis: true, cell: ({ row }) => row.source_remark || <span className="secondary">—</span> },
    { colKey: 'internal_remark', title: '内部备注', width: 165, ellipsis: true, cell: ({ row }) => row.internal_remark || <span className="secondary">—</span> },
    { colKey: 'actions', title: '操作', width: 62, fixed: narrow ? undefined : 'right', cell: ({ row }) => <div className="row-buttons">
      <Button variant="text" theme="primary" aria-label={`详情 ${row.lingxing_order_no} ${row.product_name}`} onClick={() => setDetailId(row.id)}>详情</Button>
    </div> },
  ];
  return <>
    <h1 className="sr-only">每日订单发货</h1>
    <section className="filter-panel" aria-label="筛选每日订单发货"><form onSubmit={event => { event.preventDefault(); setApplied({ ...filters }); setSelected([]); setCurrent(1); }}>
      <ListFilterToolbar fields={<>
        <label className="keyword-filter"><span>关键词</span><Input prefixIcon={<SearchIcon />} value={filters.query} onChange={query => setFilters({ ...filters, query })} clearable aria-label="每日订单发货关键词" placeholder="订单号、商品、地址、备注" /></label>
        <label className="date-filter"><span>订单日期</span><DateRangePicker value={filters.dates} onChange={value => setFilters({ ...filters, dates: value.map(String) })} clearable /></label>
        <label><span>组别</span><Select aria-label="组别" value={filters.group} options={options([...new Set(state.daily.map(row => row.group_name))])} onChange={value => setFilters({ ...filters, group: String(value || '') })} clearable placeholder="全部组别" /></label>
        <label><span>发货渠道</span><Select aria-label="发货渠道" value={filters.channel} options={options([...new Set(state.daily.map(row => row.shipping_channel).filter(Boolean))])} onChange={value => setFilters({ ...filters, channel: String(value || '') })} clearable placeholder="全部发货渠道" /></label>
      </>} query={<Button type="submit">查询</Button>} reset={<Button onClick={reset}>重置</Button>}
        fileActions={<><Button variant="outline" icon={<UploadIcon />} onClick={() => setImportOpen(true)}>导入 Excel</Button><Button variant="outline" icon={<DownloadIcon />} disabled={!visible.length || dirtyFilters} onClick={download}>{selected.length ? '导出所选 Excel' : '导出当前筛选 Excel'}</Button></>} />
    </form>{dirtyFilters && <Alert theme="info" className="daily-filter-notice" message="筛选条件已修改，点击查询后更新列表和导出范围。" />}</section>
    <section className="list-panel" aria-label="每日订单发货列表">
      <div className="list-heading"><Tabs value={stage} onChange={value => { setStage(String(value)); setSelected([]); setCurrent(1); }}>{statuses.map(status => <Tabs.TabPanel key={status.value} value={status.value} label={<button type="button" className="tab-label" aria-pressed={stage === status.value}>{status.label}<span className="tab-count">{filtered.filter(row => status.value === 'all' || row.shipping_status === status.value).length}</span></button>} />)}</Tabs>
        <div className="list-meta"><div className="selection-summary" aria-live="polite">{selected.length ? <><strong>{selected.length}</strong> 条已选 · {selectedOrders.size} 个系统订单<Button variant="text" theme="primary" onClick={() => setSelected([])}>取消选择</Button></> : <><strong>{visible.length}</strong> 条商品明细 · {orderCount} 个系统订单</>}</div></div>
      </div>
      <div className="table-scroll daily-shipping-table" role="region" tabIndex={0} aria-label={narrow ? '每日订单发货表格' : '每日订单发货表格，可横向滚动'}><PrimaryTable rowKey="id" columns={narrow ? columns.filter(column => ['select', 'order_info', 'actions'].includes(String(column.colKey))) : columns} data={visible} size="small" hover tableLayout="fixed" selectedRowKeys={selected} onSelectChange={setSelected} pagination={{ current, pageSize, total: visible.length, showJumper: true, pageSizeOptions: [10, 20, 50] }} onPageChange={info => { setCurrent(info.current); setPageSize(info.pageSize); }} empty={<Empty title="没有符合条件的发货明细" action={<Button variant="outline" onClick={reset}>重置筛选</Button>} />} /></div>
    </section>
    {importOpen && <ImportPreviewDialog title="每日订单发货" format="XLSX" data={dailyWorkbook(state.daily)} previewColumnCount={16} uniqueFirstColumn={false} onClose={() => setImportOpen(false)} />}
    {detail && <DailyDetail row={detail} lines={state.daily.filter(row => row.lingxing_order_no === detail.lingxing_order_no)} narrow={narrow} onClose={() => setDetailId('')} onSelect={setDetailId} onDelete={() => {
      onSave({ ...state, daily: state.daily.filter(row => row.id !== detail.id) });
      setDetailId('');
      void MessagePlugin.success('已删除本地示例明细');
    }} />}
  </>;
}

function DailyDetail({ row, lines, narrow, onClose, onSelect, onDelete }: { row: DailyLine; lines: DailyLine[]; narrow: boolean; onClose: () => void; onSelect: (id: string) => void; onDelete: () => void }) {
  const column = narrow ? 1 : 2;
  const [deleteOpen, setDeleteOpen] = useState(false);
  return <><DetailDrawer title="每日订单发货详情" timeline={row.timeline} onClose={onClose} size={narrow ? '100%' : '1080px'} overlayOpen={deleteOpen} footer={<Space style={{ display: 'flex', justifyContent: 'space-between' }}>
    <Button variant="outline" onClick={onClose}>关闭</Button>
    <Button className="daily-detail-delete-button" variant="outline" theme="danger" icon={<DeleteIcon />} onClick={() => setDeleteOpen(true)}>删除</Button>
  </Space>}><div className="detail-content daily-shipping-detail">
    <div className="detail-title"><div><h2>{row.lingxing_order_no}</h2><span className="secondary">{row.product_name} · 明细 {row.line_no}</span></div><Status value={row.shipping_status} /></div>
    <h3>订单信息</h3><Facts column={column} rows={[
      ['系统单号', row.lingxing_order_no], ['参考号', row.reference_no], ['平台单号', row.platform_order_no],
      ['订单日期', row.order_date], ['店铺', row.store], ['组别', row.group_name],
    ]} />
    <h3>本行商品</h3><Facts column={column} rows={[
      ['品名', row.product_name], ['型号', row.model], ['数量', row.quantity], [<Tooltip content="减去平台费"><span>价格</span></Tooltip>, row.price.toFixed(2)], ['ASIN/商品id', row.asin],
    ]} />
    <h3>收货与发货资料</h3><Facts column={column} rows={[
      ['国家', row.country], ['发货渠道', row.shipping_channel],
      ['预计到达时间', row.estimated_arrival], ['支持收货时间', row.receiving_time],
      ['备注/渠道明细', row.channel_detail, 2],
      ['完整地址', <CopyableText label="完整地址" value={row.address} multiline />, 2],
    ]} />
    <h3>备注</h3><Facts column={column} rows={[
      ['来源备注', row.source_remark], ['内部备注', row.internal_remark],
    ]} /><p className="secondary">来源备注对应导入表的“备注”列；内部备注由同系统单号下的商品共用。</p>
    <h3>更多来源资料</h3><Facts column={column} rows={[
      ['来源订单状态', row.order_status], ['原购买时间', row.purchase_time],
      ['多渠道/第三方仓/外购订单号', row.multichannel_order_no, 2], ['小礼品单/海外仓订单号', row.gift_order_no, 2],
    ]} />
    <h3>同单商品 · {lines.length} 条明细</h3><ul className="shipping-confirm-list">{lines.map(item => <li key={item.id}><Button variant="text" theme="primary" aria-current={item.id === row.id ? 'true' : undefined} onClick={() => onSelect(item.id)}>{item.product_name} · {item.model} × {item.quantity}{item.id === row.id ? '（当前明细）' : ''}</Button></li>)}</ul>
  </div></DetailDrawer>
    {deleteOpen && <PreviewDialog title="删除发货明细" width={480} onClose={() => setDeleteOpen(false)} returnFocus={() => document.querySelector<HTMLElement>('.daily-detail-delete-button')} footer={<Space>
      <Button variant="outline" onClick={() => setDeleteOpen(false)}>取消</Button><Button theme="danger" onClick={onDelete}>确认删除</Button>
    </Space>}><p>确认删除当前发货明细？</p><p>{row.lingxing_order_no} · {row.product_name}</p><p className="secondary">同单的其他商品明细将保留。</p></PreviewDialog>}
  </>;
}
