import { useRef, useState } from 'react';
import { Alert, Button, Input, InputNumber, Select, Textarea, Upload, type UploadFile } from 'tdesign-react';
import { PreviewForm } from './PreviewForm';
import { products } from './data';
import { allowance, createReplenishment, groups, inventoryValues, saveListing, shops, type Listing, type ListingDraft, type OperationsState, type ReplenishmentDraft } from './operations-data';

const options = (values: string[]) => values.map(value => ({ value, label: value }));
function FormError({ message }: { message: string }) { return message ? <div id="operations-form-error" tabIndex={-1} role="alert"><Alert theme="error" message={message} /></div> : null; }
function focusError(id?: string) { requestAnimationFrame(() => (id ? document.getElementById(id) : document.getElementById('operations-form-error'))?.focus()); }

export function ReplenishmentForm({ state, onSave, onClose }: { state: OperationsState; onSave: (state: OperationsState) => void; onClose: () => void }) {
  const initial: ReplenishmentDraft = { sourceId: '', group: groups[0], quantity: 0, shop: '', asin: '', fnsku: '', msku: '', remark: '' };
  const [draft, setDraft] = useState(initial), [error, setError] = useState('');
  const source = state.sources.find(row => row.id === draft.sourceId), values = source ? inventoryValues(state, source) : null;
  const set = <K extends keyof ReplenishmentDraft>(key: K, value: ReplenishmentDraft[K]) => { setDraft({ ...draft, [key]: value }); setError(''); };
  function submit() {
    try { onSave(createReplenishment(state, draft)); } catch (error) { setError((error as Error).message); focusError(!source ? 'op-source' : !Number.isSafeInteger(draft.quantity) || draft.quantity <= 0 || draft.quantity % source.carton || draft.quantity > allowance(state, source) ? 'op-quantity' : !draft.shop ? 'op-shop' : !draft.asin.trim() ? 'op-asin' : !draft.fnsku.trim() ? 'op-fnsku' : !draft.msku.trim() ? 'op-msku' : undefined); }
  }
  return <PreviewForm className="operations-form" title="新建补货申请" dirty={JSON.stringify(draft) !== JSON.stringify(initial)} onClose={onClose} onSave={submit} submit="提交示例申请" summary={source ? `${draft.quantity || 0} 件 · ${draft.quantity % source.carton ? '请填写整箱数量' : `${draft.quantity / source.carton || 0} 箱`}` : '选择具体采购来源申请补货'}>
    <div className="form-grid">
      <label htmlFor="op-group"><span>申请小组 <em>*</em></span><Select value={draft.group} options={options(groups)} onChange={value => set('group', String(value))} /></label>
      <div className="shipping-template"><span>提交后的流程</span><strong>{source && source.group !== draft.group ? '货源确认 → 申请审批 → 补货发货' : '申请审批 → 补货发货'}</strong></div>
    </div>
    <label htmlFor="op-source"><span>采购来源 <em>*</em></span><Select value={draft.sourceId} popupProps={{ overlayClassName: "operations-source-popup" }} filterable placeholder="搜索采购编码或商品" options={state.sources.filter(row => allowance(state, row) > 0).map(row => ({ value: row.id, label: `${row.id} · ${row.product} · ${row.group} · 可申请 ${allowance(state, row)} 件` }))} onChange={value => { const row = state.sources.find(row => row.id === value); setDraft({ ...draft, sourceId: String(value), quantity: 0, shop: row ? shops[row.site === 'CA' ? 1 : 0] : '' }); setError(''); }} /></label>
    {source && <><div className="quantity-overview"><div><span>可申请额度</span><strong>{allowance(state, source)} 件</strong></div><div><span>来源可用库存</span><strong>{values?.available} 件</strong></div><div><span>参考装箱数</span><strong>{source.carton} 件/箱</strong></div><div><span>货物所在地</span><strong>{source.warehouse}</strong></div></div><p className="secondary">{source.group === draft.group ? '同组提交即预留额度；审批通过不重复占用。' : '跨组提交暂不预留；货源确认时再次检查额度并预留。'} 可申请额度与仓内可用库存口径不同。</p></>}
    <div className="form-grid"><label htmlFor="op-quantity"><span>申请数量 <em>*</em></span><InputNumber value={draft.quantity || undefined} min={1} decimalPlaces={0} suffix="件" placeholder="填写整箱数量" onChange={value => set('quantity', Number(value))} /></label><label htmlFor="op-shop"><span>ERP 店铺 <em>*</em></span><Select value={draft.shop} options={options(source ? shops.filter(shop => (source.site === 'CA') === shop.includes('CA')) : shops)} placeholder="选择店铺" onChange={value => set('shop', String(value))} /></label></div>
    <div className="form-grid three-columns">{(['asin', 'fnsku', 'msku'] as const).map(key => <label key={key} htmlFor={`op-${key}`}><span>{key.toUpperCase()} <em>*</em></span><Input value={draft[key]} placeholder={`填写 ${key.toUpperCase()}`} onChange={value => set(key, value)} /></label>)}</div>
    <label htmlFor="op-remark"><span>备注</span><Textarea value={draft.remark} onChange={value => set('remark', value)} autosize={{ minRows: 2, maxRows: 4 }} /></label><FormError message={error} />
  </PreviewForm>;
}

