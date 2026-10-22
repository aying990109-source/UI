import { useEffect, useMemo, useRef, useState } from 'react';
import { Breadcrumb, Button, DateRangePicker, Dialog, Empty, Input, MessagePlugin, Popup, PrimaryTable, Select, Switch, Tabs, Tag, Textarea, Tooltip } from 'tdesign-react';
import type { PrimaryTableCol } from 'tdesign-react';
import { AddIcon, ChatIcon, ChevronRightIcon, DownloadIcon, HelpCircleIcon, MenuFoldIcon, MenuUnfoldIcon, SearchIcon } from 'tdesign-icons-react';
import 'tdesign-react/es/style/index.css';
import './preview.css';
import { requestStages, sampleRows, stageTheme, type RequestRow } from './data';
import { RequestForm } from './RequestForm';
import { PurchaseRequestDetails, type PurchaseRequestDetailsHandle } from './PurchaseRequestDetails';
import { PreviewDialog } from './PreviewDialog';
import { ProcessingPages } from './ProcessingPages';
import { PurchaseRouteCell, purchaseRouteTitle } from './PurchaseRouteCell';
import { CopyableText } from './CopyableText';
import { processingPages } from './processing-data';
import { ShippingPages } from './ShippingPages';
import { shippingPages } from './shipping-data';
import { OperationsPages } from './OperationsPages';
import { operationPages } from './operations-data';
import { OrderPages } from './OrderPages';
import { orderPages } from './order-data';
import { CatalogPages } from './CatalogPages';
import { catalogPages } from './catalog-data';
import { LogisticsArchivePages } from './LogisticsArchivePages';
import { logisticsArchivePages } from './logistics-archive-data';
import { QueryPages } from './QueryPages';
import { queryPages } from './query-data';
import { MiddleDataPages } from './MiddleDataPages';
import { middlePages } from './middle-data';
import { BrandPricingPages } from './BrandPricingPages';
import { brandPricingPages } from './brand-pricing-data';
import { PreviewAccountMenu, PreviewNavigation, navigationGroupFor } from './PreviewNavigation';
import { CsvImportButton } from './FileTransferActions';
import { ListFilterToolbar } from './ListFilterToolbar';
import { ReplenishmentProcessingPages } from './ReplenishmentProcessingPages';
import { replenishmentProcessingPages } from './replenishment-processing-data';
import { StoreInformationPages } from './StoreInformationPages';
import { LinkMaintenancePages } from './LinkMaintenancePages';
import { linkMaintenancePages } from './link-maintenance-data';
import { SalesTargetPages } from './SalesTargetPages';
import { salesTargetPages } from './sales-target-data';
import { AccessPreviewPages } from './AccessPreviewPages';
import { accessPreviewPages } from './access-preview-data';
import { WorkbenchPreviewPages } from './WorkbenchPreviewPages';
import { workbenchPages } from './workbench-preview-data';
import { SupportPreviewPages } from './SupportPreviewPages';
import { LoginPreview } from './LoginPreview';
import { supportPages } from './support-preview-data';
import { UtilityPreviewPages } from './UtilityPreviewPages';
import { readPreferences, savePreferences, utilityPages } from './utility-preview-data';
import { ThemeToggle } from './ThemeSelector';
import { initialStoreInformation, projectStoreAuthorizations, storeInformationPages } from './store-information-data';
import { initialBrandPricingState } from './brand-pricing-data';

const emptyFilters = { query: '', type: '', site: '', dates: [] as string[] };
const stages = ['全部申请', ...requestStages];
const opts = (values: string[]) => values.map(value => ({ label: value, value }));
const number = (value: number) => value.toLocaleString('zh-CN');
const pageNames = { requests: '采购申请', ...processingPages, ...shippingPages, ...operationPages, ...orderPages, ...catalogPages, ...logisticsArchivePages, ...queryPages, ...middlePages, ...brandPricingPages, ...replenishmentProcessingPages, ...storeInformationPages, ...linkMaintenancePages, ...salesTargetPages, ...accessPreviewPages, ...workbenchPages, ...supportPages, ...utilityPages };

