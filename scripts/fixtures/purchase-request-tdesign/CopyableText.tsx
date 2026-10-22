import { Button, MessagePlugin, Tooltip } from 'tdesign-react';
import { CopyIcon } from 'tdesign-icons-react';

export function CopyableText({ label, value, className = '', multiline = false, onClick }: { label: string; value: string; className?: string; multiline?: boolean; onClick?: () => void }) {
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); void MessagePlugin.success(`${label}已复制`); }
    catch { void MessagePlugin.error(`复制失败，请手动复制${label}`); }
  };
  return <span className={`copyable-text${multiline ? ' is-multiline' : ''}`}>
    {onClick && value ? <Button className={`copyable-text-value ${className}`} title={value} type="button" variant="text" theme="primary" size="small" onClick={onClick}>{value}</Button> : <span className={`copyable-text-value ${className}`} title={value}>{value || '未提供'}</span>}
    {value && <Tooltip content={`复制${label}`}><Button className="copyable-text-button" type="button" variant="text" theme="primary" shape="square" size="small" icon={<CopyIcon />} aria-label={`复制${label}：${value}`} onClick={event => { event.stopPropagation(); void copy(); }} /></Tooltip>}
  </span>;
}
