import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Checkbox, Input, InputNumber, Radio, Select, Textarea } from 'tdesign-react';
import { PreviewForm } from './PreviewForm';
import { demoInput, forkVersion, generateSample, makeDefaultTemplate, mappingColumns, reviewVersion, sampleFields, saveCarrier, saveMapping, saveTemplate, saveWarehouse, setVersionStatus, type Carrier, type Draft, type LogisticsArchiveState, type Mapping, type SampleField, type Status, type Template, type TemplateVersion, type Warehouse } from './logistics-archive-data';

const options = (values: string[]) => values.map(value => ({ label: value, value }));
function Field({ label, children, wide = false, required = false, group = false }: { label: string; children: ReactNode; wide?: boolean; required?: boolean; group?: boolean }) { const title = <span>{label}{required && <em> *</em>}</span>; return group ? <div className={`catalog-field${wide ? ' full-field' : ''}`} role="group" aria-label={label}>{title}{children}</div> : <label className={wide ? 'full-field' : undefined}>{title}{children}</label>; }
function StatusInput({ value, onChange }: { value: Status; onChange: (value: Status) => void }) { return <Radio.Group value={value} options={options(['启用', '停用'])} onChange={value => onChange(value as Status)} />; }
function ErrorMessage({ error }: { error: string }) { return error ? <div id="archive-error" role="alert" tabIndex={-1} className="shipping-form-error"><Alert theme="error" message={error} /></div> : null; }
function useSave(onSave: (state: LogisticsArchiveState) => void, draft: object) { const [error, setError] = useState(''); useEffect(() => setError(''), [draft]); return { error, submit: (action: () => LogisticsArchiveState) => { try { onSave(action()); } catch (cause) { setError((cause as Error).message); requestAnimationFrame(() => document.getElementById('archive-error')?.focus()); } } }; }
type Props<T> = { state: LogisticsArchiveState; row?: T; onClose: () => void; onSave: (state: LogisticsArchiveState) => void };

export function WarehouseForm({ state, row, onClose, onSave }: Props<Warehouse>) {
  const [form, setForm] = useState<Draft<Warehouse>>(row || { name: '', site: 'US', purpose: 'FBA', region: '', address: '', order: 100, status: '启用', remark: '' }), [initial] = useState(JSON.stringify(form)), { error, submit } = useSave(onSave, form);
  const set = (key: keyof Draft<Warehouse>, value: string | number) => setForm({ ...form, [key]: value });
  return <PreviewForm title={row ? '编辑海外仓' : '新建海外仓'} dirty={initial !== JSON.stringify(form)} onClose={onClose} onSave={() => submit(() => saveWarehouse(state, form, row?.id))} submit="保存海外仓" className="catalog-form">
    <section className="catalog-form-section"><h3>仓库资料</h3><div className="form-grid">
      <Field label="仓库名称" required wide><Input value={form.name} disabled={!!row} onChange={value => set('name', value)} /></Field>
      <Field label="站点" required><Select value={form.site} disabled={!!row} options={options(['US', 'CA'])} onChange={value => set('site', String(value))} /></Field>
      <Field label="用途" required><Select value={form.purpose} options={options(['FBA', 'FBM', 'eBay', 'Canada', 'Other'])} onChange={value => set('purpose', String(value))} /></Field>
      {row && <p className="secondary full-field">编辑保留仓名与站点。不同仓库请新建档案，避免混淆已有引用。</p>}
      <Field label="所在地区" wide><Input value={form.region} onChange={value => set('region', value)} placeholder="例如：美国 · 加州" /></Field>
      <Field label="仓库地址" wide><Textarea value={form.address} onChange={value => set('address', value)} autosize={{ minRows: 2, maxRows: 4 }} /></Field>
    </div></section>
    <section className="catalog-form-section"><h3>选用规则</h3><div className="form-grid"><Field label="排序" required><InputNumber value={form.order} min={1} max={999999} decimalPlaces={0} onChange={value => set('order', Number(value))} /></Field><Field group label="状态"><StatusInput value={form.status} onChange={value => set('status', value)} /></Field><p className="secondary full-field">同站点、同用途的启用仓库按排序从小到大选用；相同排序保留建立顺序。停用后不再自动选用。</p><Field label="备注" wide><Textarea value={form.remark} onChange={value => set('remark', value)} autosize={{ minRows: 2, maxRows: 4 }} /></Field></div></section><ErrorMessage error={error} />
  </PreviewForm>;
}

