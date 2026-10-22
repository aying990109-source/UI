import { useLayoutEffect, useRef, useState } from 'react';
import { Alert, Button, ConfigProvider, Empty, Input, PrimaryTable, Select, Tag, type InputRef, type PrimaryTableCol } from 'tdesign-react';
import { CheckCircleIcon, FileSearchIcon, HistoryIcon, SearchIcon } from 'tdesign-icons-react';
import { DetailDrawer } from './DetailDrawer';
import { CopyableText } from './CopyableText';
import { CsvExportButton, CsvImportButton } from './FileTransferActions';
import type { FileTable } from './file-transfer-data';
import { createEvent, type DetailEvent } from './history';
import { emptyQuery, initialQueryData, isExactOrderNumber, priceText, queryExamples, queryPages, queryRules, requireQuery, searchBrand, searchOrders, searchPrices, trackingConflict, trackingGroups, type BrandResult, type QueryFilters, type QueryOrder, type QueryPage, type QueryPrice } from './query-data';
import './QueryPages.css';

type Result = { filters: QueryFilters; time: string; orders: QueryOrder[]; prices: QueryPrice[]; brand: BrandResult | null };
type Detail = { kind: 'history' } | { kind: 'order'; row: QueryOrder } | { kind: 'price'; row: QueryPrice } | { kind: 'brand'; row: BrandResult };
const data = initialQueryData();
const countryOptions = [{ label: '美国 · USD', value: 'US' }, { label: '加拿大 · CAD', value: 'CA' }];
const sourceOptions = ['国内货源', '当地货源'].map(value => ({ label: value, value }));

export function QueryPages({ active }: { active: string }) { return <>{(Object.keys(queryPages) as QueryPage[]).map(page => <div className="query-page-host" hidden={active !== page} key={page}><QueryWorkspace page={page} /></div>)}</>; }

