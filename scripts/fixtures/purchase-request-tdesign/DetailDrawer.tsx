import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Button, Drawer, Timeline, type DrawerInstance } from 'tdesign-react';
import { CloseIcon } from 'tdesign-icons-react';
import type { DetailEvent } from './history';

let lastDetailOpener: HTMLElement | null = null;
export const detailReturnFocus = () => lastDetailOpener?.isConnected ? lastDetailOpener : null;

export function DetailDrawer({ title, timeline, timelineTitle = '流程时间线', children, footer, overlayOpen = false, size = '960px', className = '', visible: controlledVisible, onClose, onClosed }: {
  title: string; timeline: DetailEvent[]; timelineTitle?: string; children: ReactNode; footer?: ReactNode; overlayOpen?: boolean; size?: string; className?: string;
  visible?: boolean; onClose: () => void; onClosed?: () => void;
}) {
  const opener = useRef<HTMLElement | null>(null);
  const content = useRef<HTMLDivElement>(null);
  const instance = useRef<DrawerInstance>(null);
  const [autoVisible, setAutoVisible] = useState(false);
  const visible = controlledVisible ?? autoVisible;
  const hasContent = children !== null && children !== undefined;
  useEffect(() => { if (controlledVisible === undefined) setAutoVisible(true); }, [controlledVisible]);
  useLayoutEffect(() => {
    if (controlledVisible === undefined) return;
    // TDesign 1.x copies visible in a passive effect; its native API starts the same transition before paint.
    if (controlledVisible) instance.current?.show?.(); else instance.current?.hide?.();
  }, [controlledVisible]);
  const attachContent = useCallback((element: HTMLDivElement | null) => {
    const drawer = element?.closest('.detail-drawer') ?? content.current?.closest('.detail-drawer');
    content.current = element;
    drawer?.setAttribute('aria-hidden', String(!element));
    if (!element) return;
    drawer?.setAttribute('role', 'dialog');
    drawer?.setAttribute('aria-modal', 'true');
    drawer?.setAttribute('aria-label', title);
    drawer?.querySelectorAll<HTMLElement>('.detail-info, .detail-timeline, .detail-layout').forEach(panel => { panel.scrollTop = 0; });
  }, [title]);
  const close = () => controlledVisible === undefined ? setAutoVisible(false) : onClose();
  const finishClose = () => {
    const drawer = content.current?.closest('.detail-drawer');
    // Drawer 1.x has no onClosed callback; wait for its own transitions before unmounting.
    const animations = [...(drawer?.querySelectorAll('.t-drawer__content-wrapper, .t-drawer__mask') || [])]
      .flatMap(element => element.getAnimations());
    void Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
      if (content.current?.isConnected) (controlledVisible === undefined ? onClose : onClosed)?.();
    });
  };
  useLayoutEffect(() => {
    if (!hasContent) return;
    opener.current = document.activeElement as HTMLElement | null;
    lastDetailOpener = opener.current;
    const background = document.getElementById('root');
    if (background) background.inert = true;
    // TDesign 1.x does not contain Tab focus; use the same contract for every detail entry.
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      if (document.querySelector('.processing-dialog')) return;
      const drawer = content.current?.closest('.detail-drawer');
      const elements = [...(drawer?.querySelectorAll<HTMLElement>('.t-drawer__content-wrapper button, .t-drawer__content-wrapper a[href], .t-drawer__content-wrapper [tabindex]') || [])]
        .filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
      const first = elements[0], last = elements.at(-1);
      if (first && (!elements.includes(document.activeElement as HTMLElement) || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last))) {
        event.preventDefault(); (event.shiftKey ? last : first)?.focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => { document.removeEventListener('keydown', trap); if (background) background.inert = false; requestAnimationFrame(() => { if (!document.querySelector('.processing-dialog')) opener.current?.focus(); }); };
  }, [hasContent]);
  return <Drawer ref={instance} visible={visible} forceRender attach="body" header={title} size={size} placement="right" className={`detail-drawer ${className}`} closeOnOverlayClick={!overlayOpen} closeOnEscKeydown={!overlayOpen}
    closeBtn={<Button variant="text" shape="square" icon={<CloseIcon />} aria-label={`关闭${title}`} />}
    footer={footer ?? <Button variant="outline" onClick={close}>关闭</Button>} onClose={close} onBeforeClose={finishClose}>
    {hasContent && <div ref={attachContent} className="detail-layout">
      <section className="detail-info" aria-label="详情资料" tabIndex={0}>{children}</section>
      <section className="detail-timeline" aria-labelledby="detail-timeline-title" tabIndex={0}>
        <div className="timeline-heading"><h3 id="detail-timeline-title">{timelineTitle}</h3><span>示例记录</span></div>
        {timeline.length ? <Timeline mode="same" theme="dot">{timeline.map((event, index) => <Timeline.Item key={`${event.time}-${index}`} dotColor={event.rejected ? 'error' : index === timeline.length - 1 ? 'primary' : 'default'}>
          <div className="timeline-event"><strong>{event.label}</strong><span className="timeline-operator">{event.operator}</span><time dateTime={event.time.replace(' ', 'T')}>{event.time}</time>{event.comment && <p>{event.comment}</p>}</div>
        </Timeline.Item>)}</Timeline> : <p className="secondary">暂无处理记录</p>}
      </section>
    </div>}
  </Drawer>;
}
