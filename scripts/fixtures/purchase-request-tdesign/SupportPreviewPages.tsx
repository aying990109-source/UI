import { ListFilterToolbar } from './ListFilterToolbar';
import { useState } from 'react';
import { Alert, Avatar, Button, Empty, Input, MessagePlugin, Select, Tag, Textarea } from 'tdesign-react';
import { DetailDrawer } from './DetailDrawer';
import { PreviewForm } from './PreviewForm';
import { answerSupportQuestion, helpArticles, type HelpArticle } from './support-preview-data';
import { createEvent } from './history';
import { PersonalProfilePage, type Profile, type AvatarDraft } from './PersonalProfilePage';

const initialProfile: Profile = { phone: '138 0000 0000', email: 'demo@example.invalid', seat: '示例工位 A-12', jobTitle: '运营协作', joinedAt: '2025-09-01', version: 1 };
type Exchange = { id: number; question: string; answer: string; source: string; articleId?: string };

export function SupportPreviewPages({ active, onNavigate, signedIn }: { active: string; onNavigate: (page: string) => void; signedIn: boolean }) {
  const [profile, setProfile] = useState(initialProfile), [profileEdit, setProfileEdit] = useState(false), [avatar, setAvatar] = useState<AvatarDraft>({ src: '', color: '#3370ff', version: 1 }), [avatarEdit, setAvatarEdit] = useState(false);
  const [search, setSearch] = useState(''), [article, setArticle] = useState<HelpArticle | null>(null);
  const [question, setQuestion] = useState(''), [exchanges, setExchanges] = useState<Exchange[]>([]), [assistantError, setAssistantError] = useState('');
  const matching = helpArticles.filter(item => `${item.title} ${item.category} ${item.premise}`.includes(search.trim()));
  const ask = () => { try { const result = answerSupportQuestion(question); setExchanges(rows => [...rows, { id: rows.length + 1, question: question.trim(), ...result }]); setQuestion(''); setAssistantError(''); } catch (cause) { setAssistantError((cause as Error).message); } };
  const openArticle = (id: string) => { setArticle(helpArticles.find(item => item.id === id) || null); onNavigate('helpDocuments'); };
  return <>
    <PersonalProfilePage active={active === 'personalProfile'} profile={profile} avatar={avatar} signedIn={signedIn} onEditProfile={() => setProfileEdit(true)} onEditAvatar={() => setAvatarEdit(true)} onNavigate={onNavigate} />
    <div hidden={active !== 'helpDocuments'}><h1 className="sr-only">帮助文档</h1><section className="filter-panel" aria-label="查找帮助"><ListFilterToolbar fields={<><label className="keyword-filter"><span>任务关键词</span><Input value={search} onChange={setSearch} clearable placeholder="采购、补货、店铺或销售" /></label></>}  reset={<Button variant="outline" onClick={() => setSearch('')}>重置</Button>} /><span className="secondary">{matching.length} 篇固定任务说明</span><p className="query-rule">选择任务后阅读前提、步骤、结果和注意事项。说明不读取业务数据。</p></section><section className="list-panel" aria-label="帮助任务列表">{matching.length ? <div className="support-card-grid">{matching.map(item => <article className="support-card" key={item.id}><Tag size="small" variant="light">{item.category}</Tag><h2>{item.title}</h2><p>{item.premise}</p><Button variant="text" theme="primary" onClick={() => setArticle(item)}>阅读任务 →</Button></article>)}</div> : <Empty title="没有匹配的任务" action={<Button variant="outline" onClick={() => setSearch('')}>查看全部</Button>} />}</section></div>
    <div hidden={active !== 'businessAssistant'}><h1 className="sr-only">业务助手</h1><section className="filter-panel" aria-label="业务助手提问"><h2>本地业务问答</h2><p className="query-rule">仅根据本样板的固定帮助文字回复，未知问题明确说明范围；不读取正式业务记录或调用模型。</p><div className="filter-fields maintenance-filters"><label className="keyword-filter"><span>输入问题</span><Textarea value={question} onChange={setQuestion} placeholder="例如：如何核对店铺授权？" /></label></div><div className="filter-command-bar"><Button theme="primary" onClick={ask}>发送问题</Button><Button variant="outline" onClick={() => { setExchanges([]); setAssistantError(''); }}>清空本地对话</Button></div>{assistantError && <Alert theme="error" message={assistantError} />}</section><section className="list-panel" aria-label="本地对话记录"><div className="support-card-grid">{exchanges.map(item => <article className="support-card" key={item.id}><span className="secondary">问题 {item.id}</span><h2>{item.question}</h2><p>{item.answer}</p><div className="filter-command-bar"><Tag variant="light">来源：{item.source}</Tag>{item.articleId && <Button variant="text" theme="primary" onClick={() => openArticle(item.articleId!)}>查看引用</Button>}</div></article>)}</div>{!exchanges.length && <Empty title="尚无问题" description="可输入采购、补货、店铺或销售相关问题。" />}</section></div>
    {avatarEdit && <AvatarEditor current={avatar} onClose={() => setAvatarEdit(false)} onSave={next => { setAvatar({ ...next, version: avatar.version + 1 }); setAvatarEdit(false); void MessagePlugin.success('本地头像已保存'); }} />}
    {profileEdit && <ProfileEditor profile={profile} onClose={() => setProfileEdit(false)} onSave={next => { setProfile({ ...next, version: profile.version + 1 }); setProfileEdit(false); void MessagePlugin.success('本地资料已更新'); }} />}
    {article && <DetailDrawer title={`帮助任务 · ${article.title}`} timeline={[createEvent('发布示例说明', '样板维护员', '固定内容，不读取业务数据。', '2026-10-18 09:00:00')]} onClose={() => setArticle(null)}><div className="detail-content"><Tag variant="light">{article.category}</Tag><h2>{article.title}</h2><h3>操作前提</h3><p>{article.premise}</p><h3>操作步骤</h3><ol>{article.steps.map(step => <li key={step}>{step}</li>)}</ol><h3>预期结果</h3><p>{article.result}</p><h3>常见问题与边界</h3><p>{article.caution}</p><Button variant="outline" onClick={() => setArticle(null)}>返回任务列表</Button></div></DetailDrawer>}
  </>;
}