function MobileApprovalMenu({ row, busy, approving, error, onApprove, onReject }: {
  row: RequestRow; busy: boolean; approving: boolean; error: boolean;
  onApprove: (row: RequestRow) => void; onReject: (row: RequestRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => document.querySelector<HTMLElement>(`.purchase-approval-menu[data-row="${row.id}"] button`)?.focus(), 30);
    return () => clearTimeout(id);
  }, [open, row.id]);
  const choose = (action: 'approve' | 'reject') => {
    setOpen(false);
    trigger.current?.focus();
    if (action === 'approve') onApprove(row); else onReject(row);
    if (action === 'approve') requestAnimationFrame(() => (trigger.current?.disabled ? trigger.current?.closest('.purchase-row-actions')?.querySelector<HTMLButtonElement>('button') : trigger.current)?.focus());
  };
  return <Popup trigger="click" visible={open} disabled={busy} placement="bottom-right" overlayClassName="purchase-approval-dropdown"
    onVisibleChange={(visible, context) => { setOpen(visible); if (!visible && context.trigger === 'keydown-esc') trigger.current?.focus(); }}
    content={<div className="purchase-approval-menu" data-row={row.id} role="menu" aria-label={`${row.id} 审批操作`} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current?.focus(); } }}>
      <button type="button" role="menuitem" disabled={busy} onClick={() => choose('approve')}>{error ? '重试通过' : '通过'}</button>
      <button type="button" role="menuitem" disabled={busy} onClick={() => choose('reject')}>驳回</button>
    </div>}>
    <Button ref={trigger} variant="text" theme="primary" loading={approving} aria-haspopup="menu" aria-expanded={open}>审批 ▾</Button>
  </Popup>;
}

