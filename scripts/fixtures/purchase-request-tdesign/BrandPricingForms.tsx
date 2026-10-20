import { useState, type ReactNode } from 'react';
import { Alert, Checkbox, Input, Radio, Select, Tabs, Textarea } from 'tdesign-react';
import { PreviewForm } from './PreviewForm';
import { brandDraft, brandFields, brandSections, calculatePrice, costLabels, currency, MaintenanceError, priceDraft, pricingProducts, productFor, saveBrand, savePrice, type BrandPricingState, type DemoBrand, type DemoPrice } from './brand-pricing-data';

type Props = { state: BrandPricingState; onClose: () => void; onSave: (next: BrandPricingState) => void };
const Field = ({ label, children, wide, required }: { label: string; children: ReactNode; wide?: boolean; required?: boolean }) => <label className={wide ? 'full-field' : undefined}><span>{label}{required && <em> *</em>}</span>{children}</label>;
const ErrorMessage = ({ error }: { error: string }) => error ? <div id="maintenance-error" className="shipping-form-error" role="alert" tabIndex={-1}><Alert theme="error" message={error} /></div> : null;
const focusError = () => requestAnimationFrame(() => document.getElementById('maintenance-error')?.focus());

export function BrandForm({ state, row, onClose, onSave }: Props & { row?: DemoBrand }) {
  const [draft, setDraft] = useState(() => brandDraft(row)), [initial] = useState(JSON.stringify(draft)), [tab, setTab] = useState<string>(brandSections[0]), [error, setError] = useState('');
  const profile = (key: string, value: string) => { setDraft({ ...draft, profile: { ...draft.profile, [key]: value } }); setError(''); };
  const submit = () => { try { onSave(saveBrand(state, draft, row?.id)); } catch (cause) { if (cause instanceof MaintenanceError) setTab(brandFields.find(([key]) => key === cause.field)?.[2] || brandSections[0]); setError((cause as Error).message); focusError(); } };
  return <PreviewForm title={row ? '编辑品牌档案' : '新建品牌档案'} dirty={JSON.stringify(draft) !== initial} onClose={onClose} onSave={submit} submit="保存档案" summary="四个页签一起保存 · 授权概况只读" className="catalog-form brand-pricing-form">
    <ErrorMessage error={error} />
    <Tabs value={tab} onChange={value => setTab(String(value))}>{brandSections.map(section => <Tabs.TabPanel key={section} value={section} label={<button className="tab-label" aria-pressed={tab === section}>{section}</button>} />)}</Tabs>
    {brandSections.map(section => <section key={section} hidden={tab !== section} className="catalog-form-section">
      {section === '商标与宣誓' && <p className="secondary">按来源资料填写状态和日期；宣誓日期不自动推算。区间用 YYYY-MM-DD ~ YYYY-MM-DD，未记录可留空。</p>}
      {section === '来源数量快照' && <p className="secondary">保留原表统计口径，与当前授权覆盖站点数分开。数量须四项完整，累计等于其余三项之和；没有来源数量时全部留空。</p>}
      <div className="form-grid">
        {section === '基本资料' && <Field label="品牌名称" required wide><Input value={draft.name} onChange={name => { setDraft({ ...draft, name }); setError(''); }} placeholder="输入品牌名称" /></Field>}
        {brandFields.filter(([, , group]) => group === section).map(([key, label, , kind]) => <Field key={key} label={label} wide={kind === 'textarea' || kind === 'window'}>{kind === 'textarea' ? <Textarea value={draft.profile[key] || ''} onChange={value => profile(key, value)} autosize={{ minRows: 2, maxRows: 4 }} /> : <Input value={draft.profile[key] || ''} onChange={value => profile(key, value)} placeholder={kind === 'date' ? 'YYYY-MM-DD' : kind === 'window' ? 'YYYY-MM-DD ~ YYYY-MM-DD' : kind === 'number' ? '未记录可留空' : '按来源资料填写'} />}</Field>)}
        {section === '基本资料' && <><div className="full-field"><Checkbox checked={draft.reconciled} onChange={reconciled => { setDraft({ ...draft, reconciled }); setError(''); }}>已核对授权明细与来源资料</Checkbox></div><Field label="核查说明" wide><Textarea value={draft.reviewNote} onChange={reviewNote => { setDraft({ ...draft, reviewNote }); setError(''); }} autosize={{ minRows: 2, maxRows: 4 }} placeholder="记录差异、资料时间或待核查事项" /></Field></>}
      </div>
    </section>)}
  </PreviewForm>;
}

