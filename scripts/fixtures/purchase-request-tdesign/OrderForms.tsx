import { useState, type ReactNode } from 'react';
import { Alert, Button, DatePicker, Input, InputNumber, PrimaryTable, Radio, Select, Tag, Textarea, Timeline, type PrimaryTableCol } from 'tdesign-react';
import { AddIcon, DeleteIcon } from 'tdesign-icons-react';
import { PreviewForm } from './PreviewForm';
import { AfterSaleImages } from './AfterSaleImages';
import { afterSaleHandlingEvents, afterSaleToday, createAfterSale, createDirectReshipment, deleteReshipment, followAfterSale, orderGroups, orderShops, plannedFollowUpDate, saveParcels, today, transitStates, type AfterSale, type Goods, type OrderDraft, type OrderState, type Parcel, type Reshipment } from './order-data';

type FormProps = { state: OrderState; onClose: () => void; onSave: (state: OrderState) => void };
export const options = (values: readonly string[]) => values.map(value => ({ value, label: value }));
const newItem = (): Goods => ({ id: crypto.randomUUID(), product: '', model: '', color: '', quantity: 1 });
function Field({ name, children, required = false }: { name: string; children: ReactNode; required?: boolean }) { return <label><span>{name}{required && <em> *</em>}</span>{children}</label>; }
function ErrorMessage({ value }: { value: string }) { return value ? <div id="order-form-error" role="alert" tabIndex={-1}><Alert theme="error" message={value} /></div> : null; }
function report(error: unknown, setError: (message: string) => void) { setError((error as Error).message); requestAnimationFrame(() => document.getElementById('order-form-error')?.focus()); }