function QueryWorkspace({ page }: { page: QueryPage }) {
  const input = useRef<InputRef>(null);
  const [draft, setDraft] = useState(emptyQuery), [result, setResult] = useState<Result | null>(null), [error, setError] = useState(''), [events, setEvents] = useState<DetailEvent[]>([]), [detail, setDetail] = useState<Detail | null>(null), [current, setCurrent] = useState(1), [pageSize, setPageSize] = useState(10);
  useLayoutEffect(() => {
    input.current?.inputElement?.setAttribute('id', `${page}-input`);
    input.current?.inputElement?.setAttribute('aria-describedby', `${page}-rule${error ? ` ${page}-query-error` : ''}`);
    input.current?.inputElement?.setAttribute('aria-invalid', String(!!error));
  }, [page, error]);
  const pricing = page === 'pricingQuery', brand = page === 'brandQuery', count = result ? brand ? result.brand?.exists ? 1 : 0 : pricing ? result.prices.length : result.orders.length : 0;
  const pending = !!result && JSON.stringify({ ...draft, query: draft.query.trim() }) !== JSON.stringify(result.filters);
  const change = (next: QueryFilters) => { setDraft(next); setError(''); };
  const submit = () => {
    try {
      const filters = { ...draft, query: requireQuery(draft.query) }, orders = page === 'orderQuery' ? searchOrders(data.orders, filters.query) : [], prices = pricing ? searchPrices(data.prices, filters) : [], brandResult = brand ? searchBrand(data.brands, filters.query) : null;
      const description = brandResult ? `${brandResult.exists ? '已收录' : '未收录'}；仅代表内部合成档案` : pricing ? `${prices.length} 条有效定价；${filters.country || '全部国家'} / ${filters.source || '全部货源'}` : `${orders.length} 条系统单记录；${isExactOrderNumber(filters.query) ? '单号精确匹配' : '多关键词同时匹配'}，未请求外部平台`;
      const event = createEvent('提交查询', '演示用户', `“${filters.query}”：${description}。`);
      setResult({ filters, orders, prices, brand: brandResult, time: event.time }); setEvents(previous => [...previous, event]); setError(''); setCurrent(1);
    } catch (cause) { setError((cause as Error).message); requestAnimationFrame(() => document.getElementById(`${page}-query-error`)?.focus()); }
  };
  const open = (value: Detail) => { if (value.kind !== 'history') setEvents(previous => [...previous, createEvent('查看查询详情', '演示用户', value.kind === 'order' ? `${value.row.systemOrder} · ${value.row.platformOrder}` : value.kind === 'price' ? `${value.row.id} · ${value.row.product} · ${value.row.spec} · ${priceText(value.row)}` : `${value.row.name} · ${value.row.exists ? '已收录' : '未收录'}`)]); setDetail(value); };
  const transferData: FileTable = brand ? { headers: ['品牌名称', '收录状态'], rows: result?.brand ? [[result.brand.name, result.brand.exists ? '已收录' : '未收录']] : [] } : pricing ? { headers: ['编号', '产品', '规格', '国家', '货源', '币种', '指导价', '更新时间'], rows: (result?.prices || []).map(row => [row.id, row.product, row.spec, row.country, row.source, row.currency, row.guidance ?? '', row.updated]) } : { headers: ['系统订单号', '平台订单号', '订单日期', '店铺', '站点', '品名', '型号', '数量', 'SKU'], rows: (result?.orders || []).map(row => [row.systemOrder, row.platformOrder, row.date, row.store || row.originalStore, row.site, row.product, row.model, row.quantity, row.sku]) };
  const examples = <div className="query-examples"><span>试填示例</span>{queryExamples[page].map(value => <Button key={value} type="button" variant="outline" onClick={() => { change({ ...draft, query: value }); requestAnimationFrame(() => input.current?.focus()); }}>{value}</Button>)}</div>;
  const description = brand ? '核对完整品牌名称在内部档案中的收录情况' : pricing ? '按完整品名查找启用的销售指导价' : '查找订单，核对商品与物流来源';
  return <section className={`query-workspace${result ? ' has-result' : ''}`} aria-label={queryPages[page]}>
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{result ? `${result.time}，${queryPages[page]}：${result.filters.query}，${brand ? result.brand?.exists ? '内部档案已收录' : '内部档案未收录' : `${count} 条${pricing ? '定价' : '系统单记录'}`}。` : '尚未提交查询。'}</p>
    <div className="query-top-actions"><Button type="button" variant="text" icon={<HistoryIcon />} disabled={!events.length} onClick={() => open({ kind: 'history' })}>查询记录{events.length ? ` · ${events.length}` : ''}</Button><CsvImportButton title={queryPages[page]} data={transferData} /></div>
    <header className="query-intro"><h1>{queryPages[page]}</h1><p>{description}</p></header>
    <form className="query-form" onSubmit={event => { event.preventDefault(); submit(); }}>
      <label className="query-main-label" htmlFor={`${page}-input`}>{brand ? '完整品牌名称' : pricing ? '完整品名' : '查询条件'}</label>
      <div className="query-search-line"><ConfigProvider notSet globalConfig={{ input: { clearTrigger: 'always' } }}><Input size="large" ref={input} prefixIcon={<SearchIcon />} aria-label={`${queryPages[page]}条件`} aria-describedby={`${page}-rule`} aria-invalid={!!error} clearable value={draft.query} onChange={query => change({ ...draft, query })} placeholder={brand ? '输入完整品牌名称' : pricing ? '输入完整品名，精确匹配' : '平台 / 系统单号、品名、店铺名'} /></ConfigProvider><Button theme="primary" icon={<SearchIcon />} type="submit">查询</Button></div>
      {pricing && <div className="query-options"><label><span>国家 / 币种</span><Select value={draft.country} clearable placeholder="全部国家" options={countryOptions} onChange={value => change({ ...draft, country: String(value || '') })} /></label><label><span>货源类型</span><Select value={draft.source} clearable placeholder="全部货源" options={sourceOptions} onChange={value => change({ ...draft, source: String(value || '') })} /></label></div>}
      <p className="query-rule" id={`${page}-rule`}>{queryRules[page]}</p>
      {!result && <>{examples}<p className="query-enter-hint">示例只填入条件，点击查询或按 Enter 后应用。</p></>}
    </form>
    {error && <div className="query-notice" role="alert" id={`${page}-query-error`} tabIndex={-1}><Alert theme="error" message={error} /></div>}
    {pending && <div className="query-notice" role="status"><Alert theme="info" message={`条件已修改，尚未提交。下方仍为“${result!.filters.query}”的查询结果。`} /></div>}
    {!result ? <div className="query-entry-notes"><div><strong>{brand ? '核对内部档案' : pricing ? '核对完整品名' : '按单号查找'}</strong><span>{brand ? '只判断内部收录，不代表外部注册或权属' : pricing ? '只返回启用定价，保留销售规格' : '完整 Amazon 格式单号精确匹配'}</span></div><div><strong>{brand ? '辨别匹配状态' : pricing ? '按条件细分' : '按商品或店铺查找'}</strong><span>{brand ? '未收录明确显示未匹配到名称' : pricing ? '可按国家和货源进一步筛选' : '多个关键词同时匹配'}</span></div><div><strong>{brand ? '查看本次详情' : pricing ? '核对报价信息' : '核对订单信息'}</strong><span>{brand ? '查询结果保留本次提交名称' : pricing ? '区分币种、更新时间与暂无报价' : '查看商品、店铺和来源运单'}</span></div><p>本地合成示例 · 未连接外部平台</p></div> : <section className="query-result-panel" aria-label={`${queryPages[page]}结果`}>
        <div className="query-result-heading"><div><h2>查询结果 <Tag variant="light" theme={brand ? result.brand?.exists ? 'success' : 'default' : 'primary'}>{brand ? result.brand?.exists ? '已收录' : '未收录' : `${count} 条${pricing ? '定价' : '记录'}`}</Tag></h2><span className="secondary">{result.filters.query} · {brand ? '内部品牌档案' : pricing ? `${result.filters.country || '全部国家'} / ${result.filters.source || '全部货源'}` : '合成本地导入总表'} · {result.time}</span></div><CsvExportButton title={queryPages[page]} data={transferData} disabled={pending} /></div>
        {brand && result.brand ? <BrandResultPanel row={result.brand} submitted={result.filters.query} onOpen={() => open({ kind: 'brand', row: result.brand! })} /> : count ? <>
          {pricing ? <PriceResults rows={result.prices} current={current} pageSize={pageSize} onPage={(page, size) => { setCurrent(page); setPageSize(size); }} onOpen={row => open({ kind: 'price', row })} /> : <OrderResults rows={result.orders} current={current} pageSize={pageSize} onPage={(page, size) => { setCurrent(page); setPageSize(size); }} onOpen={row => open({ kind: 'order', row })} />}
          <p className="query-result-footnote">{pricing ? '指导价仅供销售参考；不同规格、币种和货源分别核对，不合计或直接比较。' : '条数按系统单记录计算，同一平台单号可有多条记录。缺少物流资料不代表未发货。'}</p>
        </> : <div className="query-no-results"><Empty title={pricing ? '暂无匹配的有效定价' : '未找到本地示例记录'} description={pricing ? '请核对完整品名、国家和货源。停用记录不出现在查询结果中。' : '请核对关键词。本样板未连接领星，未命中不代表外部订单不存在。'} />{examples}</div>}
      </section>}
    {detail && <QueryDetail detail={detail} page={page} result={result} events={events} onClose={() => setDetail(null)} />}
  </section>;
}

