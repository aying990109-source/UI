import type { RequestRow } from './data';

export const purchaseRouteTitle = '采购方式 / 去向';

type PurchaseRoute = Pick<RequestRow, 'purchaseType' | 'site' | 'stockingType' | 'stockPath' | 'transport'>;

export function PurchaseRouteCell({ row }: { row: PurchaseRoute }) {
  return <div className="cell-stack purchase-route-cell">
    <span className="purchase-route-line">
      <span className="purchase-source" data-type={row.purchaseType}>{row.purchaseType}</span>
      <span className="secondary">{row.site} · <span className="purchase-fulfillment">{row.stockingType}</span></span>
    </span>
    <span className="secondary"><span className="purchase-destination" data-path={row.stockPath}>{row.stockPath}</span> · {row.transport}</span>
  </div>;
}