export function ListingForm({ state, row, onSave, onClose }: { state: OperationsState; row?: Listing; onSave: (state: OperationsState) => void; onClose: () => void }) {
  const initial: ListingDraft = row ? { product: row.product, group: row.group, shop: row.shop, price: row.price, title: row.title, bullets: row.bullets, image: row.image, remark: row.remark } : { product: '', group: groups[0], shop: '', price: 0, title: '', bullets: '', image: '', remark: '' };
  const [draft, setDraft] = useState(initial), [error, setError] = useState(''), [reading, setReading] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>(row?.image ? [{ name: '原主图', url: row.image, status: 'success' }] : []);
  const fileVersion = useRef(0);
  const set = <K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) => { setDraft(previous => ({ ...previous, [key]: value })); setError(''); };
  function choose(files: UploadFile[]) {
    const version = ++fileVersion.current;
    setFiles(files); setError('');
    if (!files.length) { set('image', ''); setReading(false); return; }
    const file = files.at(-1)?.raw; if (!file) return;
    setReading(true);
    const reader = new FileReader();
    reader.onload = () => { if (version === fileVersion.current) { set('image', String(reader.result)); setFiles([{ name: file.name, url: String(reader.result), status: 'success' }]); setReading(false); } };
    reader.onerror = () => { if (version === fileVersion.current) { set('image', ''); setError('无法读取主图，请重新选择。'); setFiles([]); setReading(false); } };
    reader.readAsDataURL(file);
  }
  function submit() {
    if (reading) { setError('主图正在读取，请稍后提交。'); return; }
    try { onSave(saveListing(state, draft, row?.id)); } catch (error) {
      setError((error as Error).message);
      const missing = ['product', 'shop', 'price', 'title', 'bullets'].find(key => !draft[key as keyof ListingDraft]);
      focusError(missing ? `listing-${missing}` : undefined);
    }
  }
  return <PreviewForm className="operations-form" title={row ? '修改上架申请' : '新建上架申请'} dirty={reading || JSON.stringify(draft) !== JSON.stringify(initial)} onClose={onClose} onSave={submit} submit="保存并提交示例" summary="审批完成后分配示例 EAN；不登记实物上架" >
    <div className="form-grid"><label htmlFor="listing-group"><span>申请小组 <em>*</em></span><Select disabled={!!row} value={draft.group} options={options(groups)} onChange={value => set('group', String(value))} /></label><label htmlFor="listing-shop"><span>店铺 <em>*</em></span><Select value={draft.shop} placeholder="选择店铺" options={options(shops)} onChange={value => set('shop', String(value))} /></label></div>
    <div className="listing-editor-grid"><section className="listing-image-section" aria-label="商品主图"><h3>主图 <em>*</em></h3><Upload theme="custom" trigger={<Button variant="outline" aria-label="选择主图">选择主图</Button>} autoUpload={false} max={1} files={files} accept="image/png,image/jpeg,image/webp" showUploadProgress={false} tips="PNG / JPG / WebP，最大 5 MB。仅本地读取，不上传。" beforeUpload={file => { const valid = !!file.raw && ['image/png', 'image/jpeg', 'image/webp'].includes(file.raw.type) && file.raw.size <= 5 * 1024 * 1024; if (!valid) setError('请选择 5 MB 以内的 PNG、JPG 或 WebP 主图。'); return valid; }} onChange={choose} />{draft.image && <><img className="listing-detail-image" src={draft.image} alt="所选主图预览" /><Button variant="text" theme="primary" onClick={() => choose([])}>移除主图</Button></>}<span role="status" className="secondary">{reading ? '正在读取主图…' : draft.image ? '已选择主图' : '尚未选择主图'}</span></section>
      <div className="listing-copy-fields"><label htmlFor="listing-product"><span>品名 <em>*</em></span><Select filterable value={draft.product} options={options(products.map(item => item.name))} placeholder="选择品名" onChange={value => set('product', String(value))} /></label><label htmlFor="listing-price"><span>定价（{draft.shop.includes('CA') ? 'CAD' : 'USD'}） <em>*</em></span><InputNumber value={draft.price || undefined} min={0.01} decimalPlaces={2} onChange={value => set('price', Number(value))} /></label><label htmlFor="listing-title"><span>商品标题 <em>*</em></span><Input value={draft.title} onChange={value => set('title', value)} /></label><label htmlFor="listing-bullets"><span>五点描述 <em>*</em></span><Textarea value={draft.bullets} placeholder="逐行填写商品要点" autosize={{ minRows: 5, maxRows: 9 }} onChange={value => set('bullets', value)} /></label></div>
    </div><label htmlFor="listing-remark"><span>备注</span><Textarea value={draft.remark} onChange={value => set('remark', value)} autosize={{ minRows: 2, maxRows: 4 }} /></label><FormError message={error} />
  </PreviewForm>;
}


