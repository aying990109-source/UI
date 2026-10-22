import { useState } from 'react';
import { Button, MessagePlugin } from 'tdesign-react';
import { CheckCircleIcon, CloseIcon, CloudUploadIcon, DownloadIcon, ErrorCircleIcon, FileIcon, FileSearchIcon, UploadIcon } from 'tdesign-icons-react';
import { PreviewDialog } from './PreviewDialog';
import { fileTableCsv, type FileTable } from './file-transfer-data';
import './FileTransferActions.css';

function downloadTable(title: string, data: FileTable) {
  const url = URL.createObjectURL(new Blob([fileTableCsv(data)], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = `${title}.csv`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function CsvImportButton({ title, data }: { title: string; data: FileTable }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button type="button" variant="outline" icon={<UploadIcon />} onClick={() => setOpen(true)}>导入 CSV</Button>
    {open && <ImportPreviewDialog title={title} data={data} onClose={() => setOpen(false)} />}
  </>;
}

export function ImportPreviewDialog({ title, data, format = 'CSV', previewColumnCount = 3, uniqueFirstColumn = true, onClose }: { title: string; data: FileTable; format?: 'CSV' | 'XLSX'; previewColumnCount?: number; uniqueFirstColumn?: boolean; onClose: () => void }) {
  const [stage, setStage] = useState<'upload' | 'selected' | 'success' | 'error'>('upload');
  const [dragging, setDragging] = useState(false), [errorsOnly, setErrorsOnly] = useState(false);
  const checked = stage === 'success' || stage === 'error';
  // These are presentation states only: no file is read, validated, or submitted.
  const changeStage = (next: typeof stage) => { setStage(next); setErrorsOnly(false); setDragging(false); };
  const headers = data.headers.slice(0, previewColumnCount);
  const samples = data.rows.length ? data.rows.slice(0, 3) : Array.from({ length: 3 }, (_, i) => headers.map(header => `${header}示例 ${i + 1}`));
  const rows = samples.map((sample, index) => {
    const cells = sample.slice(0, headers.length);
    let problem = '';
    if (stage === 'error' && index === Math.min(1, samples.length - 1)) {
      cells[0] = '';
      problem = `${headers[0]}不能为空`;
    } else if (stage === 'error' && uniqueFirstColumn && samples.length > 2 && index === samples.length - 1) {
      cells[0] = samples[0][0];
      problem = `${headers[0]}与第 2 行重复`;
    }
    return { line: index + 2, cells, problem };
  });
  const errorCount = rows.filter(row => row.problem).length;
  const previewNotice = () => { void MessagePlugin.info('当前仅为前端样式预览，未执行文件操作'); };
  const footer = <div className="form-footer shipping-form-footer import-preview-footer">
    <span>前端样式预览 · 不读取或提交文件</span>
    <div>
      <Button type="button" variant="outline" onClick={onClose}>取消</Button>
      <Button type="button" theme="primary" disabled={stage === 'upload' || stage === 'error'} onClick={() => stage === 'selected' ? changeStage('success') : previewNotice()}>
        {checked ? `确认导入${stage === 'success' ? `（${rows.length}）` : ''}` : '开始预检'}
      </Button>
    </div>
  </div>;
  const showSelected = () => changeStage('selected');
  return <PreviewDialog title={`${title} · 导入数据`} onClose={onClose} footer={footer}>
      <div className="import-preview" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); setDragging(false); }}>
        <p className="import-preview-intro">按模板整理数据，上传后先预检，确认无误再导入。</p>
        <div className="import-preview-switcher" role="group" aria-label="导入弹窗样式预览">
          <span>样式预览</span>
          <div>{([{ value: 'upload', label: '待上传' }, { value: 'success', label: '预检通过' }, { value: 'error', label: '存在错误' }] as const).map(option =>
            <button key={option.value} type="button" aria-pressed={stage === option.value} onClick={() => changeStage(option.value)}>{option.label}</button>
          )}</div>
        </div>
        <section className="import-preview-section" aria-label="上传文件">
          <div className="import-preview-heading"><h3>上传文件</h3><Button type="button" theme="primary" variant="text" icon={<DownloadIcon />} onClick={previewNotice}>下载 {format} 模板</Button></div>
          <button type="button" className={`import-dropzone${dragging ? ' is-dragging' : ''}${stage !== 'upload' ? ' is-compact' : ''}`} onClick={showSelected}
            onDragEnter={event => { event.preventDefault(); setDragging(true); }}
            onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
            onDrop={event => { event.preventDefault(); event.stopPropagation(); showSelected(); }}>
            <CloudUploadIcon className="import-dropzone-icon" />
            <span className="import-dropzone-title">{dragging ? '松开鼠标放入文件' : <>将文件拖到此处，或<span className="import-dropzone-link">点击上传</span></>}</span>
            <span className="import-dropzone-hint">支持 {format === 'XLSX' ? 'XLSX，单个文件不超过 10 MB' : 'CSV（UTF-8），单个文件不超过 2 MB'} / 5,000 行</span>
          </button>
          {stage !== 'upload' && <div className="import-selected-file">
            <FileIcon className="import-file-icon" />
            <div><strong>{title}-导入示例.{format.toLowerCase()}</strong><span>示例文件 · {rows.length} 条数据</span></div>
            <span className={`import-file-status${checked ? stage === 'error' ? ' is-error' : ' is-success' : ''}`}>{checked ? stage === 'error' ? '需修正' : '预检通过' : '待预检'}</span>
            <Button type="button" variant="text" shape="square" icon={<CloseIcon />} aria-label="移除示例文件" onClick={() => changeStage('upload')} />
          </div>}
        </section>
        <section className="import-preview-section" aria-label="预检结果">
          <div className="import-preview-heading"><h3>预检结果</h3><span className="import-preview-caption">表头匹配 / 必填校验 / 重复检查</span></div>
          {!checked ? <div className="import-check-empty" role="status">
            <FileSearchIcon />
            <div><strong>{stage === 'selected' ? '文件已就绪，等待预检' : '上传文件后查看预检结果'}</strong><p>{stage === 'selected' ? '点击“开始预检”，查看数据是否符合导入要求' : '预检将标出异常行，帮助你在导入前修正数据'}</p></div>
          </div> : <>
            <div className={`import-check-summary ${stage === 'error' ? 'is-error' : 'is-success'}`} role="status">
              {stage === 'error' ? <ErrorCircleIcon /> : <CheckCircleIcon />}
              <div><strong>{stage === 'error' ? `发现 ${errorCount} 行异常，请修正后重新上传` : '预检通过，可以导入'}</strong><p>{stage === 'error' ? '异常数据暂不可导入，请按下方提示修改原文件。' : '示例数据已通过全部检查，确认后可完成导入。'}</p></div>
            </div>
            <div className="import-check-toolbar">
              <div className="import-check-counts"><span>共 <strong>{rows.length}</strong> 行</span><span>通过 <strong>{rows.length - errorCount}</strong></span><span className={errorCount ? 'is-error' : ''}>异常 <strong>{errorCount}</strong></span></div>
              {errorCount > 0 && <button type="button" className="import-error-toggle" aria-pressed={errorsOnly} onClick={() => setErrorsOnly(!errorsOnly)}>{errorsOnly ? '查看全部数据' : '仅看异常行'}</button>}
            </div>
            <div className="import-preview-table" role="region" aria-label="预检数据明细，可横向滚动" tabIndex={0}>
              <table><thead><tr><th scope="col">文件行</th>{headers.map((header, index) => <th key={index} scope="col">{header}</th>)}<th scope="col">预检结果 / 问题说明</th></tr></thead>
                <tbody>{rows.filter(row => !errorsOnly || row.problem).map(row => <tr key={row.line} className={row.problem ? 'has-error' : ''}><td>{row.line}</td>{row.cells.map((cell, index) => <td key={index}>{cell === '' ? <span className="import-empty-cell">未填写</span> : cell}</td>)}<td><span className={`import-row-result ${row.problem ? 'is-error' : 'is-success'}`}>{row.problem ? <ErrorCircleIcon /> : <CheckCircleIcon />}{row.problem || '通过'}</span></td></tr>)}</tbody>
              </table>
            </div>
          </>}
        </section>
      </div>
    </PreviewDialog>;
}

export function CsvExportButton({ title, data, disabled = false }: { title: string; data: FileTable; disabled?: boolean }) {
  return <Button type="button" variant="outline" icon={<DownloadIcon />} disabled={disabled || !data.rows.length} onClick={() => { downloadTable(`${title}-当前筛选`, data); void MessagePlugin.success(`已导出 ${data.rows.length} 条本地示例`); }}>导出当前筛选</Button>;
}

export function FileTransferActions({ title, data, disabled = false }: { title: string; data: FileTable; disabled?: boolean }) {
  return <><CsvImportButton title={title} data={data} /><CsvExportButton title={title} data={data} disabled={disabled} /></>;
}
