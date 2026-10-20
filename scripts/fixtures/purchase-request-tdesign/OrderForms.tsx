import { useState, type ReactNode } from 'react';
import { Alert, Button, Checkbox, DatePicker, Input, InputNumber, Radio, Select, Textarea } from 'tdesign-react';
import { AddIcon, DeleteIcon } from 'tdesign-icons-react';
import { PreviewForm } from './PreviewForm';
import { createAfterSale, createDirectReshipment, deleteReshipment, followAfterSale, orderGroups, orderShops, saveParcels, today, transitStates, updateDaily, type AfterSale, type DailyLine, type Goods, type OrderDraft, type OrderState, type Parcel, type Reshipment } from './order-data';

type FormProps = { state: OrderState; onClose: () => void; onSave: (state: OrderState) => void };
export const options = (values: readonly string[]) => values.map(value => ({ value, label: value }));
const newItem = (): Goods => ({ id: crypto.randomUUID(), product: '', model: '', color: '', quantity: 1 });
function Field({ name, children, required = false }: { name: string; children: ReactNode; required?: boolean }) { return <label><span>{name}{required && <em> *</em>}</span>{children}</label>; }
function ErrorMessage({ value }: { value: string }) { return value ? <div id="order-form-error" role="alert" tabIndex={-1}><Alert theme="error" message={value} /></div> : null; }
function report(error: unknown, setError: (message: string) => void) { setError((error as Error).message); requestAnimationFrame(() => document.getElementById('order-form-error')?.focus()); }

function GoodsEditor({ items, change }: { items: Goods[]; change: (items: Goods[]) => void }) {
  const update = (id: string, patch: Partial<Goods>) => change(items.map(item => item.id === id ? { ...item, ...patch } : item));
  return <section className="order-goods-editor"><div className="order-section-heading"><h3>商品明细</h3><span className="secondary">{items.length} 项 · 数量按件填写</span></div>{items.map((item, index) => <div className="order-goods-row" key={item.id}>
    <Field name={`商品 ${index + 1} 品名`}><Input value={item.product} onChange={product => update(item.id, { product })} placeholder="商品名称" /></Field>
    <Field name={`商品 ${index + 1} 型号`}><Input value={item.model} onChange={model => update(item.id, { model })} placeholder="如 BX-45L" /></Field>
    <Field name={`商品 ${index + 1} 颜色`}><Input value={item.color} onChange={color => update(item.id, { color })} /></Field>
    <Field name={`商品 ${index + 1} 数量`} required><InputNumber theme="normal" value={item.quantity} onChange={value => update(item.id, { quantity: Number(value) })} /></Field>
    <Button variant="text" theme="danger" icon={<DeleteIcon />} disabled={items.length === 1} aria-label={`移除商品 ${index + 1}`} onClick={() => change(items.filter(row => row.id !== item.id))}>移除</Button>
  </div>)}<Button variant="outline" icon={<AddIcon />} onClick={() => change([...items, newItem()])}>添加商品</Button></section>;
}