function ProfileEditor({ profile, onClose, onSave }: { profile: Profile; onClose: () => void; onSave: (next: Profile) => void }) {
  const [draft, setDraft] = useState(profile), [error, setError] = useState('');
  const set = (key: keyof Profile, value: string) => setDraft(current => ({ ...current, [key]: value }));
  const save = () => { if (draft.email && !/^[^\s@]+@[^\s@]+$/.test(draft.email) || draft.phone && !/^\+?[0-9 ()-]+$/.test(draft.phone) || draft.joinedAt && (!/^\d{4}-\d{2}-\d{2}$/.test(draft.joinedAt) || Number.isNaN(Date.parse(draft.joinedAt)) || draft.joinedAt > '2026-10-18')) { setError('请核对邮箱、电话及不晚于今天的有效入职日期。'); return; } onSave(draft); };
  return <PreviewForm title="编辑个人资料" dirty={JSON.stringify(draft) !== JSON.stringify(profile)} onClose={onClose} onSave={save} submit="保存资料"><p>仅修改合成资料；真实资料写入需要管理权限与版本校验。</p><div className="form-grid">{([['phone', '手机号'], ['email', '邮箱'], ['seat', '工位'], ['jobTitle', '岗位'], ['joinedAt', '入职日期']] as const).map(([key, label]) => <label key={key}><span>{label}</span><Input value={draft[key]} onChange={value => set(key, value)} /></label>)}</div>{error && <Alert theme="error" message={error} />}</PreviewForm>;
}

function AvatarEditor({ current, onClose, onSave }: { current: AvatarDraft; onClose: () => void; onSave: (next: AvatarDraft) => void }) {
  const [draft, setDraft] = useState(current), [error, setError] = useState('');
  const choose = (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { setError('请选择不超过 2 MB 的 PNG、JPEG 或 WebP 图片。'); return; }
    const reader = new FileReader();
    reader.onload = () => { setDraft(value => ({ ...value, src: String(reader.result || '') })); setError(''); };
    reader.onerror = () => setError('图片读取失败，请重新选择。');
    reader.readAsDataURL(file);
  };
  return <PreviewForm title="更换头像" dirty={draft.src !== current.src || draft.color !== current.color} onClose={onClose} onSave={() => onSave(draft)} submit="保存头像"><p>选择文件或颜色只改变草稿；保存后才更新资料页，取消保留旧头像。这里不验证真实图片解码或服务端隐私规则。</p><div className="detail-title"><Avatar size="72px" style={{ background: draft.color }}>{draft.src ? <img className="support-avatar-image" src={draft.src} alt="头像草稿预览" /> : '演'}</Avatar><span className="secondary">头像版本 v{current.version} · 当前草稿预览</span></div><div className="form-grid"><label><span>选择本地图片</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { choose(event.target.files?.[0]); event.target.value = ''; }} /></label><label><span>姓名头像颜色</span><Select value={draft.color} options={[{ value: '#3370ff', label: '蓝色' }, { value: '#006b5e', label: '绿色' }, { value: '#8d4d90', label: '紫色' }]} onChange={value => setDraft(previous => ({ ...previous, color: String(value), src: '' }))} /></label></div><Button variant="outline" onClick={() => setDraft(previous => ({ ...previous, src: '' }))}>恢复姓名头像</Button>{error && <div role="alert"><Alert theme="error" message={error} /></div>}</PreviewForm>;
}