export function CarrierForm({ state, row, onClose, onSave }: Props<Carrier>) {
  const [form, setForm] = useState<Draft<Carrier>>(row || { name: '', code: '', contact: '', phone: '', order: 100, status: '启用', remark: '', defaultTemplateId: '' }), [initial] = useState(JSON.stringify(form)), { error, submit } = useSave(onSave, form);
  const set = (key: keyof Draft<Carrier>, value: string | number) => setForm({ ...form, [key]: value });
  return <PreviewForm title={row ? '编辑物流商' : '新建物流商'} dirty={initial !== JSON.stringify(form)} onClose={onClose} onSave={() => submit(() => saveCarrier(state, form, row?.id))} submit="保存物流商" className="catalog-form">
    <section className="catalog-form-section"><h3>合作资料</h3><div className="form-grid"><Field label="物流商完整名称" required wide><Input value={form.name} onChange={value => set('name', value)} /></Field>{([['code', '物流商编码'], ['contact', '联系人'], ['phone', '联系方式']] as const).map(([key, label]) => <Field key={key} label={label}><Input value={form[key]} onChange={value => set(key, value)} /></Field>)}<Field label="排序" required><InputNumber value={form.order} min={1} max={999999} decimalPlaces={0} onChange={value => set('order', Number(value))} /></Field><Field group label="合作状态" wide><StatusInput value={form.status} onChange={value => set('status', value)} /></Field><Field label="备注" wide><Textarea value={form.remark} onChange={value => set('remark', value)} autosize={{ minRows: 2, maxRows: 4 }} /></Field></div></section>
    {form.status === '停用' && <Alert theme="warning" message="停用后不能用于新的物流下单，也可能阻止已有单据重新生成文件。档案与模板保留。" />}<ErrorMessage error={error} />
  </PreviewForm>;
}

export function TemplateForm({ state, row, carrierId, onClose, onSave }: Props<Template> & { carrierId: string }) {
  const [form, setForm] = useState<Draft<Template>>(row || { carrierId, name: '', transport: '普通海运', status: '启用', defaultVersionId: '' }), [initial] = useState(JSON.stringify(form)), { error, submit } = useSave(onSave, form);
  return <PreviewForm title={row ? '编辑模板系列' : '新建示例模板'} dirty={initial !== JSON.stringify(form)} onClose={onClose} onSave={() => submit(() => saveTemplate(state, form, row?.id))} submit="保存模板系列" className="catalog-form">
    <div className="shipping-template"><span>所属物流商</span><strong>{state.carriers.find(item => item.id === carrierId)?.name}</strong></div><section className="catalog-form-section"><div className="form-grid"><Field label="模板名称" required wide><Input value={form.name} onChange={name => setForm({ ...form, name })} /></Field><Field label="运输方式" required><Input value={form.transport} onChange={transport => setForm({ ...form, transport })} /></Field><Field group label="系列状态"><StatusInput value={form.status} onChange={status => setForm({ ...form, status })} /></Field></div></section>
    {!row && <Alert theme="info" message="使用内置五列表结构创建未启用的 V1。保存后完成字段映射、生成演示样例并核对，再启用该版本。本样板不上传或解析 Excel。" />}{row && form.status === '停用' && <Alert theme="warning" message="停用整个系列会使其所有版本无法用于生成下单文件；默认指向保留，不会自动替换。" />}<ErrorMessage error={error} />
  </PreviewForm>;
}