function GoodsEditor({ items, change, reshipment = false }: { items: Goods[]; change: (items: Goods[]) => void; reshipment?: boolean }) {
  const update = (id: string, patch: Partial<Goods>) => change(items.map(item => item.id === id ? { ...item, ...patch } : item));
  return <section className="order-goods-editor"><div className="order-section-heading"><h3>商品明细</h3><span className="secondary">{items.length} 项 · 数量按件填写</span></div>{items.map((item, index) => <div className={`order-goods-row${reshipment ? ' reshipment-goods-row' : ''}`} key={item.id}>
    {!reshipment && <Field name={`商品 ${index + 1} 品名`}><Input value={item.product} onChange={product => update(item.id, { product })} placeholder="商品名称" /></Field>}
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
    <ErrorMessage value={error} /><p className="secondary">{after ? '同一订单的不同问题可以分别登记；这里不从每日发货明细读取或关联订单。' : '直接填写店铺与原始订单；创建人和创建日期在保存时记录。关联售后的申请请从售后「跟进」发起。'}</p>
    <div className="form-grid"><Field name="店铺" required>{after ? <Select creatable filterable options={options(orderShops)} value={draft.shop} onChange={value => patch({ shop: String(value || '') })} placeholder="选择或输入店铺" /> : <Input value={draft.shop} onChange={shop => patch({ shop })} placeholder="填写店铺名" />}</Field><Field name="原始订单编号" required><Input value={draft.order} onChange={order => patch({ order })} placeholder="填写平台原始订单编号" /></Field><Field name="所属小组" required><Select options={options(orderGroups)} value={draft.group} onChange={value => patch({ group: String(value) })} /></Field>{after && <Field name="问题原因" required><Select value={draft.reason} options={options(['未收到货', '物流异常', '商品破损', '质量问题', '错发/漏发', '与描述不符', '其他'])} onChange={value => patch({ reason: String(value) })} placeholder="请选择问题原因" /></Field>}</div>
    <GoodsEditor items={draft.items} change={items => patch({ items })} reshipment={!after} />
    <Field name={after ? '问题描述' : '备注'} required={after}><Textarea value={draft.remark} onChange={remark => patch({ remark })} autosize={{ minRows: 3, maxRows: 5 }} placeholder={after ? '描述问题、已知事实和待核实信息' : '填写本次申请说明'} /></Field>
    {after && <AfterSaleImages />}
  </PreviewForm>;
}

export function AfterSaleForm({ state, row, action: initialAction, onClose, onSave }: FormProps & { row: AfterSale; action: 'follow' | 'close' | 'reopen' }) {
  const [action, setAction] = useState<'沟通跟进' | '补发' | '换货' | '结案' | '重新打开'>(initialAction === 'close' ? '结案' : initialAction === 'reopen' ? '重新打开' : '沟通跟进');
  const [note, setNote] = useState(''), [planDays, setPlanDays] = useState<number | ''>(''), [requestItems, setRequestItems] = useState<Goods[]>(() => structuredClone(row.items)), [error, setError] = useState('');
  const request = action === '补发' || action === '换货';
  const history = afterSaleHandlingEvents(row), nextDate = plannedFollowUpDate(planDays);
  const updateRequestItem = (id: string, patch: Partial<Pick<Goods, 'model' | 'color' | 'quantity'>>) => { setRequestItems(items => items.map(item => item.id === id ? { ...item, ...patch } : item)); setError(''); };
  const requestColumns: PrimaryTableCol<Goods>[] = [
    { colKey: 'product', title: '售后商品', width: 160, cell: ({ row: item }) => <span>{item.product || row.items.find(source => source.id === item.id)?.model || '未填写品名'}</span> },
    { colKey: 'model', title: '型号', width: 166, cell: ({ row: item }) => <label><span className="sr-only">{action}型号 {item.id}</span><Input value={item.model} placeholder="填写型号" onChange={model => updateRequestItem(item.id, { model })} /></label> },
    { colKey: 'color', title: '颜色', width: 112, cell: ({ row: item }) => <label><span className="sr-only">{action}颜色 {item.id}</span><Input value={item.color} placeholder="填写颜色" onChange={color => updateRequestItem(item.id, { color })} /></label> },
    { colKey: 'quantity', title: '数量', width: 96, cell: ({ row: item }) => <label><span className="sr-only">{action}数量 {item.id}</span><InputNumber theme="normal" value={item.quantity} onChange={value => updateRequestItem(item.id, { quantity: Number(value) })} /></label> },
    { colKey: 'actions', title: '操作', width: 64, cell: ({ row: item }) => <Button type="button" variant="text" theme="primary" aria-label={`移除${action}商品 ${item.id}`} onClick={() => {
      setRequestItems(items => items.filter(current => current.id !== item.id)); setError('');
      requestAnimationFrame(() => (document.querySelector<HTMLInputElement>('.after-sale-request-items input') ?? document.getElementById('after-sale-restore-items'))?.focus());
    }}>移除</Button> },
  ];
  const save = () => { try {
    if (!note.trim()) throw new Error(action === '结案' ? '请填写结案说明' : '请填写本次处理说明');
    const planned = action === '结案' ? '' : plannedFollowUpDate(planDays);
    if (action !== '结案' && !planned) throw new Error('请填写有效的计划天数，须为大于 0 的自然日整数');
    onSave(followAfterSale(state, row.id, action, note, planned, Object.fromEntries(requestItems.map(item => [item.id, item.quantity])), Object.fromEntries(requestItems.map(item => [item.id, { model: item.model, color: item.color }]))));
  } catch (error) { report(error, setError); } };
  return <PreviewForm className="operations-form after-sale-followup" width={1120} title={initialAction === 'follow' ? '售后跟进' : initialAction === 'close' ? '售后结案' : '重新打开售后'} dirty={!!note || planDays !== '' || (initialAction === 'follow' && action !== '沟通跟进') || JSON.stringify(requestItems) !== JSON.stringify(row.items)} onClose={onClose} onSave={save} submit={request ? `保存并创建${action}申请` : initialAction === 'close' ? '确认结案' : '保存跟进'} summary={request ? '同时保存跟进和申请 · 售后保持处理中' : '仅保存本地示例，图片为样式预览'}>
    <ErrorMessage value={error} />
    <div className="after-sale-followup-summary"><div><strong>{row.order}</strong><Tag variant="light" theme={row.status === '已结案' ? 'success' : row.status === '处理中' ? 'primary' : 'warning'}>{row.status}</Tag><span>{row.shop}</span></div><p><span>{row.id}</span>{row.reason} · {row.items.map(item => `${item.product || item.model} × ${item.quantity}`).join('、')}</p></div>
    <div className="after-sale-followup-layout">
      <section className="after-sale-followup-history" aria-label="历史跟进" tabIndex={0}>
        <div className="order-section-heading"><h3>历史跟进</h3><span className="secondary">{history.length} 条 · 最新在上</span></div>
        {history.length ? <Timeline theme="dot">{history.map((item, index) => <Timeline.Item key={`${item.time}-${index}`} dotColor={index === 0 ? 'primary' : 'default'}><div className="timeline-event"><strong>{item.label}</strong><span className="timeline-operator">{item.operator}</span><time dateTime={item.time.replace(' ', 'T')}>{item.time}</time><p>{item.comment}</p></div></Timeline.Item>)}</Timeline> : <p className="secondary">尚无跟进记录，保存本次处理后在此展示。</p>}
        <div className="after-sale-original-note"><h3>登记时的问题</h3><p>{row.description}</p><span className="secondary">{row.date} · {row.timeline[0]?.operator}</span></div>
      </section>
      <section className="after-sale-followup-editor" aria-label="本次处理">
        <h3>{action === '结案' ? '结案处理' : '本次处理'}</h3>
        <Field name={action === '结案' ? '结案说明' : '本次处理说明'} required><Textarea value={note} onChange={value => { setNote(value); setError(''); }} autosize={{ minRows: 3, maxRows: 5 }} placeholder={action === '结案' ? '说明处理结果和结案依据' : '记录沟通内容、已核实情况及下一步安排'} /></Field>
        <AfterSaleImages label="本次处理图片" />
        {initialAction === 'follow' && <div className="shipping-text-field"><span id="after-action-label">处理方式</span><Radio.Group theme="button" variant="default-filled" aria-labelledby="after-action-label" value={action} options={options(['沟通跟进', '补发', '换货'])} onChange={value => { setAction(value as typeof action); setError(''); }} /></div>}
        {request && <section className="order-goods-editor"><div className="order-section-heading"><h3>本次{action}商品</h3>{requestItems.length < row.items.length && <Button id="after-sale-restore-items" type="button" variant="text" theme="primary" onClick={() => { setRequestItems(items => [...items, ...structuredClone(row.items.filter(source => !items.some(item => item.id === source.id)))]); setError(''); }}>添加已移除商品</Button>}</div>
          <div className="after-sale-request-items" role="region" tabIndex={0} aria-label={`本次${action}商品，可横向滚动`}><PrimaryTable rowKey="id" columns={requestColumns} data={requestItems} tableLayout="fixed" size="small" bordered empty="尚未选择商品，请添加已移除商品" /></div>
          <p className="secondary">型号、颜色默认带入售后商品，可按本次申请调整；数量不超过对应涉事数量。</p>
        </section>}
        {action !== '结案' ? <section className="after-sale-plan"><div className="after-sale-plan-fields">
          <Field name="最新处理时间"><Input value={history[0]?.time || ''} readonly placeholder="尚无跟进" /></Field>
          <Field name="计划天数" required><InputNumber theme="normal" value={planDays} onChange={value => { setPlanDays(value === '' || value === undefined ? '' : Number(value)); setError(''); }} placeholder="自然日" suffix="天" /></Field>
          <Field name="下次跟进时间"><Input value={nextDate} readonly placeholder="填写天数后自动计算" /></Field>
        </div><p className="secondary" aria-live="polite">按北京时间的保存日期 + 计划天数计算，包含周末和节假日。{nextDate ? `${afterSaleToday()} + ${planDays} 天 = ${nextDate}` : ''}</p></section> : <Alert theme="info" message="结案会清除下次跟进计划，保留全部历史；补发包裹的状态单独保留。" />}
      </section>
    </div>
  </PreviewForm>;
}

export function ParcelForm({ state, row, onClose, onSave }: FormProps & { row: Reshipment }) {
  const [parcels, setParcels] = useState<Parcel[]>(() => structuredClone(row.parcels)), [remark, setRemark] = useState(row.remark), [error, setError] = useState('');
  const patch = (id: string, value: Partial<Parcel>) => setParcels(parcels.map(parcel => parcel.id === id ? { ...parcel, ...value } : parcel));
  const balances = row.items.map(item => item.quantity - parcels.reduce((total, parcel) => total + (parcel.allocations[item.id] || 0), 0));
  const remaining = balances.reduce((sum, value) => sum + Math.max(0, value), 0), excess = balances.reduce((sum, value) => sum + Math.max(0, -value), 0);
  const save = () => { try { onSave(saveParcels(state, row.id, parcels, remark)); } catch (error) { report(error, setError); } };
  return <PreviewForm className="operations-form" title="维护补发发货" dirty={JSON.stringify(parcels) !== JSON.stringify(row.parcels) || remark !== row.remark} onClose={onClose} onSave={save} submit="保存示例资料" summary={`${parcels.length} 个包裹 · 待分配 ${remaining} 件${excess ? ` · 超分配 ${excess} 件` : ''}`}>
    <ErrorMessage value={error} /><div className="shipping-template"><span>{row.id} · {row.sourceId || '直接申请'} · {row.purpose}</span><strong>{row.items.map(item => `${item.model || '型号未填写'} · ${item.color || '颜色未填写'} × ${item.quantity}`).join('；')}</strong></div>
    <p className="secondary">每个包裹单独分配商品并登记运输状态。有运单号不代表已运输；签收不会自动结案。</p>
    {parcels.map((parcel, index) => <section className="order-parcel-editor" key={parcel.id}><div className="order-section-heading"><h3>包裹 {index + 1}</h3><Button variant="text" theme="danger" icon={<DeleteIcon />} onClick={() => setParcels(parcels.filter(item => item.id !== parcel.id))}>移除包裹 {index + 1}</Button></div>
      <div className="form-grid"><Field name={`包裹 ${index + 1} 补发系统单号`}><Input value={parcel.order} onChange={order => patch(parcel.id, { order })} placeholder="外部系统创建的补发订单号" /></Field><Field name={`包裹 ${index + 1} 发货渠道`}><Input value={parcel.channel} onChange={channel => patch(parcel.id, { channel })} /></Field><Field name={`包裹 ${index + 1} 运单号`}><Input value={parcel.tracking} onChange={tracking => patch(parcel.id, { tracking })} /></Field><Field name={`包裹 ${index + 1} 运输状态`}><Select value={parcel.status} options={options(transitStates)} onChange={value => patch(parcel.id, { status: value as Parcel['status'] })} /></Field><Field name={`包裹 ${index + 1} 补发日期`} required><DatePicker value={parcel.date} onChange={value => patch(parcel.id, { date: String(value) })} /></Field><Field name={`包裹 ${index + 1} 处理人`} required><Input value={parcel.handler} onChange={handler => patch(parcel.id, { handler })} /></Field></div>
      {row.items.map(item => <div className="order-allocation-row" key={item.id}><div><strong>{item.model || '型号未填写'}</strong><p className="secondary">{item.color || '颜色未填写'} · 本次申请 {item.quantity} 件</p></div><Field name={`包裹 ${index + 1} ${item.model || item.id} 分配数量`}><InputNumber theme="normal" value={parcel.allocations[item.id] || 0} onChange={value => { const allocations = { ...parcel.allocations }; if (value === '' || Number(value) === 0) delete allocations[item.id]; else allocations[item.id] = Number(value); patch(parcel.id, { allocations }); }} /></Field></div>)}
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
