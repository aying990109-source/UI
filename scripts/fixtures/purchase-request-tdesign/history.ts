import type { Stage } from './data';

export type DetailEvent = { label: string; operator: string; time: string; comment: string; rejected?: boolean };

export function createEvent(label: string, operator: string, comment: string, time?: string): DetailEvent {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return { label, operator, comment, time: time ?? `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}` };
}

// Fixture history only; production events continue to come from the detail API.
export function seedRequestTimeline(date: string, applicant: string, quantity: number, status: Stage): DetailEvent[] {
  const events = [createEvent('提交申请', applicant, `申请采购 ${quantity} 件。`, `${date} 09:10:00`)];
  if (status === '审批中') return events;
  if (status === '已驳回') return [...events, { ...createEvent('审批驳回', '审批人（示例）', '请补充库存依据并重新确认采购数量。', `${date} 10:20:00`), rejected: true }];
  events.push(createEvent('审批通过', '审批人（示例）', '同意采购，请采购核对供应商与报价。', `${date} 10:20:00`));
  if (status === '采购复审') return events;
  events.push(createEvent('采购复审通过', '采购员（示例）', `计划采购 ${quantity} 件，采购资料已确认。`, `${date} 11:05:00`));
  if (status === '待采购') return events;
  events.push(createEvent('采购下单', '采购员（示例）', `本次下单 ${quantity} 件。`, `${date} 14:30:00`));
  if (status === '已下单') return events;
  events.push(createEvent('运输中', '物流员（示例）', '货物已发出，进入运输阶段。', `${date} 15:00:00`));
  if (status === '运输中') return events;
  events.push(createEvent('已到港', '物流员（示例）', '货物已抵达目的港。', `${date} 16:00:00`));
  if (status === '已到港') return events;
  events.push(createEvent('已上架', '仓储员（示例）', '货物已完成上架。', `${date} 17:00:00`));
  return events;
}
