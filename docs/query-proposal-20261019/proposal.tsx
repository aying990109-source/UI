// Disposable design proposal. This entry is not imported by the application.
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import 'tdesign-react/es/_util/react-19-adapter';
import { Alert, Avatar, Breadcrumb, Button, Descriptions, Drawer, Empty, Input, MessagePlugin, PrimaryTable, Select, Tag, type InputRef, type PrimaryTableCol } from 'tdesign-react';
import { CheckCircleFilledIcon, ChevronRightIcon, DownloadIcon, FileSearchIcon, HistoryIcon, InfoCircleIcon, MenuFoldIcon, MenuUnfoldIcon, SearchIcon, UploadIcon } from 'tdesign-icons-react';
import 'tdesign-react/es/style/index.css';
import '../../scripts/fixtures/purchase-request-tdesign/preview.css';
import { PreviewNavigation } from '../../scripts/fixtures/purchase-request-tdesign/PreviewNavigation';
import { ThemeToggle } from '../../scripts/fixtures/purchase-request-tdesign/ThemeSelector';
import { ImportPreviewDialog } from '../../scripts/fixtures/purchase-request-tdesign/FileTransferActions';
import { emptyQuery, initialQueryData, priceText, queryExamples, queryPages, requireQuery, searchBrand, searchOrders, searchPrices, trackingConflict, type QueryFilters, type QueryOrder, type QueryPage, type QueryPrice } from '../../scripts/fixtures/purchase-request-tdesign/query-data';
import './proposal.css';

const source = initialQueryData();
const names = { ...queryPages, workbenchHome: '工作台', storeInformation: '店铺信息', requests: '采购申请', replenishment: '补货申请', listing: '上架申请', inventory: '库存明细', reviewRequests: 'Review直评需求', sOrderRequests: '运营单需求', vinePlans: 'Vine评价计划', review: '待复审', demand: '采购需求明细', summary: '采购汇总', orders: '采购订单', schedule: '出货排期', replenishmentProcessing: '补货处理', preparation: '出货核对', dispatch: '物流下单', dailyShipping: '每日订单发货', afterSales: '售后记录', reshipments: '补发表', products: '产品主档', suppliers: '供应商', companies: '采购方', warehouses: '海外仓', carriers: '物流商', sales: '销售数据', targets: '目标管理', eanPool: 'EAN 码池', storeBindings: '店铺归组', brandArchive: '品牌档案', productPricing: '产品定价', personnel: '人员与组织', roles: '角色权限', ownership: '单据归属', audit: '权限记录', itemManagement: '物品管理', systemSettings: '系统设置' };
const content = {
  orderQuery: { subtitle: '查找订单，核对商品与物流来源', label: '订单查询条件', placeholder: '输入平台 / 系统单号、品名或店铺名', rule: '多个关键词用空格分隔，同时匹配；完整 Amazon 格式单号精确匹配。', scope: '查询导入订单记录', tips: [['按订单号查找', '完整 Amazon 格式单号精确匹配'], ['按商品或店铺查找', '多个关键词用空格分隔'], ['核对订单信息', '查看商品、店铺与来源运单']] },
  pricingQuery: { subtitle: '按完整品名，查找对应销售指导价', label: '完整品名', placeholder: '输入完整品名，例如：折叠收纳箱', rule: '完整品名匹配，忽略首尾空白及英文大小写；仅显示启用定价。', scope: '查询启用定价', tips: [['输入完整品名', '品名须完整，内部空格与标点一致'], ['选择查询范围', '按国家 / 币种和货源进一步筛选'], ['核对规格与价格', '不同规格、币种分别查看']] },
  brandQuery: { subtitle: '输入完整品牌名称，核对内部档案收录情况', label: '完整品牌名称', placeholder: '输入完整品牌名称，例如：DEMO NORTH', rule: '完整名称匹配，忽略首尾空白及英文大小写；不做模糊或别名匹配。', scope: '查询内部品牌档案', tips: [['输入完整名称', '支持中文与英文品牌名称'], ['核对收录情况', '结果仅表示内部档案是否收录'], ['确认使用边界', '不代表外部注册、权属或可用性']] },
};
const params = new URLSearchParams(location.search);
const firstPage: QueryPage = params.get('page') === 'pricingQuery' ? 'pricingQuery' : params.get('page') === 'brandQuery' ? 'brandQuery' : 'orderQuery';
const initialResult = params.get('state') === 'result';

