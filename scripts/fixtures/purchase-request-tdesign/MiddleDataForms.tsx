import { useRef, useState, type ReactNode } from 'react';
import { Alert, Button, Input, Radio, Select, Tag, Textarea } from 'tdesign-react';
import { PreviewForm } from './PreviewForm';
import { addEan, demoGroups, demoOwners, groupName, importEans, saveStore, storeDraft, type DemoStore, type EanImport, type MiddleState } from './middle-data';
import { exportDemo } from './processing-data';

const Field = ({ label, children, wide = false, required = false }: { label: string; children: ReactNode; wide?: boolean; required?: boolean }) => <label className={wide ? 'full-field' : undefined}><span>{label}{required && <em> *</em>}</span>{children}</label>;
const ErrorMessage = ({ error }: { error: string }) => error ? <div id="middle-form-error" className="shipping-form-error" tabIndex={-1} role="alert"><Alert theme="error" message={error} /></div> : null;
const focusError = () => requestAnimationFrame(() => document.getElementById('middle-form-error')?.focus());
type FormProps = { state: MiddleState; onClose: () => void; onSave: (next: MiddleState) => void };

export function EanForm({ state, onClose, onSave }: FormProps) {
  const [code, setCode] = useState(''), [error, setError] = useState('');
  return <PreviewForm title="添加 EAN Code" dirty={!!code} onClose={onClose} submit="加入码池" onSave={() => { try { onSave(addEan(state, code)); } catch (cause) { setError((cause as Error).message); focusError(); } }} className="catalog-form">
    <section className="catalog-form-section"><h3>码值资料</h3><div className="form-grid"><Field label="EAN Code" wide required><Input value={code} onChange={value => { setCode(value); setError(''); }} placeholder="输入 13 位数字，保留开头的 0" /></Field></div><p className="secondary">新码进入可用状态。已发放码不能覆盖、回收或在这里重新分配。</p></section><ErrorMessage error={error} />
  </PreviewForm>;
}

export const eanImportExample = 'EAN Code\n0000000009001\n0000000001001\n12345\n0000000009002';
export function EanImportForm({ state, initial = '', onClose, onImported }: Omit<FormProps, 'onSave'> & { initial?: string; onImported: (next: MiddleState, batch: EanImport) => void }) {
  const [text, setText] = useState(initial), [source, setSource] = useState('粘贴 CSV'), [error, setError] = useState(''), [reading, setReading] = useState(false), ticket = useRef(0);
  const readFile = async (file?: File) => {
    if (!file) return;
    const request = ++ticket.current; setReading(true); setError('');
    try { if (!file.name.toLowerCase().endsWith('.csv') || file.size > 1000000) throw new Error('请选择不超过 1 MB 的 UTF-8 CSV 文件。'); const content = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer()); if (request === ticket.current) { setText(content); setSource(file.name); } }
    catch (cause) { if (request === ticket.current) { setError(cause instanceof TypeError ? '文件不是有效 UTF-8，请转换编码后重试。' : (cause as Error).message); focusError(); } }
    finally { if (request === ticket.current) setReading(false); }
  };
  return <PreviewForm title="导入 EAN 码池" dirty={text !== initial || !!initial} onClose={onClose} submit={reading ? '正在读取文件' : '导入有效行'} summary="有效行会加入本地码池，失败行单独反馈" className="catalog-form" onSave={() => { if (reading) return; try { const result = importEans(state, text, source); onImported(result.state, result.batch); } catch (cause) { setError((cause as Error).message); focusError(); } }}>
    <section className="catalog-form-section"><h3>准备 CSV</h3><p className="secondary">使用 EAN Code 表头；码值保持 13 位数字文本。空行忽略，每次最多 500 条，重复码不覆盖。</p><div className="middle-import-actions"><Button variant="outline" onClick={() => exportDemo('EAN码池导入模板', ['EAN Code'], [['0000000009001']])}>下载 CSV 模板</Button><Button variant="outline" disabled={reading} onClick={() => { setText(eanImportExample); setSource('内置混合示例'); setError(''); }}>填入混合示例</Button></div><Field label="选择 UTF-8 CSV 文件"><input className="middle-file-input" type="file" accept=".csv,text/csv" disabled={reading} onChange={event => { void readFile(event.target.files?.[0]); event.target.value = ''; }} /></Field></section>
    <section className="catalog-form-section"><div className="form-grid"><Field label="CSV 内容" wide required><Textarea value={text} disabled={reading} onChange={value => { setText(value); setSource('粘贴 CSV'); setError(''); }} autosize={{ minRows: 8, maxRows: 14 }} placeholder={'EAN Code\n0000000009001'} /></Field></div><p className="secondary">来源：{source}。内容只在当前浏览器解析，不上传文件。</p></section><ErrorMessage error={error} />
  </PreviewForm>;
}

