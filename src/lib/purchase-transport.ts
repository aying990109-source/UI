export const transportMethods = ['普通海运', '快船', '空运入仓', '其他'] as const;

export function transportMethodLabel(method: string | undefined, stockPath: string) {
  return stockPath === 'domestic_stock' ? '不适用' : method || '未填写';
}
