export type AfterSalesSource = 'operator' | 'purchase_report';
export type StoreAccountState = { shortName?: string; shortNameVersion?: number; accountStatuses: string[]; accountStatusVersion: number; canEditAccountStatus: boolean };
export type StoreAuthorizationSummary = { version?: number; brandId: string; name: string; sid: string; country: string; status: string; authorizedOn: string; brandUsageStatus: string };
export type AfterSalesStore = Partial<StoreAccountState> & { shortName: string; authorizations?: StoreAuthorizationSummary[]; grade?: string; platform: string; sid: string; name: string; country: string; groupId: string | null; departmentId: string | null; groupName?: string; storeIdentityKind?: 'platform' | 'imported'; active: boolean; version: number; registrationSources?: AfterSalesSource[]; createCanFollowUp?: boolean; createCanClose?: boolean };
export type StoreBrandSummary = { counts: Record<string, number>; brands: Record<string, { id: string; name: string }[]> };