export function OrderCreateForm({ state, page, onSave, onClose }: FormProps & { page: 'afterSales' | 'reshipments' }) {
  const [initial] = useState<OrderDraft>(() => ({ order: '', shop: '', group: orderGroups[0], items: [newItem()], remark: '', reason: '' }));
  const [draft, setDraft] = useState(initial), [error, setError] = useState('');
  const after = page === 'afterSales';
  const patch = (value: Partial<OrderDraft>) => setDraft({ ...draft, ...value });
  const save = () => { try { onSave(after ? createAfterSale(state, draft) : createDirectReshipment(state, draft)); } catch (error) { report(error, setError); } };
  return <PreviewForm className="operations-form" title={after ? '登记售后' : '新建补发申请'} dirty={JSON.stringify(draft) !== JSON.stringify(initial)} onClose={onClose} onSave={save} submit={after ? '确认登记' : '创建示例申请'} summary={after ? '人工登记独立问题，保留涉事商品快照' : '直接申请，创建后可维护多个包裹'}>
    <ErrorMessage value={error} /><p className="secondary">{after ? '同一订单的不同问题可以分别登记；这里不从每日发货明细读取或关联订单。' : '此入口不关联售后。如需关联，请从售后记录的「跟进」发起补发或换货。'}</p>
    <div className="form-grid"><Field name="店铺" required><Select creatable filterable options={options(orderShops)} value={draft.shop} onChange={value => patch({ shop: String(value || '') })} placeholder="选择或输入店铺" /></Field><Field name="原始订单编号" required><Input value={draft.order} onChange={order => patch({ order })} placeholder="填写平台原始订单编号" /></Field><Field name="所属小组" required><Select options={options(orderGroups)} value={draft.group} onChange={value => patch({ group: String(value) })} /></Field>{after && <Field name="问题原因" required><Select value={draft.reason} options={options(['未收到货', '物流异常', '商品破损', '质量问题', '错发/漏发', '与描述不符', '其他'])} onChange={value => patch({ reason: String(value) })} placeholder="请选择问题原因" /></Field>}</div>
    <GoodsEditor items={draft.items} change={items => patch({ items })} />
    <Field name={after ? '问题描述' : '备注'} required={after}><Textarea value={draft.remark} onChange={remark => patch({ remark })} autosize={{ minRows: 3, maxRows: 5 }} placeholder={after ? '描述问题、已知事实和待核实信息' : '填写本次申请说明'} /></Field>
  </PreviewForm>;
}

export function DailyForm({ state, ids, onClose, onSave }: FormProps & { ids: string[] }) {
  const selected = state.daily.filter(row => ids.includes(row.id)), orders = [...new Set(selected.map(row => row.order))], affected = state.daily.filter(row => orders.includes(row.order));
  const single = orders.length === 1, initialStatus = single ? selected[0].status : '';
  const [status, setStatus] = useState(initialStatus), [remark, setRemark] = useState(single ? selected[0].remark : ''), [writeRemark, setWriteRemark] = useState(single), [error, setError] = useState('');
  const save = () => { try { onSave(updateDaily(state, ids, status as DailyLine['status'], writeRemark ? remark : undefined)); } catch (error) { report(error, setError); } };
  return <PreviewForm className="operations-form" title={single ? '维护订单发货' : '批量维护发货'} dirty={status !== initialStatus || remark !== (single ? selected[0].remark : '') || writeRemark !== single} onClose={onClose} onSave={save} submit="保存示例资料" summary={`${orders.length} 个系统订单 · 将更新 ${affected.length} 条商品明细`}>
    <ErrorMessage value={error} /><Alert theme="info" message={`已选 ${selected.length} 条明细；保存会同步 ${orders.length} 个系统单号下的全部 ${affected.length} 条明细，包括当前筛选未显示的商品。`} />
    <div className="shipping-template"><span>系统单号</span><strong>{orders.join('、')}</strong></div>
    <div className="shipping-text-field"><span id="daily-status-label">发货状态 *</span><Radio.Group aria-labelledby="daily-status-label" value={status} options={options(['待发货', '已发货'])} onChange={value => setStatus(String(value))} /></div>
    {!single && <Checkbox checked={writeRemark} onChange={setWriteRemark}>同时覆盖这些订单的内部备注</Checkbox>}
    {writeRemark && <Field name="内部备注"><Textarea value={remark} onChange={setRemark} autosize={{ minRows: 3, maxRows: 5 }} placeholder="留空将清空所选订单的内部备注" /></Field>}
    <p className="secondary">仅维护发货状态与内部备注；来源订单资料保持只读。标记已发货不会生成补发申请。</p>
  </PreviewForm>;
}

