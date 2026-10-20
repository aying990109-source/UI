import { useState } from 'react';
import { Alert, Button, PrimaryTable, Tag, Textarea } from 'tdesign-react';
import { PreviewForm } from './PreviewForm';
import { exportDemo } from './processing-data';
import { commitGroupCsv, groupCsvHeaders, previewGroupCsv, type GroupPlan } from './store-group-transfer';
import type { MiddleState } from './middle-data';

export function StoreGroupImportForm({ state, onClose, onCommit }: { state: MiddleState; onClose: () => void; onCommit: (next: MiddleState) => void }) {
  const [text, setText] = useState(''), [plans, setPlans] = useState<GroupPlan[]>([]), [error, setError] = useState(''), [source, setSource] = useState('粘贴 CSV');
  const focusError = () => requestAnimationFrame(() => document.getElementById('store-group-import-error')?.focus());
  const preview = () => { try { setPlans(previewGroupCsv(state, text)); setError(''); } catch (cause) { setPlans([]); setError((cause as Error).message); focusError(); } };
  const read = async (file?: File) => { if (!file) return; try { if (!file.name.toLowerCase().endsWith('.csv') || file.size > 1024 * 1024) throw new Error('请选择不超过 1 MB 的 UTF-8 CSV。'); const value = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer()); setText(value); setSource(file.name); setPlans([]); setError(''); } catch (cause) { setError((cause as Error).message); focusError(); } };
  const commit = () => { try { onCommit(commitGroupCsv(state, plans)); } catch (cause) { setError((cause as Error).message); focusError(); } };
  return <PreviewForm title="批量导入店铺归组 CSV" dirty={!!text} onClose={onClose} onSave={commit} submit="确认整批归组"><p>整批预检和整批确认：任一行错误时全部不写入。此入口不维护店铺信息 XLSX、账号状态或品牌授权。</p><div className="middle-import-actions"><Button variant="outline" onClick={() => exportDemo('店铺归组导入模板', groupCsvHeaders, [])}>下载 CSV 模板</Button><label>选择 UTF-8 CSV <input type="file" accept=".csv,text/csv" onChange={event => { void read(event.target.files?.[0]); event.target.value = ''; }} /></label></div><label><span>CSV 内容 · {source}</span><Textarea value={text} onChange={value => { setText(value); setSource('粘贴 CSV'); setPlans([]); }} autosize={{ minRows: 7, maxRows: 12 }} placeholder={groupCsvHeaders.join(',')} /></label><div className="filter-command-bar"><Button variant="outline" onClick={preview}>预检整批</Button><span role="status">{plans.length ? `${plans.length} 行 · ${plans.filter(plan => plan.errors.length).length} 行错误` : '尚未预检'}</span></div>{plans.length > 0 && <div className="middle-import-results" role="region" tabIndex={0} aria-label="归组预检结果，可横向滚动"><PrimaryTable rowKey="line" data={plans} columns={[{ colKey: 'line', title: '行', width: 60 }, { colKey: 'sid', title: 'SID', width: 180 }, { colKey: 'action', title: '动作', width: 90 }, { colKey: 'result', title: '预检', width: 250, cell: ({ row }) => row.errors.length ? <><Tag theme="danger" variant="light">错误</Tag> {row.errors.join('；')}</> : <Tag theme="success" variant="light">可提交</Tag> }]} size="small" tableLayout="fixed" /></div>}{error && <div id="store-group-import-error" role="alert" tabIndex={-1}><Alert theme="error" message={error} /></div>}</PreviewForm>;
}