export type VersionAction = 'mapping' | 'sample' | 'review' | 'fork' | 'status';
export function VersionForm({ state, row, mode, onClose, onSave }: Props<TemplateVersion> & { row: TemplateVersion; mode: VersionAction }) {
  const [mapping, setMapping] = useState<Mapping>({ ...row.mapping }), [input, setInput] = useState(row.sample?.input || demoInput()), [approve, setApprove] = useState(true), [checked, setChecked] = useState(false), [reason, setReason] = useState(''), [active, setActive] = useState(row.status !== '启用'), [makeDefault, setMakeDefault] = useState(false);
  const [draft, setDraft] = useState({}), { error, submit } = useSave(onSave, draft);
  const template = state.templates.find(item => item.id === row.templateId)!, titles = { mapping: '配置字段映射', sample: '生成演示样例', review: '核对演示样例', fork: '复制为新版本', status: '修改版本状态' };
  const dirty = mode === 'mapping' ? JSON.stringify(mapping) !== JSON.stringify(row.mapping) : mode === 'sample' ? JSON.stringify(input) !== JSON.stringify(row.sample?.input || demoInput()) : mode === 'review' ? checked || !!reason || !approve : false;
  const run = () => mode === 'mapping' ? saveMapping(state, row.id, mapping) : mode === 'sample' ? generateSample(state, row.id, input) : mode === 'review' ? reviewVersion(state, row.id, row.sample?.id || '', approve, checked, reason) : mode === 'fork' ? forkVersion(state, row.id) : setVersionStatus(state, row.id, active, makeDefault);
  return <PreviewForm title={titles[mode]} dirty={dirty} onClose={onClose} onSave={() => submit(run)} submit={mode === 'mapping' ? '保存映射' : mode === 'sample' ? '生成样例' : mode === 'review' ? approve ? '核对通过并启用' : '退回适配' : mode === 'fork' ? '创建新版本' : '保存版本状态'} className="catalog-form">
    <div className="shipping-template"><span>{template.id} · V{row.revision} · {row.id}</span><strong>{template.name}</strong></div>
    <section className="catalog-form-section" onChange={() => setDraft({})}>
      {mode === 'mapping' && <><p className="secondary">内置演示表结构 · 每列选一个不同的来源字段。保存后旧样例失效，需要重新生成。</p><div className="archive-mapping">{mappingColumns.map((column, index) => <label key={column}><span><small>{String.fromCharCode(65 + index)} 列</small>{column}</span><Select value={mapping[column]} placeholder="选择来源字段" options={Object.entries(sampleFields).map(([value, label]) => ({ label, value }))} onChange={value => { setMapping({ ...mapping, [column]: String(value) as SampleField }); setDraft({}); }} /></label>)}</div></>}
      {mode === 'sample' && <><p className="secondary">以下为演示输入，生成结果按当前映射填入五列；不读取业务单据，也不生成 Excel 文件。</p><div className="form-grid"><Field label="演示参考单号" required><Input value={input.reference} onChange={reference => setInput({ ...input, reference })} /></Field><Field label="演示品名" required><Input value={input.product} onChange={product => setInput({ ...input, product })} /></Field><Field label="总件数" required><InputNumber value={input.quantity} min={1} decimalPlaces={0} onChange={value => setInput({ ...input, quantity: Number(value) })} /></Field><Field label="总箱数" required><InputNumber value={input.cartons} min={1} decimalPlaces={0} onChange={value => setInput({ ...input, cartons: Number(value) })} /></Field><Field label="目的国家" required><Select value={input.country} options={options(['US', 'CA'])} onChange={value => { setInput({ ...input, country: String(value) }); setDraft({}); }} /></Field></div></>}
      {mode === 'review' && <><p>当前样例 <strong className="numeric">{row.sample?.id}</strong></p><SampleCells row={row} /><p className="secondary">通过后启用 V{row.revision} 并设为系列默认版本；已有单据不改绑。未设置默认模板的物流商将使用本系列。</p><div className="form-grid"><Field group label="核对结果" wide><Radio.Group value={approve ? 'pass' : 'reject'} options={[{ label: '通过并启用', value: 'pass' }, { label: '退回适配', value: 'reject' }]} onChange={value => { setApprove(value === 'pass'); setDraft({}); }} /></Field>{approve && <Field group label="确认核对" wide><Checkbox checked={checked} onChange={value => setChecked(value)}>已逐列核对当前演示样例与来源数据一致</Checkbox></Field>}<Field label={approve ? '核对备注' : '退回原因'} required={!approve} wide><Textarea value={reason} onChange={setReason} autosize={{ minRows: 2, maxRows: 4 }} /></Field></div></>}
      {mode === 'fork' && <p>从 V{row.revision} 复制字段映射，建立待核对的新版本。原默认版本继续可用；新版本需要重新生成样例并核对。</p>}
      {mode === 'status' && <div className="form-grid"><Field group label="版本状态" wide><Radio.Group value={active ? '启用' : '停用'} options={options(['启用', '停用'])} onChange={value => { setActive(value === '启用'); setMakeDefault(false); setDraft({}); }} /></Field>{active && <Field group label="默认版本" wide><Checkbox checked={makeDefault} onChange={setMakeDefault}>同时设为本系列默认版本</Checkbox></Field>}<div className="full-field"><Alert theme={active ? 'info' : 'warning'} message={active ? '只恢复当前版本；未勾选时保留原默认指向。已有单据不会改绑。' : '停用后可能阻止已有单据重新生成文件。默认指向保留，不会自动切换到其他版本。'} /></div></div>}
    </section><ErrorMessage error={error} />
  </PreviewForm>;
}

export function SampleCells({ row }: { row: TemplateVersion }) { return <div className="archive-sample" role="region" tabIndex={0} aria-label="演示样例列值，可横向滚动"><table><caption>演示样例 · 按当前映射生成</caption><thead><tr>{mappingColumns.map(column => <th key={column} scope="col">{column}<small>{sampleFields[row.mapping[column] as SampleField]}</small></th>)}</tr></thead><tbody><tr>{row.sample?.cells.map((cell, i) => <td key={i}>{cell}</td>)}</tr></tbody></table></div>; }

export function DefaultTemplateForm({ state, row, onClose, onSave }: Props<Template> & { row: Template }) {
  const { error, submit } = useSave(onSave, row), carrier = state.carriers.find(item => item.id === row.carrierId)!, previous = state.templates.find(item => item.id === carrier.defaultTemplateId);
  return <PreviewForm title="切换默认模板" dirty={false} onClose={onClose} onSave={() => submit(() => makeDefaultTemplate(state, row.id))} submit="设为默认模板" className="catalog-form"><section className="catalog-form-section"><p>{carrier.name}</p><p>{previous?.name || '未设置默认模板'} → <strong>{row.name}</strong></p><p className="secondary">用于后续新建下单；已有单据继续引用原模板版本。</p></section><ErrorMessage error={error} /></PreviewForm>;
}