export function AfterSaleForm({ state, row, action: initialAction, onClose, onSave }: FormProps & { row: AfterSale; action: 'follow' | 'close' | 'reopen' }) {
  const [action, setAction] = useState<'沟通跟进' | '补发' | '换货' | '结案' | '重新打开'>(initialAction === 'close' ? '结案' : initialAction === 'reopen' ? '重新打开' : '沟通跟进');
  const [note, setNote] = useState(''), [nextDate, setNextDate] = useState(row.nextDate), [quantities, setQuantities] = useState<Record<string, number>>(() => Object.fromEntries(row.items.map(item => [item.id, item.quantity]))), [error, setError] = useState('');
  const request = action === '补发' || action === '换货';
  const save = () => { try { onSave(followAfterSale(state, row.id, action, note, action === '结案' ? '' : nextDate, quantities)); } catch (error) { report(error, setError); } };
  return <PreviewForm className="operations-form" title={initialAction === 'follow' ? '售后跟进' : initialAction === 'close' ? '售后结案' : '重新打开售后'} dirty={!!note || nextDate !== row.nextDate || (initialAction === 'follow' && action !== '沟通跟进') || row.items.some(item => quantities[item.id] !== item.quantity)} onClose={onClose} onSave={save} submit={request ? `确认并创建${action}申请` : '确认保存'} summary={request ? '同时保存跟进和申请 · 售后保持处理中' : row.id}>
    <ErrorMessage value={error} /><div className="shipping-template"><span>{row.id} · {row.shop} · {row.order}</span><strong>{row.reason} · {row.items.map(item => item.product || item.model).join('、')}</strong></div>
    {initialAction === 'follow' && <div className="shipping-text-field"><span id="after-action-label">处理方式</span><Radio.Group aria-labelledby="after-action-label" value={action} options={options(['沟通跟进', '补发', '换货'])} onChange={value => setAction(value as typeof action)} /></div>}
    {request && <section className="order-goods-editor"><div className="order-section-heading"><h3>本次{action}商品</h3><span className="secondary">不申请的商品填 0</span></div>{row.items.map(item => <div className="order-allocation-row" key={item.id}><div><strong>{item.product || item.model || '未填写品名'}</strong><p className="secondary">{item.model} · {item.color} · 涉事 {item.quantity} 件</p></div><Field name={`${item.model || item.id} 申请数量`} required><InputNumber theme="normal" value={quantities[item.id]} onChange={value => setQuantities({ ...quantities, [item.id]: Number(value) })} /></Field></div>)}<p className="secondary">本次申请量不超过各涉事商品数量；历史申请分别保留，不作为本次累计扣减。</p></section>}
    <Field name={action === '结案' ? '结案说明' : '处理说明'} required><Textarea value={note} onChange={setNote} autosize={{ minRows: 3, maxRows: 5 }} placeholder={action === '结案' ? '说明处理结果和结案依据' : '记录本次沟通或处理依据'} /></Field>
    {action !== '结案' && <Field name="下次跟进日期"><DatePicker value={nextDate} onChange={value => setNextDate(String(value))} clearable placeholder="按需设置" /></Field>}
    {action === '结案' && <Alert theme="info" message="结案会清除下次跟进计划，保留全部历史；补发包裹的状态单独保留。" />}
  </PreviewForm>;
}