function Proposal() {
  const [page, setPage] = useState<QueryPage>(firstPage);
  const [theme, setTheme] = useState<'light' | 'dark'>(params.get('theme') === 'dark' ? 'dark' : 'light');
  const [collapsed, setCollapsed] = useState(false), [mobileOpen, setMobileOpen] = useState(false);
  const [narrow, setNarrow] = useState(matchMedia('(max-width: 680px)').matches);
  const [info, setInfo] = useState(false);
  useEffect(() => { document.documentElement.setAttribute('theme-mode', theme); }, [theme]);
  useEffect(() => {
    const media = matchMedia('(max-width: 680px)');
    const update = () => setNarrow(media.matches);
    media.addEventListener('change', update); return () => media.removeEventListener('change', update);
  }, []);
  const navigate = (value: string) => {
    if (value in queryPages) setPage(value as QueryPage);
    else void MessagePlugin.info('当前仅预览三个查询页，可从右上角返回现有样板。');
  };
  return <div className={`preview-app proposal-app${collapsed ? ' navigation-collapsed' : ''}`}>
    <header className="topbar"><div className="brand"><Button variant="text" shape="square" icon={collapsed || narrow ? <MenuUnfoldIcon /> : <MenuFoldIcon />} aria-label="切换导航" onClick={() => narrow ? setMobileOpen(true) : setCollapsed(!collapsed)} /><strong>企业运营工作台</strong></div><div className="topbar-right"><Tag variant="light">方案预览 · 合成数据</Tag><ThemeToggle value={theme} onChange={value => setTheme(value === 'dark' ? 'dark' : 'light')} /><Button variant="text" onClick={() => { location.href = '/'; }}>返回现有样板</Button><Avatar size="30">演</Avatar></div></header>
    <PreviewNavigation activePage={page} pageNames={names} collapsed={collapsed} narrow={narrow} mobileOpen={mobileOpen} onNavigate={navigate} onMobileClose={() => setMobileOpen(false)} />
    <main className="workspace proposal-workspace"><Breadcrumb separator={<ChevronRightIcon />}><Breadcrumb.BreadcrumbItem>数据查询</Breadcrumb.BreadcrumbItem><Breadcrumb.BreadcrumbItem>{queryPages[page]}</Breadcrumb.BreadcrumbItem></Breadcrumb>
      {(Object.keys(queryPages) as QueryPage[]).map(key => <div hidden={page !== key} key={key}><QueryConcept page={key} initial={key === firstPage && initialResult} /></div>)}
      <div className="proposal-caption"><span>待确认方案 · 查询前聚焦输入，查询后聚焦结果</span><Button variant="text" size="small" icon={<InfoCircleIcon />} onClick={() => setInfo(true)}>方案与组件依据</Button></div>
    </main>
    <Drawer visible={info} header="数据查询改版方案" size="540px" footer={false} onClose={() => setInfo(false)}>
      <div className="proposal-brief"><h3>建议：两种状态，一套查询语言</h3><p>初始态将标题、宽输入框、查询按钮与示例集中在一个内容面；提交后查询区收紧，结果直接出现在下方。保留三个页面入口和现有查询规则。</p><h3>三个页面的差异</h3><ul><li>订单：先定位记录，再看商品、店铺及来源运单。</li><li>定价：完整品名为主，国家与货源为第二层条件；保留规格与币种。</li><li>品牌：先给出内部是否收录的结论，再给出匹配依据。</li></ul><h3>官方组件依据</h3><p><a href="https://tdesign.tencent.com/react/components/input" target="_blank" rel="noreferrer">Input：大尺寸、图标、组合输入、错误提示</a></p><p><a href="https://tdesign.tencent.com/react/components/select" target="_blank" rel="noreferrer">Select：国家与货源筛选</a></p><p><a href="https://tdesign.tencent.com/react/components/table" target="_blank" rel="noreferrer">PrimaryTable：结果、分页、固定操作列</a></p><p><a href="https://tdesign.tencent.com/react/components/descriptions" target="_blank" rel="noreferrer">Descriptions：品牌匹配依据</a></p><h3>需要确认的取舍</h3><p>推荐的入口态更像查询工具，首次提交会改变内容布局。如果更重视连续查询时位置完全固定，可始终使用结果态的紧凑头部；入口辨识度会弱一些。</p><p>这份预览使用项目已安装的 TDesign React 1.18.3，没有新增依赖。导入、导出与记录降为辅助操作，不增加新的筛选或数据来源。</p><p>原页面源码未替换。此预览只用于确认视觉与交互；数据仍为现有合成样例。</p></div>
    </Drawer>
  </div>;
}

