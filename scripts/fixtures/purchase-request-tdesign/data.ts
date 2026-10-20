import { seedRequestTimeline, type DetailEvent } from './history';

export const products = [
  { name: '可折叠收纳箱 45L', code: 'SP-10028', color: '奶油白', carton: 12 },
  { name: '不锈钢保温杯 600ml', code: 'SP-10036', color: '岩石灰', carton: 24 },
  { name: '桌面理线收纳盒', code: 'SP-10041', color: '雾白', carton: 20 },
  { name: '便携式旅行收纳袋', code: 'SP-10052', color: '藏青', carton: 50 },
  { name: '硅胶厨房工具六件套', code: 'SP-10063', color: '鼠尾草绿', carton: 24 },
  { name: '可调节笔记本支架', code: 'SP-10075', color: '银色', carton: 10 },
  { name: '浴室置物架', code: 'SP-10081', color: '哑光黑', carton: 16 },
  { name: '抽屉分隔收纳组件', code: 'SP-10089', color: '原木色', carton: null },
];

export const requestStages = ['审批中', '采购复审', '待采购', '已下单', '运输中', '已到港', '已上架', '已驳回'] as const;
export type Stage = typeof requestStages[number];
export type RequestRow = {
  id: string; product: string; productCode: string; color: string; carton: number | null;
  quantity: number; date: string; purchaseType: string; stockingType: string;
  site: string; stockPath: string; transport: string; applicant: string; group: string;
  status: Stage; remark: string; shop: string; asin: string; fnsku: string; msku: string;
  timeline: DetailEvent[];
  awaitingMyApproval: boolean;
};

export const sampleRows: RequestRow[] = Array.from({ length: 120 }, (_, i) => {
  const product = products[i % products.length];
  const quantity = (product.carton ?? 10) * [30, 20, 15, 10, 25][i % 5];
  const date = i < 23 ? `2026-10-${String(17 - Math.floor(i / 3)).padStart(2, '0')}` : new Date(Date.UTC(2026, 9, 9 - Math.floor((i - 23) / 3))).toISOString().slice(0, 10);
  const applicant = ['林晓', '陈晨', '周宁', '许文'][i % 4];
  const status = (['审批中', '采购复审', '待采购', '已下单', '审批中', '已驳回', '运输中', '已到港', '已上架', '运输中', '已到港', '已驳回'] as Stage[])[i % 12];
  return {
    id: i < 23 ? `CG202610${String(17 - Math.floor(i / 3)).padStart(2, '0')}${String(23 - i).padStart(3, '0')}` : `CG${date.replaceAll('-', '')}${String(120 - i).padStart(3, '0')}`,
    product: product.name, productCode: product.code, color: product.color, carton: product.carton,
    quantity, date,
    purchaseType: i % 5 === 4 ? '海外采购' : '国内采购', stockingType: i % 4 === 3 ? 'FBM' : 'FBA',
    site: i % 4 === 2 ? 'CA' : 'US', stockPath: i % 6 === 5 ? '国内备货' : i % 3 === 1 ? '入FBA仓' : '发海外仓',
    transport: i % 6 === 5 ? '不适用' : i % 3 === 1 ? '快船' : '普通海运',
    applicant, group: ['运营一组', '运营二组'][i % 2], status,
    remark: ['常规补货，优先安排本月出运', '补充安全库存', '', '配合站点活动备货'][i % 4],
    shop: '', asin: '', fnsku: '', msku: '', timeline: seedRequestTimeline(date, applicant, quantity, status),
    awaitingMyApproval: status === '审批中' && i % 12 < 6,
  };
});

export const stageTheme = { 审批中: 'warning', 采购复审: 'primary', 待采购: 'warning', 已下单: 'success', 运输中: 'primary', 已到港: 'primary', 已上架: 'success', 已驳回: 'danger' } as const;