export function ParcelForm({ state, row, onClose, onSave }: FormProps & { row: Reshipment }) {
  const [parcels, setParcels] = useState<Parcel[]>(() => structuredClone(row.parcels)), [remark, setRemark] = useState(row.remark), [error, setError] = useState('');
  const patch = (id: string, value: Partial<Parcel>) => setParcels(parcels.map(parcel => parcel.id === id ? { ...parcel, ...value } : parcel));
  const remaining = row.items.reduce((sum, item) => sum + item.quantity - parcels.reduce((total, parcel) => total + (parcel.allocations[item.id] || 0), 0), 0);
  const save = () => { try { onSave(saveParcels(state, row.id, parcels, remark)); } catch (error) { report(error, setError); } };
  return <PreviewForm className="operations-form" title="维护补发发货" dirty={JSON.stringify(parcels) !== JSON.stringify(row.parcels) || remark !== row.remark} onClose={onClose} onSave={save} submit="保存示例资料" summary={`${parcels.length} 个包裹 · ${remaining >= 0 ? `待分配 ${remaining} 件` : `超分配 ${-remaining} 件`}`}>
    <ErrorMessage value={error} /><div className="shipping-template"><span>{row.id} · {row.sourceId || '直接申请'} · {row.purpose}</span><strong>{row.items.map(item => `${item.product || item.model || '未填写型号'} × ${item.quantity}`).join('；')}</strong></div>
    <p className="secondary">每个包裹单独分配商品并登记运输状态。有运单号不代表已运输；签收不会自动结案。</p>
    {parcels.map((parcel, index) => <section className="order-parcel-editor" key={parcel.id}><div className="order-section-heading"><h3>包裹 {index + 1}</h3><Button variant="text" theme="danger" icon={<DeleteIcon />} onClick={() => setParcels(parcels.filter(item => item.id !== parcel.id))}>移除包裹 {index + 1}</Button></div>
      <div className="form-grid"><Field name={`包裹 ${index + 1} 系统单号`}><Input value={parcel.order} onChange={order => patch(parcel.id, { order })} placeholder="补发 ERP 系统单号" /></Field><Field name={`包裹 ${index + 1} 发货渠道`}><Input value={parcel.channel} onChange={channel => patch(parcel.id, { channel })} /></Field><Field name={`包裹 ${index + 1} 运单号`}><Input value={parcel.tracking} onChange={tracking => patch(parcel.id, { tracking })} /></Field><Field name={`包裹 ${index + 1} 运输状态`}><Select value={parcel.status} options={options(transitStates)} onChange={value => patch(parcel.id, { status: value as Parcel['status'] })} /></Field><Field name={`包裹 ${index + 1} 补发日期`} required><DatePicker value={parcel.date} onChange={value => patch(parcel.id, { date: String(value) })} /></Field><Field name={`包裹 ${index + 1} 处理人`} required><Input value={parcel.handler} onChange={handler => patch(parcel.id, { handler })} /></Field></div>
      {row.items.map(item => <div className="order-allocation-row" key={item.id}><div><strong>{item.product || item.model || '未填写型号'}</strong><p className="secondary">{item.model} · 本次申请 {item.quantity} 件</p></div><Field name={`包裹 ${index + 1} ${item.model || item.id} 分配数量`}><InputNumber theme="normal" value={parcel.allocations[item.id] || 0} onChange={value => { const allocations = { ...parcel.allocations }; if (value === '' || Number(value) === 0) delete allocations[item.id]; else allocations[item.id] = Number(value); patch(parcel.id, { allocations }); }} /></Field></div>)}
    </section>)}
    <Button variant="outline" icon={<AddIcon />} onClick={() => setParcels([...parcels, { id: crypto.randomUUID(), order: '', channel: '', tracking: '', status: '未登记', date: today(), handler: '演示用户', allocations: {} }])}>添加包裹</Button>
    {!parcels.length && <p className="secondary">尚未建立包裹。可先保存备注，稍后再登记发货。</p>}
    <Field name="申请备注"><Textarea value={remark} onChange={setRemark} /></Field>
  </PreviewForm>;
}

export function ReshipmentDeleteForm({ state, row, onClose, onSave }: FormProps & { row: Reshipment }) {
  const [reason, setReason] = useState(''), [error, setError] = useState('');
  return <PreviewForm className="operations-form" title="删除补发申请" dirty={!!reason} onClose={onClose} submit="确认删除本地示例" onSave={() => { try { onSave(deleteReshipment(state, row.id, reason)); } catch (error) { report(error, setError); } }}>
    <ErrorMessage value={error} /><Alert theme="warning" message={`${row.id} 将从当前列表和售后当前进度移除。保留历史记录，不取消外部订单或运输。`} /><Field name="删除原因" required><Textarea value={reason} onChange={setReason} placeholder="填写删除依据" /></Field>
  </PreviewForm>;
}