type TableProps<T> = { rows: T[]; current: number; pageSize: number; onPage: (page: number, size: number) => void; onOpen: (row: T) => void };
function OrderResults({ rows, current, pageSize, onPage, onOpen }: TableProps<QueryOrder>) {
  const columns: PrimaryTableCol<QueryOrder>[] = [
    { colKey: 'order', title: '平台 / 系统单号', width: 188, cell: ({ row }) => <div className="cell-stack"><CopyableText label="平台单号" value={row.platformOrder} onClick={() => onOpen(row)} /><CopyableText label="系统单号" value={row.systemOrder} className="secondary numeric" /></div> },
    { colKey: 'store', title: '店铺 / 归属', width: 174, cell: ({ row }) => <div className="cell-stack"><span>{row.store || row.originalStore}</span><span className="secondary">{row.store ? row.originalStore : '简称未关联'}</span><span className="secondary">{row.site} · {row.group}</span></div> },
    { colKey: 'product', title: '品名 / 型号 / SKU', width: 152, cell: ({ row }) => <div className="cell-stack"><span>{row.product}</span><span className="secondary">{row.model}</span><span className="secondary numeric">{row.sku}</span></div> },
    { colKey: 'quantity', title: '数量', width: 58, cell: ({ row }) => <span className="numeric">{row.quantity} 件</span> },
    { colKey: 'shipping', title: '发货渠道 / 预计到达', width: 152, cell: ({ row }) => <div className="cell-stack"><span>{row.shippingChannel || '未提供渠道'}</span><span className="secondary">预计到达：{row.expectedArrival || '未提供'}</span></div> },
    { colKey: 'tracking', title: '运单号 / 来源', width: 199, cell: ({ row }) => { const groups = trackingGroups(row); return <div className="cell-stack">{groups.length ? groups.map(item => <div className="query-tracking-line" key={item.number}><CopyableText label="运单号" value={item.number} /><span className="secondary">{item.sources.join(' / ')}</span></div>) : <><span>未提供运单</span><span className="secondary">不推定发货状态</span></>}{trackingConflict(row) && <span className="pending-field">来源值不同，待核对</span>}</div>; } },
    { colKey: 'date', title: '订单日期', width: 100, cell: ({ row }) => <span className="numeric">{row.date}</span> },
    { colKey: 'actions', title: '操作', width: 70, fixed: 'right', cell: ({ row }) => <Button variant="text" theme="primary" aria-label={`详情 ${row.systemOrder}`} onClick={() => onOpen(row)}>详情</Button> },
  ];
  return <div className="table-scroll operations-table catalog-table query-table query-order-table" role="region" tabIndex={0} aria-label="订单查询表格，可横向滚动" onKeyDown={event => { if (event.target !== event.currentTarget || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return; const content = event.currentTarget.querySelector('.t-table__content'); if (content && content.scrollWidth > content.clientWidth) { event.preventDefault(); content.scrollBy({ left: event.key === 'ArrowRight' ? 200 : -200, behavior: 'smooth' }); } }}><PrimaryTable rowKey="id" columns={columns} data={rows} size="small" hover tableLayout="fixed" pagination={{ current, pageSize, total: rows.length, pageSizeOptions: [10, 20, 50], showJumper: true }} onPageChange={info => onPage(info.current, info.pageSize)} /></div>;
}
function PriceResults({ rows, current, pageSize, onPage, onOpen }: TableProps<QueryPrice>) {
  const columns: PrimaryTableCol<QueryPrice>[] = [
    { colKey: 'product', title: '品名 / 销售规格', width: 220, cell: ({ row }) => <div className="cell-stack"><Button variant="text" theme="primary" onClick={() => onOpen(row)} aria-label={`查看定价 ${row.id}`}>{row.product}</Button><span className="secondary">{row.spec}</span></div> },
    { colKey: 'country', title: '国家 / 货源', width: 136, cell: ({ row }) => <div className="cell-stack"><span>{row.country === 'US' ? '美国' : '加拿大'} · {row.country}</span><span className="secondary">{row.source}</span></div> },
    { colKey: 'guidance', title: '销售指导价', width: 136, cell: ({ row }) => <span className={row.guidance && row.guidance > 0 ? 'numeric quantity' : 'pending-field'}>{priceText(row)}</span> },
    { colKey: 'updated', title: '更新时间', width: 152, cell: ({ row }) => <div className="cell-stack"><span className="numeric">{row.updated.split(' ')[0]}</span><span className="secondary numeric">{row.updated.split(' ')[1]}</span></div> },
    { colKey: 'actions', title: '操作', width: 76, fixed: 'right', cell: ({ row }) => <Button variant="text" theme="primary" aria-label={`详情 ${row.id}`} onClick={() => onOpen(row)}>详情</Button> },
  ];
  return <div className="table-scroll operations-table catalog-table query-table query-price-table" role="region" tabIndex={0} aria-label="定价查询表格，可横向滚动"><PrimaryTable rowKey="id" columns={columns} data={rows} size="small" hover tableLayout="fixed" pagination={{ current, pageSize, total: rows.length, pageSizeOptions: [10, 20, 50], showJumper: true }} onPageChange={info => onPage(info.current, info.pageSize)} /></div>;
}

function BrandResultPanel({ row, submitted, onOpen }: { row: BrandResult; submitted: string; onOpen: () => void }) { return <div className="query-brand-result"><div className="query-brand-status" role="status">{row.exists ? <CheckCircleIcon className="query-brand-found" /> : <FileSearchIcon />}<div><h3>{row.exists ? '内部档案已收录' : '内部档案未收录'}</h3><p>{row.exists ? '合成品牌档案中存在该完整名称。' : '合成品牌档案中未找到该完整名称。'}</p></div></div><dl className="query-brand-facts"><div><dt>提交名称</dt><dd>{submitted}</dd></div><div><dt>匹配名称</dt><dd>{row.exists ? row.name : '未匹配到名称'}</dd></div><div><dt>匹配方式</dt><dd>完整名称，忽略首尾空白和英文大小写</dd></div><div><dt>查询范围</dt><dd>本地合成品牌档案</dd></div></dl><Alert theme="info" message="收录结果仅反映内部档案，不代表外部注册状态、商标权属或品牌可用性。" /><Button variant="outline" onClick={onOpen}>查看本次查询详情</Button></div>; }

function Facts({ rows }: { rows: [string, string | number][] }) { return <dl>{rows.map(([key, value]) => <div className="detail-pair" key={key}><dt>{key}</dt><dd>{value === '' ? '未提供' : value}</dd></div>)}</dl>; }
function QueryDetail({ detail, page, result, events, onClose }: { detail: Detail; page: QueryPage; result: Result | null; events: DetailEvent[]; onClose: () => void }) {
  const title = detail.kind === 'history' ? `${queryPages[page]}记录` : detail.kind === 'order' ? '订单查询详情' : detail.kind === 'price' ? '定价查询详情' : '品牌查询详情';
  return <DetailDrawer title={title} timeline={events} timelineTitle="本页查询记录" size="1080px" onClose={onClose}><div className="detail-content query-detail">
    {detail.kind === 'history' && <><div className="detail-title"><div><h2>{queryPages[page]} · 当前会话</h2><span className="secondary">记录查询与查看详情</span></div></div><h3>当前查询上下文</h3><Facts rows={[["已提交条件", result?.filters.query || '尚未提交'], ["查询时间", result?.time || '—'], ["查询记录", `${events.length} 条`], ["数据来源", '本地合成示例']]} /><p className="query-detail-note">右侧仅为本页会话操作记录，刷新后清空；不代表订单履约、定价维护或品牌授权历史。</p></>}
    {detail.kind === 'order' && <><div className="detail-title"><div><h2>{detail.row.systemOrder}</h2><span className="secondary">{detail.row.platformOrder}</span></div><Tag variant="light">导入总表示例</Tag></div><h3>订单与商品</h3><Facts rows={[["订单日期", detail.row.date], ["当前可靠简称", detail.row.store || '未关联可靠简称'], ["原导入店铺名", detail.row.originalStore], ["站点 / 归属", `${detail.row.site} / ${detail.row.group}`], ["品名", detail.row.product], ["型号", detail.row.model], ["数量", `${detail.row.quantity} 件`], ["商品 SKU", detail.row.sku], ["来源价格", `${detail.row.sourcePrice}（原表值）`]]} /><p className="query-detail-note">来源价格的币种和经济含义未确定，不能当作单价、销售额或订单金额汇总。</p><h3>物流来源</h3><Facts rows={[["发货渠道（原表）", detail.row.shippingChannel], ["预计到达（原表）", detail.row.expectedArrival]]} />{trackingConflict(detail.row) && <Alert theme="warning" message="多个来源的运单值不同，分别保留供核对，不自动选择最终运单。" />}{detail.row.tracking.length ? detail.row.tracking.map((item, i) => <section className="query-tracking-item" key={`${item.source}-${i}`}><strong>{item.source}</strong><span className="numeric">{item.number}</span><p className="secondary">{item.note}</p></section>) : <p>原表未提供运单，不推定发货状态。</p>}<p className="query-detail-note">{detail.row.logisticsNote}</p><h3>关联、客户与来源</h3><Facts rows={[["关联系统单", detail.row.related], ["客户联系方式", '本查询样板不展示'], ["来源文件", detail.row.sourceFile], ["导入时间", detail.row.importedAt], ["来源说明", detail.row.sourceNote]]} /></>}
    {detail.kind === 'price' && <><div className="detail-title"><div><h2>{detail.row.product}</h2><span className="secondary">{detail.row.id} · 仅查询启用定价</span></div><Tag theme={detail.row.guidance && detail.row.guidance > 0 ? 'success' : 'warning'} variant="light">{detail.row.guidance && detail.row.guidance > 0 ? '已有报价' : '暂无报价'}</Tag></div><h3>销售指导价</h3><Facts rows={[["销售规格", detail.row.spec], ["国家", detail.row.country === 'US' ? '美国 · US' : '加拿大 · CA'], ["货源类型", detail.row.source], ["币种", detail.row.currency], ["指导价", priceText(detail.row)], ["更新时间", detail.row.updated]]} /><p className="query-detail-note">按本条销售规格与目的国家使用指导价。暂无报价表示报价信息尚不完整，不是免费销售。</p><h3>查询范围</h3><p>仅提供销售指导信息；本查询不包含供应商、成本、倍率、采购参考价及维护历史。</p><p className="query-detail-note">右侧为本页会话查询记录，不代表定价审批或价格修改记录。</p></>}
    {detail.kind === 'brand' && <><div className="detail-title"><div><h2>{detail.row.name}</h2><span className="secondary">本地合成品牌档案</span></div><Tag theme={detail.row.exists ? 'success' : 'default'} variant="light">{detail.row.exists ? '已收录' : '未收录'}</Tag></div><h3>本次核对</h3><Facts rows={[["提交名称", result?.filters.query || detail.row.name], ["匹配名称", detail.row.exists ? detail.row.name : '未匹配到名称'], ["查询时间", result?.time || '—'], ["匹配方式", '完整名称；忽略首尾空白和英文大小写']]} /><p className="query-detail-note">仅判断内部档案是否有该名称。未提供外部注册、商标权属、授权店铺或品牌可用性结论。</p></>}
  </div></DetailDrawer>;
}