function QueryConcept({page, initial}: {page: QueryPage; initial: boolean}) {
  const spec = content[page], price = page === 'pricingQuery', brand = page === 'brandQuery';
  const defaultQuery = brand ? 'DEMO NORTH' : '折叠收纳箱';
  const [draft, setDraft] = useState<QueryFilters>(initial ? {...emptyQuery(), query: defaultQuery} : emptyQuery);
  const [applied, setApplied] = useState<QueryFilters | null>(initial ? {...emptyQuery(), query: defaultQuery} : null);
  const [error, setError] = useState(''), [current, setCurrent] = useState(1);
  const [history, setHistory] = useState<string[]>(initial ? [defaultQuery] : []), [historyOpen, setHistoryOpen] = useState(false), [importOpen, setImportOpen] = useState(false);
  const [detail, setDetail] = useState<QueryOrder | QueryPrice | null>(null);
  const input = useRef<InputRef>(null);
  const orders = applied && !price && !brand ? searchOrders(source.orders, applied.query) : [];
  const prices = applied && price ? searchPrices(source.prices, applied) : [];
  const brandResult = applied && brand ? searchBrand(source.brands, applied.query) : null;
  const count = brand ? Number(brandResult?.exists) : price ? prices.length : orders.length;
  const pending = !!applied && JSON.stringify({...draft, query: draft.query.trim()}) !== JSON.stringify(applied);
  const change = (next: QueryFilters) => { setDraft(next); setError(''); };
  const submit = () => {
    try { const next = {...draft, query: requireQuery(draft.query)}; setApplied(next); setDraft(next); setError(''); setCurrent(1); setHistory(previous => [next.query, ...previous]); }
    catch(cause) { setError((cause as Error).message); input.current?.focus(); }
  };
  const reset = () => { setApplied(null); setDraft(emptyQuery()); setCurrent(1); setError(''); input.current?.focus(); };
  const fill = (query: string) => { change({...draft, query}); input.current?.focus(); };
  const showState = (state: 'initial' | 'result' | 'empty') => {
    if (state === 'initial') return reset();
    const next = {...emptyQuery(), query: state === 'empty' ? '未收录的示例名称' : defaultQuery};
    setDraft(next); setApplied(next); setCurrent(1); setError('');
  };
  const exportPreview = () => void MessagePlugin.info('方案预览：正式落地后沿用现有的当前结果导出。');
  const title = queryPages[page];
  const sampleTable = { headers: brand ? ['品牌名称', '收录状态'] : price ? ['产品', '规格', '国家', '货源', '币种', '指导价'] : ['系统订单号', '平台订单号', '品名', '店铺'], rows: [] };
  const orderColumns: PrimaryTableCol<QueryOrder>[] = [
    {colKey:'order',title:'平台单号 / 系统单号',width:228,cell:({row})=><div className="proposal-cell"><Button theme="primary" variant="text" onClick={()=>setDetail(row)}>{row.platformOrder}</Button><span className="secondary">{row.systemOrder}</span></div>},
    {colKey:'product',title:'商品 / 数量',width:160,cell:({row})=><div className="proposal-cell"><span>{row.product}</span><span className="secondary">{row.model} · {row.quantity} 件</span></div>},
    {colKey:'store',title:'店铺 / 站点',width:178,cell:({row})=><div className="proposal-cell"><span>{row.store || row.originalStore}</span><span className="secondary">{row.site} · {row.store ? '当前简称' : '原导入店铺名'}</span></div>},
    {colKey:'tracking',title:'来源运单',width:175,cell:({row})=><div className="proposal-cell"><span>{row.tracking[0]?.number || '原表未提供'}</span><span className={trackingConflict(row)?'proposal-warning':'secondary'}>{trackingConflict(row)?'来源值不同，待核对':row.tracking[0]?'原表运单号':'不推定发货状态'}</span></div>},
    {colKey:'date',title:'订单日期',width:112},
    {colKey:'actions',title:'操作',width:68,fixed:'right',cell:({row})=><Button variant="text" theme="primary" onClick={()=>setDetail(row)}>详情</Button>},
  ];
  const priceColumns: PrimaryTableCol<QueryPrice>[] = [
    {colKey:'product',title:'品名 / 销售规格',width:228,cell:({row})=><div className="proposal-cell"><Button variant="text" theme="primary" onClick={()=>setDetail(row)}>{row.product}</Button><span className="secondary">{row.spec}</span></div>},
    {colKey:'country',title:'国家 / 币种',width:140,cell:({row})=><div className="proposal-cell"><span>{row.country==='US'?'美国':'加拿大'}</span><span className="secondary">{row.country} · {row.currency}</span></div>},
    {colKey:'source',title:'货源类型',width:130},
    {colKey:'guidance',title:'销售指导价',width:150,align:'right',cell:({row})=><span className={row.guidance?'proposal-price':'secondary'}>{priceText(row)}</span>},
    {colKey:'updated',title:'更新时间',width:160,cell:({row})=><div className="proposal-cell"><span>{row.updated.split(' ')[0]}</span><span className="secondary">{row.updated.split(' ')[1]}</span></div>},
    {colKey:'actions',title:'操作',width:68,fixed:'right',cell:({row})=><Button variant="text" theme="primary" onClick={()=>setDetail(row)}>详情</Button>},
  ];
  return <>
    <section className={`proposal-surface${applied ? ' has-result' : ' is-landing'}`} aria-label={title}>
      <div className="proposal-tools"><span>{spec.scope}</span><div><Button variant="text" icon={<HistoryIcon />} onClick={()=>setHistoryOpen(true)}>查询记录{history.length ? ` · ${history.length}` : ''}</Button><Button variant="text" icon={<UploadIcon />} onClick={()=>setImportOpen(true)}>导入 CSV</Button></div></div>
      <div className="proposal-search-area">
        <div className="proposal-title"><h1>{title}</h1><p>{spec.subtitle}</p></div>
        <form onSubmit={event=>{event.preventDefault();submit();}}>
          <div className="proposal-search-row"><Input.Group><Input ref={input} size="large" prefixIcon={<SearchIcon />} clearable value={draft.query} onChange={query=>change({...draft,query})} placeholder={spec.placeholder} aria-label={spec.label} status={error?'error':'default'} /><Button theme="primary" size="large" icon={<SearchIcon />} type="submit">{brand?'核对品牌':'查询'}</Button></Input.Group>{applied&&<Button variant="text" type="button" onClick={reset}>重新开始</Button>}</div>
          {error&&<p className="proposal-error" role="alert">{error}</p>}
          {price&&<div className="proposal-price-filters"><label><span>国家 / 币种</span><Select clearable value={draft.country} placeholder="全部国家" options={[{label:'美国 · USD',value:'US'},{label:'加拿大 · CAD',value:'CA'}]} onChange={country=>change({...draft,country:String(country||'')})}/></label><label><span>货源类型</span><Select clearable value={draft.source} placeholder="全部货源" options={['国内货源','当地货源'].map(value=>({label:value,value}))} onChange={value=>change({...draft,source:String(value||'')})}/></label><span>仅查询启用定价</span></div>}
          <p className="proposal-rule">{spec.rule}</p>
          {!applied&&<div className="proposal-examples"><span>试填示例</span>{queryExamples[page].map(value=><Button variant="text" size="small" key={value} onClick={()=>fill(value)}>{value}</Button>)}<span className="proposal-enter">Enter 查询</span></div>}
        </form>
      </div>
      {!applied?<div className="proposal-guidance">{spec.tips.map(([name,description])=><div key={name}><h2>{name}</h2><p>{description}</p></div>)}</div>:<div className="proposal-results">
        {pending&&<Alert theme="info" className="proposal-pending" message={`条件已修改，点击查询后更新。下方仍为“${applied.query}”的结果。`}/>}
        <div className="proposal-result-bar"><div><h2>{brand?'核对结果':'查询结果'}</h2>{!brand&&<Tag variant="light">{count} 条{price?'定价':'记录'}</Tag>}<span className="secondary">{applied.query}{price?` · ${applied.country||'全部国家'} · ${applied.source||'全部货源'}`:''}</span></div><Button variant="outline" icon={<DownloadIcon />} disabled={pending||!count} onClick={exportPreview}>导出结果</Button></div>
        {brand&&brandResult?<div className="proposal-brand-result"><div className="proposal-brand-verdict">{brandResult.exists?<CheckCircleFilledIcon className="proposal-success"/>:<FileSearchIcon/>}<div><h2>{brandResult.exists?'内部档案已收录':'内部档案未收录'}</h2><p>{brandResult.name}</p></div><Tag theme={brandResult.exists?'success':'default'} variant="light">{brandResult.exists?'已收录':'未收录'}</Tag></div><Descriptions bordered column={narrowWidth()?1:2} items={[{label:'查询名称',content:applied.query},{label:'匹配名称',content:brandResult.exists?brandResult.name:'未匹配到名称'},{label:'匹配方式',content:'完整名称匹配（忽略大小写）'},{label:'数据范围',content:'内部品牌档案 · 合成示例'}]}/><div className="proposal-brand-boundary"><InfoCircleIcon/><p>{brandResult.exists?'已收录仅说明内部档案存在该名称。':'未收录仅说明当前内部档案未匹配到该名称。'}不代表外部注册、商标权属或品牌可用性。</p></div></div>:count?<>
          <div className="proposal-table" role="region" aria-label={`${title}结果表格`} tabIndex={0}>{price?<PrimaryTable rowKey="id" data={prices} columns={priceColumns} tableLayout="fixed" hover size="small"/>:<PrimaryTable rowKey="id" data={orders} columns={orderColumns} tableLayout="fixed" hover size="small" pagination={{current,pageSize:5,total:orders.length,showPageSize:false,showJumper:true}} onPageChange={value=>setCurrent(value.current)}/>}</div><p className="proposal-footnote">{price?'指导价仅供销售参考；不同规格、币种和货源分别核对，不合计或直接比较。':'按系统单记录计数，同一平台单号可有多条记录；缺少物流资料不代表未发货。'}</p>
        </>:<div className="proposal-empty"><Empty image={<FileSearchIcon/>} title={price?'暂无匹配的有效定价':'未找到匹配的订单记录'} description={price?'核对完整品名，或调整国家与货源后重新查询。':'核对单号或减少关键词后重新查询。此处仅查询本地合成记录。'}/><Button variant="outline" onClick={()=>{fill(defaultQuery);}}>填入示例条件</Button></div>}
      </div>}
      <div className="proposal-data-note">本地合成示例 · 未连接外部平台</div>
    </section>
    <div className="proposal-state-controls" role="group" aria-label="预览状态"><span>效果预览</span><Button variant="text" size="small" onClick={()=>showState('initial')}>初始态</Button><Button variant="text" size="small" onClick={()=>showState('result')}>结果态</Button><Button variant="text" size="small" onClick={()=>showState('empty')}>未命中</Button></div>
    <Drawer visible={historyOpen} header="本页查询记录" size="420px" footer={false} onClose={()=>setHistoryOpen(false)}>{history.length?<div className="proposal-history">{history.map((query,i)=><div key={i}><span>{query}</span><Button variant="text" theme="primary" onClick={()=>{fill(query);setHistoryOpen(false);}}>填入条件</Button></div>)}<p className="secondary">仅当前预览会话，刷新后清空。</p></div>:<Empty title="还没有查询记录" description="提交查询后，可在此查看本页查询记录。"/>}</Drawer>
    <Drawer visible={!!detail} header={price?'定价详情':'订单详情'} size="520px" footer={false} onClose={()=>setDetail(null)}>{detail&&<Descriptions column={1} items={'platformOrder'in detail?[{label:'平台单号',content:detail.platformOrder},{label:'系统单号',content:detail.systemOrder},{label:'商品',content:`${detail.product} · ${detail.model}`},{label:'店铺',content:detail.store||detail.originalStore},{label:'来源运单',content:detail.tracking.map(item=>`${item.source}：${item.number}`).join('；')||'原表未提供'},{label:'物流说明',content:detail.logisticsNote}]:[{label:'品名',content:detail.product},{label:'销售规格',content:detail.spec},{label:'国家 / 货源',content:`${detail.country} / ${detail.source}`},{label:'销售指导价',content:priceText(detail)},{label:'更新时间',content:detail.updated}]}/>}</Drawer>
    {importOpen&&<ImportPreviewDialog title={title} data={sampleTable} onClose={()=>setImportOpen(false)}/>}
  </>;
}
function narrowWidth(){return matchMedia('(max-width: 680px)').matches;}
createRoot(document.getElementById('root')!).render(<Proposal/>);