export function PricingForm({ state, row, onClose, onSave }: Props & { row?: DemoPrice }) {
  const [draft, setDraft] = useState(() => priceDraft(row)), [initial] = useState(JSON.stringify(draft)), [error, setError] = useState('');
  const set = (key: keyof typeof draft, value: string) => { setDraft({ ...draft, [key]: value, ...(['country', 'source'].includes(key) && draft[key] !== value ? { cost: '' } : {}) }); setError(''); };
  const product = productFor(draft.productId), label = costLabels[draft.source as keyof typeof costLabels];
  const expectedCountry = draft.source === 'domestic' ? 'CN' : draft.country, mismatch = product && product.country !== expectedCountry;
  let guidance: string | null = null, calculationError = '';
  try { guidance = calculatePrice(draft.cost, draft.multiplier).guidance; } catch (cause) { calculationError = (cause as Error).message; }
  return <PreviewForm title={row ? '编辑产品定价' : '新建产品定价'} dirty={JSON.stringify(draft) !== initial} onClose={onClose} onSave={() => { try { onSave(savePrice(state, draft, row?.id)); } catch (cause) { setError((cause as Error).message); focusError(); } }} submit="保存并生效" summary="保存后立即更新本地示例定价" className="catalog-form brand-pricing-form">
    <ErrorMessage error={error} />
    <section className="catalog-form-section"><h3>产品与供货记录</h3><div className="form-grid"><Field label="产品 / 供应商" required wide>{row ? <div className="maintenance-readonly">{product.name} · {product.spec}<br /><span className="secondary">{product.supplier} · 供货国 {product.country} · {product.id}</span></div> : <Select filterable value={draft.productId} popupProps={{ overlayClassName: 'maintenance-product-options' }} placeholder="搜索品名、规格或供应商，选择一条供货记录" options={pricingProducts.filter(item => item.active).map(item => ({ value: item.id, label: `${item.name} / ${item.spec} / ${item.supplier} / ${item.country}` }))} onChange={value => { const next = productFor(String(value)); setDraft({ ...draft, productId: next.id, spec: next.spec, cost: '' }); setError(''); }} />}</Field>
      {product && <div className="full-field maintenance-reference">采购参考价：<strong className="numeric">{product.reference || '未记录'}</strong><span>币种未确认，仅供核对，不计入成本。</span></div>}
      <Field label="销售规格" wide required><Input value={draft.spec} onChange={value => set('spec', value)} placeholder="例如 48 L / 单件" /></Field>
      <Field label="销售国家" required><Select value={draft.country} options={[{ value: 'US', label: '美国 · USD' }, { value: 'CA', label: '加拿大 · CAD' }]} onChange={value => set('country', String(value))} /></Field>
      <Field label="货源方式" required><Select value={draft.source} options={[{ value: 'domestic', label: '国内货源' }, { value: 'local', label: '当地货源' }]} onChange={value => set('source', String(value))} /></Field>
    </div><p className="secondary maintenance-hint">国内货源对应 CN 供货记录；当地货源对应销售国家。切换国家、货源或供货记录后，成本清空，需重新核算。</p>{mismatch && <Alert theme="warning" message={`当前供货国为 ${product.country}，所选货源需要 ${expectedCountry}。${row ? '已有定价不能更换供货记录，请核对货源或另建定价。' : '请调整货源方式或供货记录。'}`} />}</section>
    <section className="catalog-form-section"><h3>成本与指导价 · {currency(draft.country)}</h3><div className="form-grid"><Field label={`${label}（${currency(draft.country)}）`}><Input value={draft.cost} onChange={value => set('cost', value)} placeholder="留空或 0 表示暂无报价" /></Field><Field label="倍率" required><Input value={draft.multiplier} onChange={value => set('multiplier', value)} placeholder="默认 4，最多四位小数" /></Field></div>
      <div className="maintenance-guidance" role="status"><span>销售指导价</span><strong className="numeric">{calculationError ? '待修正' : guidance ? `${guidance} ${currency(draft.country)}` : '暂无报价'}</strong><span className="secondary">{calculationError || (guidance ? `${draft.cost} × ${draft.multiplier}，四舍五入至两位小数` : '填写有效成本后自动计算')}</span></div>
    </section>
    <section className="catalog-form-section"><div className="form-grid"><div className="catalog-field full-field" role="group" aria-label="定价状态"><span>定价状态</span><Radio.Group value={draft.status} options={[{ value: 'active', label: '启用' }, { value: 'disabled', label: '停用' }]} onChange={value => set('status', String(value))} /><p className="secondary">停用保留定价与修改历史。</p></div><Field label={row ? '修改原因' : '定价说明'} wide required><Textarea value={draft.reason} onChange={value => set('reason', value)} autosize={{ minRows: 2, maxRows: 4 }} placeholder="说明成本依据或本次调整原因" /></Field></div></section>
  </PreviewForm>;
}
