import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Avatar, Button, Drawer, Menu, Popup } from 'tdesign-react';
import { CartAddIcon, CartIcon, CloseIcon, DashboardIcon, DataBaseIcon, EarthIcon, FilePasteIcon, FlowchartIcon, FolderIcon, LinkIcon, SearchIcon, SettingIcon, ShopIcon, VehicleIcon } from 'tdesign-icons-react';

export const navigationGroups = [
  { id: 'workbench', label: '工作台', icon: DashboardIcon, pages: ['workbenchHome'] },
  { id: 'store-information', label: '店铺信息', icon: ShopIcon, pages: ['storeInformation'] },
  { id: 'query', label: '数据查询', icon: SearchIcon, pages: ['orderQuery', 'pricingQuery', 'brandQuery'] },
  { id: 'operations', label: '运营流程', icon: FlowchartIcon, pages: ['requests', 'replenishment', 'listing', 'inventory'] },
  { id: 'links', label: '链接维护', icon: LinkIcon, pages: ['reviewRequests', 'sOrderRequests', 'vinePlans'] },
  { id: 'purchase', label: '采购处理', icon: CartIcon, pages: ['review', 'demand', 'summary', 'orders', 'schedule'] },
  { id: 'replenishment-processing', label: '补货处理', icon: CartAddIcon, pages: ['replenishmentProcessing'] },
  { id: 'shipping', label: '出货处理', icon: VehicleIcon, pages: ['preparation', 'dispatch'] },
  { id: 'order', label: '订单处理', icon: FilePasteIcon, pages: ['dailyShipping', 'afterSales', 'reshipments'] },
  { id: 'catalog', label: '采购档案', icon: FolderIcon, pages: ['products', 'suppliers', 'companies', 'warehouses', 'carriers'] },
  { id: 'cross-border', label: '跨境数据', icon: EarthIcon, pages: ['sales', 'targets'] },
  { id: 'middle', label: '中台数据', icon: DataBaseIcon, pages: ['eanPool', 'storeBindings', 'brandArchive', 'productPricing'] },
  { id: 'basic-config', label: '基础配置', icon: SettingIcon, pages: ['personnel', 'roles', 'ownership', 'audit', 'itemManagement', 'systemSettings'] },
];
export const navigationGroupFor = (page: string) => navigationGroups.find(group => group.pages.includes(page));

function NavigationFlyout({ label, children, onClose }: { label: string; children: ReactNode; onClose: (restoreFocus: boolean) => void }) {
  return <nav className="nav-flyout" aria-label={`${label}页面`} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) onClose(false); }}
    onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(true); }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const items = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button')], index = items.indexOf(document.activeElement as HTMLButtonElement);
        items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
      }
    }}>
    <div className="nav-flyout-title">{label}</div>{children}
  </nav>;
}

export function PreviewAccountMenu({ activePage, signedIn, onNavigate, onAbout, onSessionAction }: {
  activePage: string; signedIn: boolean; onNavigate: (page: string) => void; onAbout: () => void; onSessionAction: () => void;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [activePage]);
  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) document.getElementById('account-menu-trigger')?.focus();
  };
  const select = (action: () => void) => { close(true); action(); };
  return <Popup trigger="click" placement="bottom-right" visible={open} destroyOnClose overlayClassName="navigation-popup"
    onVisibleChange={(visible, context) => visible ? setOpen(true) : close(context.trigger === 'keydown-esc')}
    content={<NavigationFlyout label="账号" onClose={close}><div id="account-menu" className="account-actions">
      <Button block variant="text" aria-current={activePage === 'personalProfile' ? 'page' : undefined} onClick={() => select(() => onNavigate('personalProfile'))}>个人资料</Button>
      <Button block variant="text" onClick={() => select(onAbout)}>样板说明</Button>
      <Button block variant="text" className="account-session-action" onClick={() => select(onSessionAction)}>{signedIn ? '退出登录' : '登录'}</Button>
    </div></NavigationFlyout>}>
    <Button id="account-menu-trigger" className="topbar-action account-trigger" variant="text" shape="square" aria-label="账号菜单" aria-expanded={open} aria-controls={open ? 'account-menu' : undefined}
      onKeyDown={event => {
        if (!open) return;
        if (event.key === 'Escape') { event.preventDefault(); close(true); }
        if (event.key === 'Tab' && event.shiftKey) close(false);
        if ((event.key === 'Tab' && !event.shiftKey) || event.key === 'ArrowDown') {
          event.preventDefault(); document.querySelector<HTMLButtonElement>('#account-menu button')?.focus();
        }
      }}>
      <Avatar size="30">演</Avatar>
    </Button>
  </Popup>;
}