export function StoreBindingForm({ state, row, onClose, onSave }: FormProps & { row?: DemoStore }) {
  const [draft, setDraft] = useState(() => storeDraft(row)), [initial] = useState(JSON.stringify(draft)), [error, setError] = useState('');
  const set = (key: keyof typeof draft, value: string | boolean) => { setDraft({ ...draft, [key]: value }); setError(''); };
  const moved = !!row && draft.groupId !== row.groupId, removed = moved && row.dossier ? row.dossier.ownerIds.filter(id => !demoOwners.find(owner => owner.id === id)?.groupIds.includes(draft.groupId)) : [];
  return <PreviewForm title={row ? '编辑店铺归组' : '添加店铺'} dirty={initial !== JSON.stringify(draft)} onClose={onClose} submit="保存店铺" className="catalog-form" onSave={() => { try { onSave(saveStore(state, draft, row?.sid)); } catch (cause) { setError((cause as Error).message); focusError(); } }}>
    {row && <div className="shipping-template"><span>{row.sid} · {row.country || '站点未填写'}</span><strong>{row.shortName || '简称未填写'}</strong></div>}
    <section className="catalog-form-section"><h3>店铺身份</h3><div className="form-grid"><Field label="店铺名称" wide required><Input value={draft.name} onChange={value => set('name', value)} /></Field>{!row && <><Field label="领星店铺 ID" required><Input value={draft.sid} onChange={value => set('sid', value)} placeholder="例如 DEMO-SID-013" /></Field><Field label="国家 / 站点"><Input value={draft.country} onChange={value => set('country', value)} placeholder="例如 US、CA" /></Field></>}<Field label="平台"><Input value={draft.platform} onChange={value => set('platform', value)} placeholder="例如 Amazon、eBay" /></Field><Field label="店铺等级"><Input value={draft.grade} onChange={value => set('grade', value)} placeholder="留空为未评级" /></Field></div></section>
    <section className="catalog-form-section"><h3>小组与工作台状态</h3>{!!row?.references.length && <Alert className="middle-reference-note" theme="info" message={`该站点关联${row.references.join('、')}，不能直接转组；仍可修改当前组内资料和工作台启停。`} />}<div className="form-grid"><Field label="所属小组" required wide><Select value={draft.groupId} options={demoGroups.map(group => ({ label: group.name, value: group.id }))} disabled={!!row?.references.length} placeholder="选择小组" onChange={value => set('groupId', String(value))} /></Field>{row && <div className="catalog-field full-field" role="group" aria-label="工作台启用状态"><span>工作台启用状态</span><Radio.Group value={draft.active ? '启用' : '停用'} options={['启用', '停用']} onChange={value => set('active', value === '启用')} /><p className="secondary">停用保留账号标签和运营资料，不代表平台账号停用。</p></div>}</div>{moved && <div className="middle-handoff-note" role="status"><Alert theme="warning" message={row.dossier ? `运营资料将从${groupName(row.groupId)}交接至${groupName(draft.groupId)}；${removed.length ? `移除当前负责人：${removed.map(id => demoOwners.find(owner => owner.id === id)?.name || id).join('、')}` : '保留仍属于目标组的当前负责人'}，保留源负责人文字与历史。` : '该站点尚未建立运营资料；本次归组不会自动创建空档案。'} /></div>}</section>
    {row && <><section className="catalog-form-section"><h3>平台账号状态 · 只读</h3><div className="middle-tags">{row.accountStatuses?.length ? row.accountStatuses.map(value => <Tag key={value} variant="light">{value}</Tag>) : <span className="secondary">未标注，不推定正常</span>}</div><p className="secondary">账号标签与简称在店铺信息中维护，本归组样板不修改共享字段或品牌授权。</p></section><section className="catalog-form-section"><div className="form-grid"><Field label="修改原因" required wide><Textarea value={draft.reason} onChange={value => set('reason', value)} autosize={{ minRows: 2, maxRows: 4 }} /></Field></div></section></>}
    <ErrorMessage error={error} />
  </PreviewForm>;
}
