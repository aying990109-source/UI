import { useState } from 'react';
import { Alert, Button, DatePicker, Empty, Input, InputNumber, PrimaryTable, Select, Textarea, type PrimaryTableCol } from 'tdesign-react';
import { PreviewForm } from './PreviewForm';
import { createEvent } from './history';
import { carrierTemplates, createDispatch, createManifests, shippingSources, totalBoxes, totalQuantity, totalVolume, warehouses, type Schedule, type ShippingState, type Source } from './shipping-data';

const options = (values: string[]) => values.map(value => ({ label: value, value }));

export function ShippingSourcePicker({ state, mode, onClose, onSave }: { state: ShippingState; mode: 'preparation' | 'dispatch'; onClose: () => void; onSave: (state: ShippingState) => void }) {
  const [picks, setPicks] = useState<Record<string, number>>({}), [warehouse, setWarehouse] = useState('');
  const [carrier, setCarrier] = useState(carrierTemplates[0].name), [reason, setReason] = useState(''), [error, setError] = useState('');
  const sources = shippingSources(state, mode), visible = sources.filter(row => !warehouse || row.warehouse === warehouse);
  const chosen = sources.filter(row => row.id in picks).map(row => ({ ...row, quantity: picks[row.id] * row.carton }));
  const template = carrierTemplates.find(row => row.name === carrier)!;
  const change = mode === 'dispatch' && chosen.some(row => row.transport !== template.transport);
  const columns: PrimaryTableCol<Source>[] = [
    { colKey: 'select', type: 'multiple', width: 44, checkProps: ({ row }) => ({ label: <span className="sr-only">选货 {row.id}</span> }) },
    { colKey: 'product', title: '采购商品 / 来源', width: 232, cell: ({ row }) => <div className="cell-stack"><strong>{row.product}</strong><span className="secondary">{mode === 'preparation' ? row.id : row.manifestId} · {row.supplier}</span></div> },
    { colKey: 'warehouse', title: '目的仓 / 计划运输', width: 160, cell: ({ row }) => <div className="cell-stack"><span>{row.warehouse}</span><span className="secondary">{row.site} · {row.transport}</span></div> },
    { colKey: 'available', title: '可用箱数', align: 'right', width: 110, cell: ({ row }) => <div className="cell-stack align-end"><span>{row.available / row.carton} 箱</span><span className="secondary">{row.carton} 件/箱</span></div> },
    { colKey: 'boxes', title: '本次选货', width: 164, cell: ({ row }) => <label><span className="sr-only">{row.id} 选货箱数</span><InputNumber value={picks[row.id] ?? undefined} disabled={!(row.id in picks)} min={1} max={row.available / row.carton} decimalPlaces={0} inputProps={{ name: `boxes-${row.id}` }} suffix="箱" onChange={value => { setPicks({ ...picks, [row.id]: Number(value) }); setError(''); }} /></label> },
  ];
  function submit() {
    try {
      const selection = Object.entries(picks).map(([id, boxes]) => ({ id, boxes }));
      onSave(mode === 'preparation' ? createManifests(state, selection) : createDispatch(state, selection, carrier, reason));
    } catch (error) { setError((error as Error).message); requestAnimationFrame(() => document.getElementById('shipping-pick-error')?.focus()); }
  }
  return <PreviewForm title={mode === 'preparation' ? '从排期选货' : '新建物流单'} dirty={!!Object.keys(picks).length || !!reason || carrier !== carrierTemplates[0].name} onClose={onClose} onSave={submit} submit={mode === 'preparation' ? '生成示例核对资料' : '创建示例物流单'} summary={`已选 ${chosen.length} 条 · ${totalQuantity(chosen)} 件 / ${totalBoxes(chosen)} 箱${mode === 'dispatch' ? ` · ${totalVolume(chosen).toFixed(3)} m³` : ''}`}>
    <p className="shipping-form-intro">{mode === 'preparation' ? '仅显示已确认排期的可用数量，按供应商生成核对资料。' : '从已确认的核对资料选货；同一目的仓，每单不超过 50 箱、30 m³。'}</p>
    <div className="picker-filters"><label><span>目的仓</span><Select value={warehouse} onChange={value => { setWarehouse(String(value || '')); setPicks({}); setError(''); }} options={options([...new Set(sources.map(row => row.warehouse))])} clearable placeholder="全部目的仓" inputProps={{ name: 'pick-warehouse' }} /></label><span className="secondary">选择来源后填写本次箱数</span></div>
    <div className="shipping-source-scroll" tabIndex={0} role="region" aria-label="可用选货来源，可横向滚动"><PrimaryTable rowKey="id" data={visible} columns={columns} size="small" tableLayout="fixed" selectedRowKeys={Object.keys(picks)} onSelectChange={keys => { setPicks(Object.fromEntries(keys.map(key => { const row = sources.find(row => row.id === key)!; return [key, picks[String(key)] ?? Math.min(row.available / row.carton, 10)]; }))); setError(''); }} empty={<Empty title="暂无可用来源" description={mode === 'preparation' ? '先确认排期，或选择其他目的仓。' : '先完成出货核对，或选择其他目的仓。'} />} /></div>
    {mode === 'dispatch' && <section className="form-section"><h3>承运资料</h3><div className="form-grid">
      <label><span>物流商 <em>*</em></span><Select value={carrier} onChange={value => { setCarrier(String(value)); setError(''); }} options={options(carrierTemplates.map(row => row.name))} inputProps={{ name: 'pick-carrier' }} /></label>
      <div className="shipping-template"><span>对应模板 / 实际运输方式</span><strong>{template.template}</strong><span>{template.transport}</span></div>
      {change && <label className="full-field"><span>运输方式变更原因 <em>*</em></span><Input value={reason} onChange={value => { setReason(value); setError(''); }} aria-label="运输方式变更原因" maxlength={300} placeholder="说明实际运输方式与排期不同的原因" /></label>}
    </div></section>}
    {error && <div id="shipping-pick-error" className="shipping-form-error" tabIndex={-1} role="alert"><Alert theme="error" message={error} /></div>}
  </PreviewForm>;
}

