import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, Button } from 'tdesign-react';
import { linkPreviewLabels, PreviewDialog } from './PreviewDialog';

export function PreviewForm({ title, dirty, onClose, onSave, submit, children, summary, className = '' }: { title: string; dirty: boolean; onClose: () => void; onSave: () => void; submit: string; children: ReactNode; summary?: string; className?: string }) {
  const [discard, setDiscard] = useState(false);
  const form = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { linkPreviewLabels(form.current); });
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  return <PreviewDialog title={title} width={960} onClose={() => dirty ? setDiscard(true) : onClose()} footer={<div className="form-footer shipping-form-footer"><span>{discard ? '放弃后不会保存本次修改' : summary || (dirty ? '有未保存的修改' : '仅更新本地示例')}</span><div>{discard ? <><Button variant="outline" onClick={() => setDiscard(false)}>继续编辑</Button><Button theme="danger" onClick={onClose}>放弃修改</Button></> : <><Button variant="outline" onClick={() => dirty ? setDiscard(true) : onClose()}>取消</Button><Button theme="primary" onClick={onSave}>{submit}</Button></>}</div></div>}>
    <div className={`shipping-form ${className}`} ref={form}>{discard && <div role="alert"><Alert theme="warning" message="存在未保存的修改，请继续编辑或放弃修改。" /></div>}{children}</div>
  </PreviewDialog>;
}