export default function App() {
  const [preferences, setPreferences] = useState(readPreferences);
  const updatePreferences = (next: typeof preferences) => setPreferences(savePreferences(next));
  const changeTheme = (theme: typeof preferences.theme) => {
    try { updatePreferences({ ...preferences, theme }); }
    catch (error) { void MessagePlugin.error((error as Error).message); }
  };
  const [activePage, setActivePage] = useState<string>(() => window.location.hash === '#login' ? 'loginPreview' : readPreferences().defaultPage);
  const [signedIn, setSignedIn] = useState(false);
  const lastWorkspacePage = useRef<string>(readPreferences().defaultPage);
  const previousPage = useRef(activePage);
  const navigate = (next: string) => {
    if (next === 'loginPreview') {
      if (window.location.hash !== '#login') window.location.hash = 'login';
    } else {
      lastWorkspacePage.current = next;
      if (window.location.hash === '#login') window.history.pushState(null, '', window.location.pathname + window.location.search);
    }
    setActivePage(next);
  };
  useEffect(() => {
    const syncLoginRoute = () => setActivePage(window.location.hash === '#login' ? 'loginPreview' : lastWorkspacePage.current);
    window.addEventListener('hashchange', syncLoginRoute);
    window.addEventListener('popstate', syncLoginRoute);
    return () => { window.removeEventListener('hashchange', syncLoginRoute); window.removeEventListener('popstate', syncLoginRoute); };
  }, []);
  useEffect(() => {
    document.title = `${pageNames[activePage as keyof typeof pageNames]} · 企业运营工作台样板`;
    if (previousPage.current !== activePage && activePage !== 'loginPreview') document.getElementById('main')?.focus({ preventScroll: true });
    previousPage.current = activePage;
  }, [activePage]);
  const pageName = pageNames[activePage as keyof typeof pageNames];
  const navigationGroup = navigationGroupFor(activePage);
  const [collapsed, setCollapsed] = useState(false);
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 680px)').matches);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 680px)');
    const change = () => { setNarrow(query.matches); setMobileOpen(false); };
    query.addEventListener('change', change); return () => query.removeEventListener('change', change);
  }, []);
  const [rows, setRows] = useState(sampleRows);
  const [brandState, setBrandState] = useState(initialBrandPricingState);
  const [storeRows, setStoreRows] = useState(initialStoreInformation);
  const updateStoreRows = (next: typeof storeRows) => { setStoreRows(next); setBrandState(previous => projectStoreAuthorizations(previous, next)); };
  const [filters, setFilters] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [stage, setStage] = useState('全部申请');
  const [selected, setSelected] = useState<(string | number)[]>([]);
  const [batchAction, setBatchAction] = useState<'approve' | 'reject' | null>(null);
  const [batchNote, setBatchNote] = useState('');
  const batchVerb = batchAction === 'approve' ? '通过' : '驳回';
  const openBatch = (action: 'approve' | 'reject') => { setBatchNote(''); setBatchAction(action); };
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [mineOnly, setMineOnly] = useState(false);
  const [busyKeys, setBusyKeys] = useState<string[]>([]);
  const busyRef = useRef(new Set<string>());
  const [approvalErrors, setApprovalErrors] = useState<Record<string, string>>({});
  const [rejectRow, setRejectRow] = useState<RequestRow | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [discardNote, setDiscardNote] = useState(false);
  const [rejectError, setRejectError] = useState('');
  const failedOnce = useRef(new Set<string>());
  const [showForm, setShowForm] = useState(false);
  const details = useRef<PurchaseRequestDetailsHandle>(null);
  const [showAbout, setShowAbout] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const openForm = () => { opener.current = document.activeElement as HTMLElement; setShowForm(true); };
  const closeForm = () => { setShowForm(false); requestAnimationFrame(() => opener.current?.focus()); };
  const reset = () => { setFilters(emptyFilters); setApplied(emptyFilters); setStage('全部申请'); setMineOnly(false); setPage(1); setSelected([]); };
  const filtered = useMemo(() => rows.filter(row => {
    const query = applied.query.trim().toLowerCase();
    return (!query || `${row.id} ${row.product} ${row.applicant}`.toLowerCase().includes(query)) &&
      (!applied.type || row.purchaseType === applied.type) && (!applied.site || row.site === applied.site) &&
      (!applied.dates[0] || row.date >= applied.dates[0]) && (!applied.dates[1] || row.date <= applied.dates[1]);
  }), [rows, applied]);
  const stagedRows = filtered.filter(row => stage === '全部申请' || row.status === stage);
  const visibleRows = mineOnly ? stagedRows.filter(row => row.awaitingMyApproval) : stagedRows;
  const showDetail = (row: RequestRow) => details.current?.open(row);
  const startReject = (row: RequestRow) => { setRejectRow(row); setRejectNote(''); setDiscardNote(false); setRejectError(''); };
  const closeReject = () => { if (rejectRow && busyRef.current.has(`reject:${rejectRow.id}`)) return; if (rejectNote) { setDiscardNote(!discardNote); return; } setRejectRow(null); setDiscardNote(false); };
  async function performApproval(row: RequestRow, action: 'approve' | 'reject') {
    const key = `${action}:${row.id}`;
    if ([...busyRef.current].some(value => value.endsWith(`:${row.id}`))) return false;
    busyRef.current.add(key); setBusyKeys([...busyRef.current]);
    setApprovalErrors(previous => ({ ...previous, [row.id]: '' }));
    if (action === 'reject') setRejectError('');
    await new Promise(resolve => setTimeout(resolve, 650));
    busyRef.current.delete(key); setBusyKeys([...busyRef.current]);
    // One fixed sample fails once so the local error and retry states can be inspected.
    if (row.id === sampleRows[4].id && !failedOnce.current.has(key)) {
      failedOnce.current.add(key);
      if (action === 'reject') setRejectError('示例提交失败，请保留备注后重试。');
      else setApprovalErrors(previous => ({ ...previous, [row.id]: '示例操作失败，请重试通过。' }));
      return false;
    }
    void MessagePlugin.success(`${row.id} 已${action === 'approve' ? '通过' : '驳回'}（本地演示）`);
    return true;
  }
  const approve = (row: RequestRow) => { void performApproval(row, 'approve'); };
  const confirmReject = () => { if (rejectRow) void performApproval(rejectRow, 'reject').then(success => { if (success) setRejectRow(null); }); };
  const columns: PrimaryTableCol<RequestRow>[] = [
    { colKey: 'row-select', type: 'multiple', width: 40, fixed: 'left', checkProps: ({ row }) => ({ title: `选择 ${row.id}`, label: <span className="sr-only">选择 {row.id}</span> }) },
    { colKey: 'id', title: '采购单号 / 申请日期', width: 160, cell: ({ row }) => <div className="cell-stack"><Button variant="text" theme="primary" onClick={() => showDetail(row)}>{row.id}</Button><span className="secondary numeric">{row.date}</span></div> },
    { colKey: 'product', title: '采购商品', width: 216, cell: ({ row }) => <div className="cell-stack purchase-product-cell"><CopyableText label="品名" value={row.product} className="product-name" /><span className="secondary">{row.color} <span className="cell-dot">·</span> {row.carton ? `${row.carton} 件/箱` : '装箱数待采购确认'}</span></div> },
    { colKey: 'quantity', title: '当前采购量', align: 'right', width: 108, sorter: (a, b) => a.quantity - b.quantity, cell: ({ row }) => <span className="numeric quantity">{number(row.quantity)} <small>件</small></span> },
    { colKey: 'purchaseType', title: purchaseRouteTitle, width: 154, cell: ({ row }) => <PurchaseRouteCell row={row} /> },
    { colKey: 'applicant', title: '申请人 / 所属小组', width: 110, cell: ({ row }) => <div className="cell-stack"><span>{row.applicant}</span><span className="secondary">{row.group}</span></div> },
    { colKey: 'status', title: '状态', width: 88, cell: ({ row }) => <Tag theme={stageTheme[row.status]} variant="light" size="small">{row.status}</Tag> },
    { colKey: 'remark', title: '备注', width: 200, ellipsis: true, cell: ({ row }) => row.remark.trim() || '—' },
    { colKey: 'actions', title: <div className="purchase-actions-heading"><span>操作</span>{selected.length > 0 && <div className="purchase-batch-actions"><Button type="button" size="small" variant="text" theme="primary" onClick={() => openBatch('approve')}>批量通过</Button><Button type="button" size="small" variant="text" theme="danger" onClick={() => openBatch('reject')}>批量驳回</Button></div>}</div>, width: narrow ? 112 : 216, fixed: 'right', cell: ({ row }) => {
      const busy = busyKeys.some(key => key.endsWith(`:${row.id}`));
      return <div className="purchase-action-cell" onClick={event => event.stopPropagation()}><div className="purchase-row-actions"><Button variant="text" onClick={() => showDetail(row)}>详情</Button>{row.awaitingMyApproval && (narrow ? <MobileApprovalMenu row={row} busy={busy} approving={busyKeys.includes(`approve:${row.id}`)} error={!!approvalErrors[row.id]} onApprove={approve} onReject={startReject} /> : <><Button variant="text" theme="primary" loading={busyKeys.includes(`approve:${row.id}`)} disabled={busy} onClick={() => approve(row)}>{approvalErrors[row.id] ? '重试' : '通过'}</Button><Button variant="text" theme="danger" disabled={busy} onClick={() => startReject(row)}>驳回</Button></>)}</div>{approvalErrors[row.id] && <span className="purchase-action-error" role="alert">{approvalErrors[row.id]}</span>}</div>;
    } },
  ];

  function exportSelection() {
    const exported = selected.length ? visibleRows.filter(row => selected.includes(row.id)) : visibleRows;
    const cell = (value: string | number) => `"${String(value).replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`;
    const content = [['采购单号', '申请日期', '品名', '当前采购量', '站点', '状态'], ...exported.map(row => [row.id, row.date, row.product, row.quantity, row.site, row.status])].map(row => row.map(cell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = '采购申请-示例数据.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    void MessagePlugin.success(`已导出 ${exported.length} 条示例申请`);
  }

  const navigationAction = narrow ? '打开业务导航' : collapsed ? '展开导航' : '收起导航';
  return <>
    {activePage === 'loginPreview' && <LoginPreview theme={preferences.theme} onThemeChange={changeTheme} onBrowse={() => navigate(lastWorkspacePage.current)} onLogin={() => { setSignedIn(true); navigate('workbenchHome'); void MessagePlugin.success('演示登录成功'); }} />}
    <div hidden={activePage === 'loginPreview'} className={`preview-app${collapsed ? ' navigation-collapsed' : ''}${preferences.density === 'compact' ? ' is-compact' : ''}`}>
    <a className="skip-link" href="#main">跳至{pageName}</a>
    <header className="topbar">
      <div className="brand"><Tooltip content={navigationAction} visible={mobileOpen ? false : undefined}><Button className="navigation-toggle" variant="text" shape="square" icon={collapsed || narrow ? <MenuUnfoldIcon /> : <MenuFoldIcon />} aria-label={navigationAction} aria-expanded={narrow ? mobileOpen : !collapsed} onClick={() => narrow ? setMobileOpen(true) : setCollapsed(!collapsed)} /></Tooltip><strong>企业运营工作台</strong></div>
      <div className="topbar-right">
        <Tag variant="light">交互样板 · 示例数据</Tag>
        <ThemeToggle value={preferences.theme} onChange={changeTheme} />
        <Tooltip content="业务助手"><Button className="topbar-action" variant="text" shape="square" icon={<ChatIcon />} aria-label="业务助手" aria-current={activePage === 'businessAssistant' ? 'page' : undefined} onClick={() => navigate('businessAssistant')} /></Tooltip>
        <Tooltip content="帮助文档"><Button className="topbar-action" variant="text" shape="square" icon={<HelpCircleIcon />} aria-label="帮助文档" aria-current={activePage === 'helpDocuments' ? 'page' : undefined} onClick={() => navigate('helpDocuments')} /></Tooltip>
        <PreviewAccountMenu activePage={activePage} signedIn={signedIn} onNavigate={navigate} onAbout={() => setShowAbout(true)} onSessionAction={() => { setSignedIn(false); navigate('loginPreview'); }} />
      </div>
    </header>
    <PreviewNavigation activePage={activePage} pageNames={pageNames} collapsed={collapsed} narrow={narrow} mobileOpen={mobileOpen} onNavigate={navigate} onMobileClose={() => setMobileOpen(false)} />
    <main id="main" className="workspace" tabIndex={-1}>
      <Breadcrumb separator={<ChevronRightIcon />}>{activePage !== 'workbenchHome' && (navigationGroup ? <Breadcrumb.BreadcrumbItem>{navigationGroup.label}</Breadcrumb.BreadcrumbItem> : <Breadcrumb.BreadcrumbItem href="#main" onClick={event => { event.preventDefault(); navigate('workbenchHome'); }}>工作台</Breadcrumb.BreadcrumbItem>)}<Breadcrumb.BreadcrumbItem>{pageName}</Breadcrumb.BreadcrumbItem></Breadcrumb>
      <div hidden={activePage !== 'requests'}>
      <h1 className="sr-only">采购申请</h1>
      <section className="filter-panel" aria-label="筛选采购申请">
        <form onSubmit={event => { event.preventDefault(); setApplied({ ...filters }); setPage(1); setSelected([]); }}>
          <ListFilterToolbar fileActions={<><CsvImportButton title="采购申请" data={{ headers: ['采购单号', '申请日期', '品名', '当前采购量', '站点', '状态'], rows: visibleRows.map(row => [row.id, row.date, row.product, row.quantity, row.site, row.status]) }} /><Button type="button" icon={<DownloadIcon />} variant="outline" disabled={!visibleRows.length} onClick={exportSelection}>{selected.length ? '导出所选' : '导出当前筛选'}</Button></>} create={<Button theme="primary" type="button" icon={<AddIcon />} onClick={openForm}>新建采购申请</Button>} active={[!!filters.query, !!filters.type, !!filters.site, !!filters.dates.length]} fields={<>
            <label className="keyword-filter"><span>关键词</span><Input value={filters.query} onChange={query => setFilters({ ...filters, query })} prefixIcon={<SearchIcon />} clearable placeholder="采购单号、品名、申请人（空格分隔）" aria-label="关键词" /></label>
            <label><span>采购类型</span><Select value={filters.type} onChange={value => setFilters({ ...filters, type: String(value || '') })} options={opts(['国内采购', '海外采购'])} clearable placeholder="全部类型" inputProps={{ name: 'filter-type' }} /></label>
            <label><span>站点</span><Select value={filters.site} onChange={value => setFilters({ ...filters, site: String(value || '') })} options={opts(['US', 'CA'])} clearable placeholder="全部站点" inputProps={{ name: 'filter-site' }} /></label>
            <label className="date-filter"><span>申请日期</span><DateRangePicker value={filters.dates} onChange={values => setFilters({ ...filters, dates: values.map(String) })} clearable /></label>
          </>} query={<Button variant="outline" type="submit">查询</Button>} reset={<Button variant="text" type="button" onClick={reset}>重置</Button>} />
        </form>
      </section>
      <section className="list-panel" aria-label="采购申请列表">
        <div className="list-heading">
          <Tabs value={stage} onChange={value => { setStage(String(value)); setPage(1); setSelected([]); }}>
            {stages.map(value => <Tabs.TabPanel key={value} value={value} label={<button className="tab-label" aria-pressed={stage === value}>{value}<span className="tab-count">{(mineOnly ? filtered.filter(row => row.awaitingMyApproval) : filtered).filter(row => value === '全部申请' || row.status === value).length}</span></button>} />)}
          </Tabs>
          <div className={`list-meta${selected.length ? ' has-selection' : ''}`}>
            <div className="selection-summary" aria-live="polite">{selected.length ? <>已选 <strong>{selected.length}</strong> 条，共 <strong>{number(visibleRows.filter(row => selected.includes(row.id)).reduce((total, row) => total + row.quantity, 0))}</strong> 件货<Button variant="text" theme="primary" onClick={() => setSelected([])}>取消选择</Button></> : <><strong>{visibleRows.length}</strong> 条申请，共 <strong>{number(visibleRows.reduce((total, row) => total + row.quantity, 0))}</strong> 件货</>}</div>
            <label className="purchase-mine-switch"><Switch value={mineOnly} onChange={value => { setMineOnly(Boolean(value)); setPage(1); setSelected([]); }} aria-label="仅看待我审批" /><span>仅看待我审批</span></label>
          </div>
        </div>
        <div className="table-scroll" role="region" aria-label="采购申请表格，可横向滚动" tabIndex={0}>
          <PrimaryTable<RequestRow> rowKey="id" data={visibleRows} columns={columns} size="small" hover tableLayout="fixed" selectedRowKeys={selected}
            onSelectChange={keys => setSelected(keys)} pagination={{ current: page, pageSize, total: visibleRows.length, pageSizeOptions: [10, 20, 50, 100], showJumper: true }}
            onPageChange={info => { setPage(info.current); setPageSize(info.pageSize); }}
            empty={mineOnly ? <Empty title="暂无待你审批的申请" action={<Button variant="outline" onClick={() => { setMineOnly(false); setStage('全部申请'); setPage(1); }}>查看全部申请</Button>} /> : <Empty title="没有符合条件的申请" description="调整筛选条件，或重置后查看全部申请。" action={<Button variant="outline" onClick={reset}>重置筛选</Button>} />} />
        </div>
      </section>
      </div>
      <ProcessingPages active={activePage} narrow={narrow} />
      <ShippingPages active={activePage} />
      <OperationsPages active={activePage} />
      <OrderPages active={activePage} />
      <CatalogPages active={activePage} />
      <LogisticsArchivePages active={activePage} />
      <QueryPages active={activePage} />
      <MiddleDataPages active={activePage} />
      <BrandPricingPages active={activePage} state={brandState} onChange={setBrandState} stores={storeRows} />
      <ReplenishmentProcessingPages active={activePage} />
      <StoreInformationPages active={activePage} brands={brandState} sharedRows={storeRows} onChange={updateStoreRows} onBrandsChange={setBrandState} />
      <LinkMaintenancePages active={activePage} />
      <SalesTargetPages active={activePage} />
      <AccessPreviewPages active={activePage} />
      <WorkbenchPreviewPages active={activePage} onNavigate={navigate} />
      <SupportPreviewPages active={activePage} onNavigate={navigate} signedIn={signedIn} />
      <UtilityPreviewPages active={activePage} preferences={preferences} onPreferences={updatePreferences} />
      <footer className="workspace-footer">TDesign 真实组件 · 所有记录均为合成示例</footer>
    </main>
    {showForm && <RequestForm onClose={closeForm} onCreate={row => { setRows([row, ...rows]); reset(); closeForm(); void MessagePlugin.success(`示例申请 ${row.id} 已提交`); }} />}
    <PurchaseRequestDetails ref={details} onApprove={approve} onReject={startReject} busyKeys={busyKeys} errors={approvalErrors} rejectionOpen={!!rejectRow} />
    {batchAction && <PreviewDialog title={`批量${batchVerb}`} width={520} className="purchase-reject-dialog" initialFocus={batchAction === 'reject' ? 'textarea' : undefined} onClose={() => setBatchAction(null)} footer={<div className="purchase-reject-footer"><span>仅演示界面反馈</span><div><Button variant="outline" onClick={() => setBatchAction(null)}>取消</Button><Button theme={batchAction === 'reject' ? 'danger' : 'primary'} onClick={() => { void MessagePlugin.success(`已演示批量${batchVerb} ${selected.length} 条申请，列表状态保持不变`); setBatchAction(null); }}>确认{batchVerb}</Button></div></div>}>
      <div className="purchase-reject-body"><p><strong>确认{batchVerb}选中的 {selected.length} 条采购申请？</strong><span>本次操作不会改变申请状态。</span></p>{batchAction === 'reject' && <label><span>备注（选填）</span><Textarea value={batchNote} onChange={setBatchNote} maxlength={2000} autosize={{ minRows: 4, maxRows: 4 }} placeholder="填写统一的驳回原因，便于申请人查看" aria-label="批量驳回备注" /></label>}</div>
    </PreviewDialog>}
    {rejectRow && <PreviewDialog title="驳回申请" width={480} className="purchase-reject-dialog" initialFocus="textarea" returnFocus={() => document.querySelector<HTMLElement>('.detail-drawer .purchase-detail-footer .t-button--theme-danger')} onClose={closeReject} footer={<div className="purchase-reject-footer">{discardNote ? <><span>放弃已填写的备注？</span><div><Button variant="outline" onClick={() => setDiscardNote(false)}>继续填写</Button><Button theme="danger" onClick={() => { setRejectRow(null); setDiscardNote(false); }}>放弃填写</Button></div></> : <><span>仅演示界面反馈，不写入真实申请</span><div><Button variant="outline" disabled={busyKeys.includes(`reject:${rejectRow.id}`)} onClick={closeReject}>取消</Button><Button theme="danger" loading={busyKeys.includes(`reject:${rejectRow.id}`)} disabled={busyKeys.includes(`reject:${rejectRow.id}`)} onClick={confirmReject}>确认驳回</Button></div></>}</div>}>
      <div className="purchase-reject-body"><p><strong>{rejectRow.id}</strong><span>{rejectRow.product}</span></p><label><span>备注（选填）</span><Textarea value={rejectNote} onChange={value => { setRejectNote(value); setDiscardNote(false); }} maxlength={2000} autosize={{ minRows: 4, maxRows: 4 }} placeholder="填写驳回原因，便于申请人查看" aria-label="驳回备注" /></label>{rejectError && <p className="purchase-action-error" role="alert">{rejectError}</p>}</div>
    </PreviewDialog>}
    <Dialog visible={showAbout} header="TDesign 采购协作样板" width={480} footer={<Button theme="primary" onClick={() => setShowAbout(false)}>开始体验</Button>} onClose={() => setShowAbout(false)}>
      <div className="about-content"><p>使用真实 TDesign 表格、筛选、表单、弹窗、抽屉与时间线，验证企业运营工作台中的阅读和操作体验。</p><p>{Object.keys(pageNames).length} 个页面覆盖采购、出货、物流、补货、刊登、库存、订单处理、采购档案、数据查询及中台数据。所有详情统一使用抽屉。</p><p>数据仅保存在当前页面，刷新后复原。各批页面使用独立示例集；运营页共享来源余额，订单处理页的售后与补发关联，档案页共享主档与供货关系。每日发货与售后登记来源分开。主图及 EAN CSV 仅本地读取，EAN 和导出均为示例；不连接业务接口或发送真实文件。</p></div>
    </Dialog>
  </div></>;
}


