import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { Button, Tag } from 'tdesign-react';
import { FileIcon } from 'tdesign-icons-react';
import { DetailDrawer } from './DetailDrawer';
import { stageTheme, type RequestRow } from './data';

export type PurchaseRequestDetailsHandle = { open: (row: RequestRow) => void };
const empty = { row: null as RequestRow | null, visible: false };
const number = (value: number) => value.toLocaleString('zh-CN');

export function PurchaseRequestDetails({ ref, onApprove, onReject, busyKeys, errors, rejectionOpen }: {
  ref: Ref<PurchaseRequestDetailsHandle>; onApprove: (row: RequestRow) => void; onReject: (row: RequestRow) => void;
  busyKeys: string[]; errors: Record<string, string>; rejectionOpen: boolean;
}) {
  const [state, setState] = useState(empty);
  const hadRejection = useRef(false);
  const detail = state.row;
  const error = detail ? errors[detail.id] : '';
  const busy = detail ? busyKeys.some(key => key.endsWith(`:${detail.id}`)) : false;
  useEffect(() => {
    if (rejectionOpen) { hadRejection.current = true; return; }
    if (!state.visible) { hadRejection.current = false; return; }
    if (!hadRejection.current) return;
    hadRejection.current = false;
    const id = window.setTimeout(() => document.querySelector<HTMLElement>('.detail-drawer .purchase-detail-footer .t-button--theme-danger')?.focus(), 240);
    return () => clearTimeout(id);
  }, [rejectionOpen, state.visible]);
  useImperativeHandle(ref, () => ({ open: row => setState({ row, visible: true }) }), []);
  const close = () => setState(previous => previous.visible ? { ...previous, visible: false } : previous);
  return <DetailDrawer title="采购申请详情" timeline={detail?.timeline ?? []} visible={state.visible} overlayOpen={rejectionOpen} size="1080px" className="purchase-detail-drawer"
    footer={<div className="purchase-detail-footer"><Button variant="outline" onClick={close}>关闭</Button>{detail?.awaitingMyApproval && <div><Button variant="outline" theme="danger" disabled={busy} onClick={() => onReject(detail)}>驳回</Button><Button theme="primary" loading={busyKeys.includes(`approve:${detail.id}`)} disabled={busy} onClick={() => onApprove(detail)}>{error ? '重试通过' : '通过'}</Button></div>}</div>}
    onClose={close}
    onClosed={() => setState(previous => previous === state ? empty : previous)}>
    {detail && <div className="detail-content purchase-detail-content"><div className="detail-title purchase-detail-title"><FileIcon /><div><h2>{detail.id}</h2><span className="secondary">{detail.date} 提交</span></div><Tag theme={stageTheme[detail.status]} variant="light">{detail.status}</Tag></div>{error && <p className="purchase-action-error" role="alert">{error}</p>}
      <section className="purchase-detail-section"><h3>采购商品</h3><div className="purchase-product-strip"><strong>{detail.product}</strong><div className="purchase-product-quantity"><span>当前采购量</span><strong className="numeric">{number(detail.quantity)} <small>件</small></strong></div></div>
        <dl className="purchase-fields">{([['参考装箱数', detail.carton ? `${detail.carton} 件/箱` : '待采购确认'], ['采购类型', detail.purchaseType], ['站点 / 备货类型', `${detail.site} / ${detail.stockingType}`], ['货物路径', detail.stockPath], ['运输方式', detail.transport]]).map(([label, value]) => <div className="purchase-field" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      </section>
      <section className="purchase-detail-section"><h3>申请信息</h3><dl className="purchase-fields">{([['申请人', detail.applicant], ['所属小组', detail.group], ['备注', detail.remark || '—']]).map(([label, value]) => <div className={`purchase-field${label === '备注' ? ' purchase-field-wide' : ''}`} key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
      <section className="purchase-detail-section"><h3>直发入仓</h3><dl className="purchase-fields">{([['ERP 店铺', detail.shop], ['ASIN', detail.asin], ['FNSKU', detail.fnsku], ['MSKU', detail.msku]]).map(([label, value]) => <div className="purchase-field" key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl></section>
    </div>}
  </DetailDrawer>;
}