function NavigationDrawer({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const opener = useRef(document.activeElement as HTMLElement | null);
  const initialize = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const drawer = node.closest('.navigation-drawer');
    drawer?.setAttribute('role', 'dialog'); drawer?.setAttribute('aria-modal', 'true'); drawer?.setAttribute('aria-label', '业务导航');
    requestAnimationFrame(() => { drawer?.querySelector<HTMLButtonElement>('.t-drawer__close-btn button')?.focus(); drawer?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' }); });
  }, []);
  useEffect(() => {
    const background = document.getElementById('root');
    if (background) background.inert = true;
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = [...document.querySelectorAll<HTMLButtonElement>('.navigation-drawer button')].filter(item => !item.disabled && !item.closest('[inert]') && item.getClientRects().length);
      const first = items[0], last = items.at(-1);
      if (first && (!items.includes(document.activeElement as HTMLButtonElement) || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last))) {
        event.preventDefault(); (event.shiftKey ? last : first)?.focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => { if (background) background.inert = false; document.removeEventListener('keydown', trap); requestAnimationFrame(() => opener.current?.focus()); };
  }, []);
  return <Drawer visible attach="body" header="业务导航" placement="left" size="288px" className="navigation-drawer" footer={false} closeOnOverlayClick closeOnEscKeydown onClose={onClose}
    closeBtn={<Button variant="text" shape="square" icon={<CloseIcon />} aria-label="关闭业务导航" />}>
    <div className="navigation-drawer-content" ref={initialize}>{children}</div>
  </Drawer>;
}

export function PreviewNavigation({ activePage, pageNames, collapsed, narrow, mobileOpen, onNavigate, onMobileClose }: {
  activePage: string; pageNames: Record<string, string>; collapsed: boolean; narrow: boolean; mobileOpen: boolean;
  onNavigate: (page: string) => void; onMobileClose: () => void;
}) {
  const [expanded, setExpanded] = useState(navigationGroups.map(group => group.id));
  const [flyout, setFlyout] = useState<string | null>(null);
  const isCollapsed = !narrow && collapsed;
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => { const group = navigationGroupFor(activePage)?.id; if (group) setExpanded(previous => previous.includes(group) ? previous : [...previous, group]); }, [activePage, mobileOpen]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const current = sidebar.current?.querySelector<HTMLElement>('[aria-current="page"]:not([inert])');
      const target = isCollapsed || !current ? sidebar.current?.querySelector<HTMLElement>(`[data-nav-group="${navigationGroupFor(activePage)?.id}"]`) : current;
      target?.scrollIntoView({ block: 'nearest' });
    });
    return () => cancelAnimationFrame(frame);
  }, [activePage, isCollapsed]);
  useEffect(() => { setFlyout(null); }, [collapsed, narrow]);
  const closeFlyout = (restoreFocus: boolean) => {
    if (restoreFocus && flyout) sidebar.current?.querySelector<HTMLButtonElement>(`[data-nav-group="${flyout}"]`)?.focus();
    setFlyout(null);
  };
  const navigate = (page: string) => { onNavigate(page); closeFlyout(true); if (narrow) onMobileClose(); };
  // Native menu rows are not focusable in this version; buttons delegate activation to those rows.
  const icon = (group: typeof navigationGroups[number]) => <span className="nav-root-icon"><group.icon />
    <button type="button" className="nav-root-trigger" data-nav-group={group.id} aria-label={group.label}
      aria-current={group.id === 'workbench' && activePage === 'workbenchHome' ? 'page' : undefined}
      aria-expanded={group.id === 'workbench' ? undefined : isCollapsed ? flyout === group.id : expanded.includes(group.id)}
      onClick={event => { if (isCollapsed && group.id !== 'workbench') event.stopPropagation(); }}
      onKeyDown={event => {
        if (!isCollapsed || group.id === 'workbench') return;
        if (event.key === 'Escape') { event.preventDefault(); closeFlyout(true); }
        if (['ArrowRight', 'ArrowDown'].includes(event.key) || (event.key === 'Tab' && !event.shiftKey && flyout === group.id)) {
          event.preventDefault();
          if (flyout === group.id) document.querySelector<HTMLButtonElement>('.business-menu-popup button')?.focus();
          else setFlyout(group.id);
        }
      }} />
  </span>;
  const menu = <nav className="business-navigation" aria-label="业务页面" onKeyDown={event => {
    const panel = (event.target as HTMLElement).closest('.business-menu-popup');
    if (!panel) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeFlyout(true); }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const items = [...panel.querySelectorAll<HTMLButtonElement>('button')], index = items.indexOf(document.activeElement as HTMLButtonElement);
      items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
    }
  }} onBlur={event => {
    if (flyout && !event.currentTarget.contains(event.relatedTarget) && !(event.relatedTarget as HTMLElement | null)?.closest('.business-menu-popup')) closeFlyout(false);
  }}>
    <Menu className="business-menu" value={activePage} collapsed={isCollapsed} width={narrow ? '100%' : [224, 64]}
      expanded={expanded} onExpand={values => { if (!isCollapsed) setExpanded(values.map(String)); }}>
      {navigationGroups.map(group => group.id === 'workbench'
        ? <Menu.MenuItem key={group.id} value="workbenchHome" icon={icon(group)} onClick={() => navigate('workbenchHome')}><span aria-hidden="true">{group.label}</span></Menu.MenuItem>
        : <Menu.SubMenu key={group.id} value={group.id} icon={icon(group)} title={<span aria-hidden="true">{group.label}</span>}
          popupProps={{ trigger: 'click', visible: flyout === group.id, destroyOnClose: true, overlayClassName: 'business-menu-popup',
            onVisibleChange: (visible, context) => { if (visible) setFlyout(group.id); else if (context.trigger === 'keydown-esc' && flyout === group.id) closeFlyout(true); else setFlyout(current => current === group.id ? null : current); } }}>
          {group.pages.map(page => <Menu.MenuItem key={page} value={page} onClick={() => navigate(page)}>
            <button type="button" className="nav-item-button" aria-current={activePage === page ? 'page' : undefined}
              inert={!isCollapsed && !expanded.includes(group.id)} aria-hidden={!isCollapsed && !expanded.includes(group.id) || undefined}>{pageNames[page]}</button>
          </Menu.MenuItem>)}
        </Menu.SubMenu>)}
    </Menu>
  </nav>;
  return <>
    {!narrow && <aside ref={sidebar} className="sidebar" aria-label="业务导航">{menu}</aside>}
    {narrow && mobileOpen && <NavigationDrawer onClose={onMobileClose}>{menu}<div className="mobile-nav-note">{navigationGroups.reduce((total, group) => total + group.pages.length, 0)} 个业务与配置页面 · 本地示例数据</div></NavigationDrawer>}
  </>;
}