export function ScheduleEditor({ row, onClose, onSave }: { row: Schedule; onClose: () => void; onSave: (row: Schedule) => void }) {
  const [draft, setDraft] = useState(row), [error, setError] = useState('');
  const dirty = draft.date !== row.date || draft.warehouse !== row.warehouse || draft.transport !== row.transport || draft.pickup !== row.pickup || draft.remark !== row.remark;
  const change = (patch: Partial<Schedule>) => { setDraft({ ...draft, ...patch }); setError(''); };
  function save() {
    const issue = !draft.date ? ['schedule-date', '请选择计划出货日期'] : !draft.warehouse ? ['schedule-warehouse', '请选择目的仓'] : !draft.pickup.trim() ? ['schedule-pickup', '请填写提货仓'] : null;
    if (issue) { setError(issue[1]); requestAnimationFrame(() => document.getElementById(issue[0])?.focus()); return; }
    const fields = { date: '计划出货日期', warehouse: '目的仓', transport: '排期运输方式', pickup: '提货仓', remark: '备注' } as const;
    const changes = (Object.keys(fields) as (keyof typeof fields)[]).filter(key => draft[key] !== row[key]).map(key => `${fields[key]}：${row[key] || '未填写'} → ${draft[key] || '未填写'}`);
    onSave({ ...draft, timeline: dirty ? [...row.timeline, createEvent('修改排期', '演示用户', changes.join('\n'))] : row.timeline });
  }
  return <PreviewForm title="编辑出货排期" dirty={dirty} onClose={onClose} onSave={save} submit="保存排期">
    <div className="editor-product"><strong>{row.product}</strong><span className="secondary">{row.id} · {row.quantity} 件 / {row.quantity / row.carton} 箱 · {row.site}</span></div>
    <section className="form-section"><h3>出货安排</h3><div className="form-grid">
      <label htmlFor="schedule-date"><span>计划出货日期 <em>*</em></span><DatePicker value={draft.date} onChange={value => change({ date: String(value) })} inputProps={{ name: 'schedule-date' }} clearable /></label>
      <label htmlFor="schedule-warehouse"><span>目的仓 <em>*</em></span><Select value={draft.warehouse} onChange={value => change({ warehouse: String(value || '') })} options={options(warehouses.filter(name => row.site === 'CA' ? name === '多伦多仓' : name !== '多伦多仓'))} inputProps={{ name: 'schedule-warehouse' }} clearable placeholder="请选择目的仓" /></label>
      <label htmlFor="schedule-transport"><span>排期运输方式</span><Select value={draft.transport} onChange={value => change({ transport: String(value) })} options={options(['普通海运', '快船', '空运'])} inputProps={{ name: 'schedule-transport' }} /></label>
      <label htmlFor="schedule-pickup"><span>提货仓 <em>*</em></span><Input value={draft.pickup} onChange={value => change({ pickup: value })} name="schedule-pickup" maxlength={100} /></label>
      <label className="full-field"><span>出货备注</span><Textarea value={draft.remark} onChange={value => change({ remark: value })} aria-label="出货备注" maxlength={1000} autosize={{ minRows: 3, maxRows: 5 }} /></label>
    </div></section>{error && <div role="alert"><Alert theme="error" message={error} /></div>}
  </PreviewForm>;
}

export function LogisticsEditor({ title, label, initial, onClose, onSave, multiline = false }: { title: string; label: string; initial: string; onClose: () => void; onSave: (value: string) => void; multiline?: boolean }) {
  const [value, setValue] = useState(initial), [error, setError] = useState('');
  function submit() { try { if (!value.trim()) throw new Error(`请填写${label}`); onSave(value); } catch (error) { setError((error as Error).message); requestAnimationFrame(() => document.querySelector<HTMLElement>('.shipping-text-field input, .shipping-text-field textarea')?.focus()); } }
  return <PreviewForm title={title} dirty={value !== initial} onClose={onClose} onSave={submit} submit="保存示例">
    <label className="shipping-text-field"><span>{label} <em>*</em></span>{multiline ? <Textarea aria-label={label} value={value} onChange={value => { setValue(value); setError(''); }} maxlength={4000} autosize={{ minRows: 6, maxRows: 12 }} /> : <Input aria-label={label} value={value} onChange={value => { setValue(value); setError(''); }} maxlength={100} />}</label>
    {multiline && <p className="secondary">保存原始反馈并保留当前物流阶段；此样板不执行自动识别或实物上架。</p>}
    {error && <div role="alert"><Alert theme="error" message={error} /></div>}
  </PreviewForm>;
}

