import { Button } from 'tdesign-react';

export function MobilePagination({ current, pageSize, total, onChange }: { current: number; pageSize: number; total: number; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <nav className="middle-mobile-pagination" aria-label="列表分页"><Button variant="outline" disabled={current === 1} onClick={() => onChange(current - 1)}>上一页</Button><span role="status">第 {current} / {pages} 页</span><Button variant="outline" disabled={current >= pages} onClick={() => onChange(current + 1)}>下一页</Button></nav>;
}
