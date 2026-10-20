# Enterprise Operations Workbench

**AI Usage / AI 使用统计**: A user's recorded Business Assistant analysis and model consumption. Recorded Token counts describe known consumption; unknown usage remains explicitly unknown, never a claim of zero cost. An analysis can involve several model calls. Usage ranking compares recorded Token totals for the same period and is not a measure of work performance or a monetary bill.

**Imported Order Record / 导入订单记录**:
An order-master spreadsheet row retained under its stable system order number and saved organization ownership. It is a read-only query source, separate from Lingxing snapshots, after-sales records, and daily shipping work.
_Avoid_: Shipment status, workflow order

**Source Price / 来源价格**:
The unchanged `Price` value from an imported order-master row. Its currency and economic meaning are unknown; do not total it or label it as order revenue or unit price.
_Avoid_: Order total, unit price, net price

**Customer Contact Information / 客户联系资料**:
The imported Address text containing recipient names, phone numbers, or delivery addresses. Order references, shipping notes, and source remarks are ordinary order information, not part of this category.
_Avoid_: Order reference, shipping note, source remark

**Data Query / 数据查询**: The workbench module for order, pricing, and brand queries. Authorized maintainers can import order-master records; lookup results remain read-only.

**Product Pricing / 产品定价**: Shared sales guidance maintained in Middle Data for a product supplier record, sales specification, destination country and source type. Maintainers enter the final landed cost or local dropshipping quote in the destination currency and a pricing multiplier (default 4). Saving makes the guidance effective immediately; purchase archive prices remain reference-only and never automatically change guidance.

**Pricing Query / 定价查询**: Read-only product-name lookup of active sales guidance, with supplier, cost, reference purchase price and multiplier separately masked by sensitive permissions. Zero or missing cost means no quote, not a free sale.

**Sales Order Query / 订单查询**: Search authorized imported order records by platform order number, system order number, product name, reliable current store short name, or original imported store name. A complete Amazon-format number first checks authorized local records exactly by either order number; only an unmatched explicit query can fall back to Lingxing. Imported list rows show source logistics values without customer contact or price; authorized details show source price with unknown currency and customer contact only to separately authorized viewers. Lingxing snapshots retain their existing order amount, currency, product and fulfillment fields and exclude customer addresses and profit.
_Avoid_: Purchase order query, proof of non-shipment inferred from missing logistics data

This context defines the business language for the enterprise operations workbench. It describes the operational concepts the product manages, without committing to implementation details.

## Language

**Requested Transport Method / 申请运输方式**: 一条采购申请为发海外仓或入FBA仓提出的单一运输计划：普通海运、快船、空运入仓或其他。国内备货不适用；历史未填写不代表普通海运，也不代表已实际出运。

**Scheduled Transport Method / 排期运输方式**: 出货排期当前采用的运输安排，初次由采购申请计划带入，后续可由有权限的人员调整。调整排期不覆盖原申请计划。

**Review Suggested Value / 待复审建议值**: 系统提供的供应商或采购单价参考值，不代表本次采购申请已经确认的值。

**Review Current Value / 待复审当前值**: 本次采购申请已经保存的供应商或采购单价；原来未填写时为空。

**Review Modification Value / 待复审修改值**: 用户可填写的本次替换值；空白表示未提出替换。

**Review Clear / 待复审清空**: 用户删除原来非空的当前值，使本次采购申请对应字段变为空。

**Regional Store Brand Authorization / 区域店铺品牌授权**: 同一地区内、店铺简称相同的站点共用的品牌授权，包含品牌、授权状态、授权日期和备注。当前共享地区为美洲的美国、加拿大、墨西哥和巴西；空简称与未定义共享地区的站点独立维护。授权状态与品牌档案自身的使用状态独立。

**Cross-border Data / 跨境数据**: The workbench module grouping 销售数据, 目标管理, and 物品管理. 物品管理 remains a reserved capability name without defined business rules and does not imply the existing Product Master Data capability.

**Sales Data / 销售数据**: The planned capability for querying actual sales amounts by organization group and month. A group's actual sales can be queried independently of whether that group has a sales target.
_Avoid_: Target completion, profit, settlement income, personal performance

**Target Management / 目标管理**: The planned capability for authorized department managers to set organization groups' sales-amount targets and for authorized readers to follow their progress. It uses monthly allocations of a yearly plan and does not itself define personnel performance, bonuses or operational tasks.
_Avoid_: Template management, performance appraisal, OKR

**Group Sales Target / 小组销售额目标**: A group's USD sales requirement for an explicitly covered period, allocated by month and summed for quarters. The original plan remains distinguishable from later authorized adjustments.
_Avoid_: Personal quota, store target, projected sales

**Target Coverage Period / 目标覆盖期**: The months included in a group's sales target and the matching actual-sales comparison; first-year coverage starts with the launch month. Months outside coverage are not zero-target months, and partial-year completion is not full-year completion.
_Avoid_: Full-year completion from partial-year data, missing month as zero

**Actual Sales for Targets / 目标实际销售额**: Lingxing-sourced Amazon sales from actually paid orders, excluding Pending estimates, attributed by the source site's sales-report date and the applicable group ownership, expressed in USD using the sales month's exchange rates. The amount carries its coverage and data cutoff; missing or incomplete data does not mean zero sales.
_Avoid_: Imported Source Price total, settlement income, profit

**Historical Sales Group Snapshot / 历史销售分组快照**: The one-time, fixed assignment of known store SIDs to groups for sales-report dates from 2026-01-01 through 2026-10-08. It is a user-selected attribution rule based on the recorded 2026-10-08 store grouping, not a claim that those groups were observed on each earlier date; later store transfers and source corrections do not rewrite it.
_Avoid_: Historical observation, current-group recalculation

**Sales-date Group Ownership / 销售日期归属**: For sales-report dates from 2026-10-09 onward, the group that owns a store throughout the complete local site day according to the effective ownership record. A local day containing a transfer is unresolved when only daily sales are available.
_Avoid_: Collection-date ownership, current group for all history

**Historical Backfill Inclusion / 历史补采纳入**: A verified Amazon SID's valid paid-sales report in the selected historical backfill range may enter the obtained portion even if the store was registered in the workbench later. This does not prove unsampled dates were zero or that today's active status, platform field, site timezone, or exchange rate applied in the past.
_Avoid_: Registration-date exclusion, current-status backfill

**Obtained Sales Portion / 已取得部分销售额**: The sum of eligible, attributable, exchange-verified daily sales already obtained from the source within the stated group, period, and cutoff. It is not the complete period amount while required dates or evidence remain missing.
_Avoid_: Complete sales amount, zero for missing dates

**Target Revision / 目标调整**: An authorized change to the current or future monthly sales targets, with an explicit yearly-total change when needed and retained original values and reasons. Revising a target is distinct from an upstream correction to actual sales.
_Avoid_: Overwriting the original plan, correcting sales by changing targets

**Link Maintenance / 链接维护**: The workbench module grouping Review直评需求, 运营单需求, and Vine评价计划. Each capability has its own workflow; the module name does not establish external platform actions.

**Vine评价计划**: 申请人在一个归属组为一个店铺、一个 ASIN 发起，经部门指定审批人通过后持续跟踪注册、认领与评论数量的计划。
_Avoid_: Review直评需求、采购复审、评论发布或平台自动注册。

**Vine提报时间**: 审批通过后登记的实际提报日期，也是内部90天跟踪期的起点。
_Avoid_: 申请日期、审批日期、预计提报日期。

**Vine审批状态 / Vine计划状态**: 审批状态表示内部批准流程结果；计划状态表示依据提报日期及最近人工采集数量判断的跟踪阶段。跟踪期第90天仍有效，第91天结束；评论数、认领数和注册数相等时可提前结束。
_Avoid_: 将审批通过等同已提报，将期限结束等同评论已收齐。

**Vine数量采集日期**: 申请人或有权限的管理者实际核对认领数和评论数的日期；未提报的空值表示尚未登记，明确填写的零表示采集结果为零。
_Avoid_: 系统保存时间、实时同步时间。

**Vine新建导入**: 当前申请人将多条新计划统一提交给部门指定审批人的申请方式；新计划均从待审核、未提报开始。
_Avoid_: 历史审批迁移、自动提报、替他人申请。

**Vine进度回导**: 申请人通过导出的计划文件，批量更新本人已提报计划的认领数量、评论数、采集日期和变更原因。
_Avoid_: 新建计划、首次提报、批量管理修正。

**Vine当前筛选结果 / Vine本页全选**: 当前筛选结果包含符合查询条件的所有页；本页全选仅选择当前页显示的记录，翻页或改变查询条件即清空。
_Avoid_: 将当前页等同全部结果、跨页保持勾选。

**运营单需求**: 运营提交、部门经理审批、资源部办理的申请，原称“运营S单需求”。排单日期是期望排期，价格是美元商品售价。
_Avoid_: 在当前界面继续使用旧名称；将审核通过、资源部编码或显示结果称作订单完成。

**运营单内容要求 / 运营单显示结果**: review 与 feedback 内容要求由运营分别填写；两项显示结果由资源部分别记录，可以使用“已显示 / 未显示”或其他实际结果。未回填与“未显示”含义不同。

**Review Direct Request / Review直评需求**: An operator's request for one store and one ASIN, submitted to the designated department approver and then handled by authorized resource staff. Returned requests retain their identity and history when edited and resubmitted.
_Avoid_: Purchase review, Vine plan, external review publication

**Review Approval / 直评需求审核**: The designated department approver's acceptance or return of a direct review request, separate from its display status. Applicants cannot approve their own requests.
_Avoid_: Platform moderation, resource processing result

**Review Display Status / 评价显示情况**: The manually recorded current state of a requested review: not displayed, displayed, or removed. It is independent of approval and does not establish platform verification.
_Avoid_: Approval status, permanently completed

**Actual Review Posted Date / 实际上评日期**: The recorded date a review was actually posted, blank until posting is recorded and retained when the review is removed. It is not a planned date or proof that the review is displayed.
_Avoid_: Application date, planned posting date

**Calendar Market / 日历国家**: The country where an event applies: US (美国), CA (加拿大), MX (墨西哥), or CN (中国). China currently covers mainland nationwide holiday arrangements; North American platform events and local holiday applicability retain their existing scope.

**China Holiday Arrangement / 中国放假安排**: A published mainland nationwide holiday interval, distinct from an individual festival date and from adjusted working days. Adjusted working days are described alongside the holiday and do not count as days off.

**Calendar Platform / 日历平台**: Amazon, Walmart, or eBay for platform events; general for public holidays and cross-platform shopping occasions. A shared event name does not imply identical dates across countries or platforms.

**Enterprise Operations Workbench**:
An internal workbench for daily operational work, centered on requests, approvals, operational handoffs, and shared business data.
_Avoid_: ERP, internal management platform, enterprise system

**Workbench Shell**:
The shared application frame that gives users navigation, identity context, module entry points, announcements, and task access.
_Avoid_: Layout, dashboard wrapper, homepage

**Module Navigation**:
The ordered set of first-level workbench modules shown to users. Its order is configurable rather than a permanent product hierarchy.
_Avoid_: Hard-coded menu, fixed sidebar

**Workbench Alert**:
An important reminder shown on the default workbench view. First-phase alerts come from operational work, and future inventory monitoring alerts should also surface here.
_Avoid_: Announcement, notification, banner

**Operations Flow**:
A request-driven operational workflow started by an operator, approved by a department lead, and completed by another responsible team or role.
_Avoid_: Process center, workflow module, approval table

**Operations Flow Module**:
The workbench module for operational flows. In the first phase it owns purchase requests and replenishment requests, and only exposes a placeholder entry for listing requests.
_Avoid_: Process center, workflow center

**Operations Flow Reference Pattern**:
The first-phase business pattern established by purchase requests and replenishment requests for later workflow modules: users create or import requests, filter and select visible records, export permitted records, inspect details in a modal, and move work through approval, execution, and completion according to role permissions.
_Avoid_: One-off purchase screen, copied table, generic CRUD pattern

**Flow Import Template**:
A downloadable CSV template for importing one type of operations flow.
_Avoid_: Spreadsheet example, upload file

**Flow Import**:
A CSV-based batch creation path for operations flow records. Successful rows are submitted into approval immediately, while failed rows are rejected with row-level error reasons.
_Avoid_: Upload, spreadsheet sync, draft import

**Flow Reimport Update**:
A batch update path where previously exported operations flow records are edited outside the workbench and reimported against stable record identifiers, applying the same permissions and lifecycle rules as in-workbench edits.
_Avoid_: Recreate from export, spreadsheet overwrite

**Flow Export**:
A CSV export of operations flow records visible to the current user under their permissions, narrowed by the current tab, current filters, and selected rows when row selection is used.
_Avoid_: Download, report export

**Flow Overview**:
The operations-flow view of important alerts, queue summaries, and recent flow records. It covers work waiting for the current user to approve, work started by the current user, and work waiting for the current user to execute; it is narrower than the cross-module Workbench Home.
_Avoid_: Dashboard, homepage, personal center, task list

**Workbench Home / 工作台首页**:
The personal daily-work entry of the Enterprise Operations Workbench, combining personal tasks, business work items, team work queues, and the US Commerce Calendar according to the current user's permissions and interests.
_Avoid_: Flow Overview as the whole home, company-wide management dashboard

**Personal Task / 个人待办**:
A task owned and maintained by one person, created manually or by accepting a Preparation Suggestion. Completing it does not complete any linked business workflow.
_Avoid_: Assigned team work, approval record

**Personal Task Scheduled Date / 个人待办安排日期**:
The planned completion date to which a personal task belongs in the calendar and against which its due status is assessed, required for new tasks. Completion does not move the task to its actual completion date; legacy tasks without a date remain accessible as unscheduled items.
_Avoid_: Creation date, actual completion date, separate planning date

**Completed Personal Task / 已完成个人待办**:
The original personal task marked complete, retained under its scheduled date or in unscheduled items. It must be reopened before its contents can be edited; it is not a separate archive record.
_Avoid_: Retained copy, archive task, completed business workflow

**Business Work Item / 业务待办**:
An actionable step in an existing business workflow with an explicit current responsibility. Its availability and completion follow the source workflow rather than a separate personal checklist.
_Avoid_: Every visible record, every record I created

**Team Work Queue / 团队待处理**:
Work the current user is authorized to handle within a shared scope but which has no explicit individual owner. It is displayed separately from personal work counts.
_Avoid_: My assigned tasks, company-wide total

**US Commerce Calendar / 美国电商日历**:
A shared calendar of US holidays, consumer occasions, Amazon US events, and their publicly documented preparation deadlines. Confirmed facts, unannounced dates, and preparation suggestions have distinct meanings.
_Avoid_: Predicted dates as official deadlines, store-specific eligibility inferred from public events

**Preparation Suggestion / 准备建议**:
An optional action associated with an event a person follows, with a reason and applicability conditions. It becomes a Personal Task only when that person accepts it.
_Avoid_: Mandatory AI task, confirmed business obligation

**Calendar Maintainer / 日历维护人员**:
A person explicitly authorized to correct, supplement, hide, and review shared commerce-calendar information. This responsibility is separate from ordinary event following.
_Avoid_: Every user, administrator by title alone

**Flow Status**:
The shared lifecycle state for operations flows. Flow types share the same base states, while each flow may show domain-specific node labels.
_Avoid_: Per-table status, custom status text

**Operator**:
A user who creates operational requests and tracks the requests they started.
_Avoid_: Applicant, requester, creator

**Department Lead / 部门经理**:
A designated department manager who belongs directly to a department and reviews its groups' purchase and replenishment requests within their granted permissions. When personally creating a request, they select its owning group within a managed department; their own requests require another designated approver. Explicit group-lead duties remain a separate responsibility.
_Avoid_: Approver, manager, reviewer

**Group Lead / 组长**:
The designated person responsible for an organization group, who can maintain that group's business records within their lifecycle rules. Group leadership does not add an approval step before the department manager.
_Avoid_: Department Lead, role name as proof of responsibility

**Permission Role / 权限角色**:
A named, configurable set of workbench capabilities and their data scopes assigned to people. A person may hold multiple permission roles; job title and organization leadership are separate facts.
_Avoid_: Job title, fixed user category, administrator bypass

**Grant Scope / 授权范围**:
The set of business records to which a specific granted capability applies, such as a person's own records, their group, their managed department, or company-wide records. A read scope does not automatically apply to editing or sensitive fields.
_Avoid_: Global user scope, menu visibility

**Functional Permission / 功能权限**:
A role's permission to view or edit one workbench function, normally represented by a functional tab. Editing includes that function's existing write operations while preserving workflow responsibilities and record-state restrictions.
_Avoid_: One permission per button, tab visibility as authorization

**Sensitive Information Permission / 敏感信息权限**:
A role's permission to view a named category of sensitive information across workbench functions. It reveals that information only within records the person is already authorized to view; it grants neither function access nor editing rights.
_Avoid_: All-company data access, a separate field permission for every tab

**Status Filter / 状态筛选**:
A view of the same function's records filtered by lifecycle state, such as pending or completed. A status filter does not represent a separate functional permission.
_Avoid_: Independent permission merely because it looks like a tab

**Business Record Ownership / 业务记录归属**:
The group and department responsible for a business record when it is created, preserved when its creator moves to another group. A department manager's selected owning group does not change the manager's personnel affiliation or the record's applicant.
_Avoid_: Creator's current group, moving history with an employee

**Executor**:
A user or role responsible for completing the post-approval work in an operations flow when that flow has an execution step.
_Avoid_: Handler, processor, assignee

**Executor Role**:
The role expected to execute a flow after approval. Purchase and replenishment requests use the purchaser role in the first phase, but the model keeps the executor role explicit for future flow types.
_Avoid_: Hard-coded purchaser, fixed handler

**Purchaser**:
A type of executor responsible for approved purchase and replenishment requests.
_Avoid_: Buyer, purchase handler, procurement staff

**Product Data Center**:
The business area that owns product master data shared by operations and purchasing.
_Avoid_: Local product data, product table, process products

**Product Master Data**:
The stable identity and shared facts of one specified product, including its name, model, specification, color, main image, and declaration profile. A matching name alone does not establish that two products are the same.

Product archive carton quantity (装箱数（件/箱）) means units per outer carton. `carton_quantity` and the legacy `packing_quantity` alias must agree. Existing archives are normalized using the old packing quantity when positive, falling back to carton quantity. New purchase checks and shipment snapshots start from this value; historical transaction snapshots remain independent and unchanged.

Product customs code (海关编码 / `hs_code`) is optional digit text preserving leading zeros. It is copied through new purchase and shipping snapshots, never inferred from a product name. A later archive edit does not rewrite existing shipment declarations.
_Avoid_: Product sample data, product fields

**Product Supplier Record**:
A supply record for one product master, supplier purchasing profile, and supply country. It holds that source's packing, purchase unit, price, and ordering facts; multiple records can share one product master.
_Avoid_: Product name record, supplier quotation row, duplicate product

**Supplier Entity / 供应商主体**:
The identity of one purchasing partner across its supported domestic and overseas purchasing profiles. Similar names alone do not prove two profiles belong to the same entity.

**Supplier Purchasing Profile / 供应商采购资料**:
The contact, settlement, supported sales sites, and status of a supplier entity for one purchasing method.

**Supply Country / 供货国家**:
The country in which a supply source is procured. It is separate from the sales destination site; unknown legacy overseas locations remain unknown until confirmed.

**Product Import**:
A batch maintenance path for product master data using tabular files, including product main images when supported. Rows with new product name, supplier, and purchase type combinations create products, while matching combinations update existing products and report which rows were created or updated.
_Avoid_: Product upload, spreadsheet sync

**Product Main Image / 产品主图**:
The identifying image shared by one product master. Existing supplier-specific images can remain attached to their supply records when they depict packaging or other source differences.
_Avoid_: Image note as image

**Product Name**:
The operator-facing product identifier used when creating purchase requests. Product name is not globally unique in master data because the same name may be purchased from different suppliers.
_Avoid_: Product ID, product code

**Product Name Selection**:
The operator-facing way to choose product master data by fuzzy searching product names, while saving the exact selected product name on the request.
_Avoid_: Free text product entry, fuzzy saved value

**Product Color**:
A product master attribute snapshotted onto operations flow records at request creation.
_Avoid_: Optional color note, display-only color

**Product Model**:
The outbound and declaration-facing model value carried from Product Master Data through purchase requests, purchase assignments, purchase order lines, shipping schedule lines, and inventory shipping data.
_Avoid_: Mixing model into product name

**Declaration Category**:
The product archive category used to support customs declaration wording, such as toner cartridge, drum unit, ink cartridge, or ink.
_Avoid_: Freeform shipping note

**Declaration Name**:
The independent declaration wording saved on Product Master Data and carried into inventory shipping export fields. English and Chinese declaration names are stored separately and can be corrected manually.
_Avoid_: Always regenerated code, derived-only declaration text

**Product Declaration Profile / 产品申报资料**:
The product master's shared customs and tax wording, HS code, USD reference price, brand, material, and intended use. New business snapshots take the current profile; issued documents keep their own snapshot, and missing values remain missing.
_Avoid_: Carrier-specific form values, inferred material or brand, a live replacement for an issued document

**System Carton Quantity**:
The trustworthy units per carton snapshotted from the selected product supplier record when a purchase request is created. It remains a source reference in Purchase Processing even if the purchaser later adjusts the execution carton quantity; when no trustworthy carton quantity was available at submission, the source value remains unknown.
_Avoid_: Current packing basis, editable purchase carton quantity

**Purchase Request Supplier Basis / 采购申请供应商依据**:
The supply record selected for a new request by the latest valid ordering time. With no valid ordering time, a lowest positive price is usable only when all candidates have known, identical currency, purchase unit, and price basis; otherwise purchasing must confirm the source. This submission-time basis remains distinct from a supplier later chosen by purchasing.
_Avoid_: Product edit time, live supplier recommendation, confirmed purchase supplier

**Execution Carton Quantity**:
The purchaser-maintained carton quantity used for the current purchase execution, Purchase Summary grouping, quantity abnormal checks, Purchase Order generation, and packing-list export. It defaults from system carton quantity and may differ when supplier packaging changes.
_Avoid_: Product master carton quantity, display-only carton quantity

**Latest Order Unit Price**:
The product supplier record price updated from purchaser-confirmed quotation when purchase ordering is generated or corrected. Product data maintainers may edit it as an initial value or correction, but purchaser ordering facts can refresh it.
_Avoid_: Static purchase price, operator price

**Latest Order Time**:
The product supplier record timestamp updated from purchaser-confirmed ordering time.
_Avoid_: Created time, request date

**Product Code**:
A possible future stable internal identifier for product master data, not part of the first-phase product model.
_Avoid_: SKU, ASIN, product name

**Purchase Request**:
An operations flow where an operator asks purchasing to procure product quantity after department lead approval.
_Avoid_: Purchase row, procurement form

**Original Request Quantity / 原申请数量**: The quantity saved on the purchase application before purchaser planning. It is the recorded application fact, not a reconstructed first-submission value when earlier edits were not retained.
_Avoid_: Current purchase quantity, ordered quantity

**Current Purchase Quantity / 当前采购量**: The latest saved quantity for this request: the source assignment plan when present, otherwise a saved review plan, otherwise the application quantity. A pending review still displays the saved plan. Rejected, withdrawn, non-purchase and cancelled records retain the fact for history without contributing effective demand.
_Avoid_: Original request quantity, combined order-line quantity, physically fulfilled quantity

**Effective Ordered Quantity / 有效已下单量**: The quantity of this request attached to a non-cancelled purchase order. It is separate from shipments, shelving and available inventory.
_Avoid_: Combined order-line total, physical fulfillment

**Purchase Lifecycle**:
The purchaser-side lifecycle of a purchase request from operator submission through approval, purchase processing, order generation, and the final purchaser-owned receipt or shelving outcome.
_Avoid_: Procurement-only flow, replenishment lifecycle, inventory consumption lifecycle

**Purchase Processing**:
The purchaser-owned work after department approval that reviews purchase requests, resolves missing purchasing data, aggregates demand, and generates purchase orders.
_Avoid_: Purchase request completion, procurement table

**Purchase Assignment**:
A purchaser-side allocation of one approved purchase request into final pre-order purchasing facts such as supplier, stock path, expected delivery date, and planned purchase quantity.
_Avoid_: Purchase request, purchase order line, summary row

**Purchase Summary**:
A purchaser-facing grouped view of unlocked purchase assignments, organized by purchase type and supplier, then product name, then source request detail.
_Avoid_: Stored summary table, purchase order, purchase request list

**Purchase Summary Batch**:
A locked internal snapshot of one selected purchase summary at the moment it generates a purchase order.
_Avoid_: Live summary, purchase order, export batch

**Purchase Order**:
A supplier-facing order generated from one purchase summary batch for one purchase type and supplier.
_Avoid_: Purchase summary, purchase request, supplier draft

**Contract Number**:
The purchaser-facing display name for the generated purchase order number. New contract numbers use the pattern `PO` + six-digit order date + purchaser letter + company-wide monthly sequence, such as `PO260831Z070`.
_Avoid_: Purchase order number, purchasing code

**Purchase Order Line**:
A product-level fulfillment line inside a purchase order, grouped by product name, stock path, and expected delivery date.
_Avoid_: Purchase assignment, purchase request, summary line

**Purchase Company**:
The purchasing legal or operating entity shown as the buyer on purchase orders and downstream planning documents.
_Avoid_: Purchase header, purchase title, purchasing subject

**Purchase Company Receiving Method / 采购方收货方式**:
采购方档案中自由填写的通常收货安排，例如送货上门或自提。它不表示某张采购单已收货，也不替代采购申请或出货排期的运输方式。
_Avoid_: 实际收货状态、申请运输方式

**Organization Group**:
A smaller operating group within a department, used when work routing or downstream planning depends on the operator's group rather than only the department.
_Avoid_: Team note, informal group label

**Sales Channel**:
The demand channel associated with an organization group when that channel changes purchasing or shipping planning behavior.
_Avoid_: Store type, channel remark, request tag

**ERP Store**:
An external commerce or operations-system store identifier captured on purchase and replenishment demand. It is source-system business data and does not name the Enterprise Operations Workbench itself.
_Avoid_: Workbench store, internal ERP module, sales channel

**Order Processing Module**:
The workbench module for platform sales-order work, starting with daily order shipping and order lookup views. It is separate from Purchase Processing and Logistics Order because it starts from customer/platform orders rather than purchasing or outbound logistics preparation.
_Avoid_: Reusing purchase order, logistics order, or operations flow language for customer/platform orders

**Platform Sales Order**:
A customer order imported from an external commerce platform such as Amazon, carrying platform order id, store, fulfillment channel, order status, item SKU facts, order time, and related fulfillment flags.
_Avoid_: Purchase Order, Logistics Order, Operations Flow

**After-sales Record / 售后记录**:
A record tracking one independent customer issue concerning a platform sales order, from registration through follow-up to closure. Separate issues on the same order have separate records; the issue reason and handling method are distinct facts.
_Avoid_: One after-sales record per order, platform order status as after-sales status

**After-sales Import / 售后导入**:
A file-based registration or update of after-sales facts, including the current handling results and completion state, with one product name per input row. It is distinct from importing sales orders and does not itself execute a refund or create a reshipment application.
_Avoid_: Order-master import, reconstruction of every historical follow-up, automatic fulfillment

**After-sales Import Match / 售后导入匹配**:
The correspondence between an imported row and an existing after-sales record using its platform order number, resolved store identity, and product name. This correspondence supports a guarded update; it does not make those three values a permanent unique identity for all customer issues.
_Avoid_: Model or MSKU as an import fallback, store display name as unique identity, merging separate historical issues

**After-sales Registration Source / 售后登记来源**:
Whether an after-sales record was registered by operations or reported by purchasing for a logistics exception. Purchaser-reported records belong to the order's responsible group and can be handled directly by its authorized operators, with each action attributed to its actual actor.
_Avoid_: Creator's current role as historical source, purchaser's group as the order's owner, mandatory claim or assigned handler

**After-sales Issue Reason / 售后问题原因**:
The reported problem that prompted an after-sales record, such as damage, non-delivery, or a product defect. It remains distinct from the actions taken to resolve the problem.
Customer-reported requests such as a return or claim, and negative reviews, may be recorded as issue reasons; selecting one does not mean a return or claim was processed.
_Avoid_: Refund or reshipment as a problem reason

**After-sales Handling Method / 售后处理方式**:
An action taken to address an after-sales issue, such as refund, return, exchange, reshipment, or resolution through communication. One record may combine compatible handling methods and records their actual results without itself executing payments or inventory movements.
_Avoid_: Platform order status, payment instruction, inventory operation

**Reshipment Record / 补发记录**:
A record of one reshipment application, created directly or initiated from and linked to an After-sales Record, covering the goods to resend and their parcel relationships. One after-sales record may have multiple independent reshipments, each containing multiple product lines and parcels.
_Avoid_: One record per original order or after-sales record, one parcel per reshipment, inventory replenishment request

**Reshipment System Order Number / 补发系统单号**:
The order number assigned to a reshipment order created in an external system such as Lingxing. It is distinct from the original customer order number, the workbench's internal record identifier, and a parcel's tracking number.
_Avoid_: Workbench-generated record number, original order number, tracking number

**Reshipment Handler / 补发处理人**:
The person who actually carried out a reshipment, who may differ from the person entering the record. If omitted when importing shipping information, the importing person is recorded provisionally until corrected; an explicitly supplied handler takes precedence.
_Avoid_: Assigned owner, creator by default, last editor

**Reshipment Date / 补发日期**:
The date a reshipment parcel was actually handed over for transport. If omitted when importing shipping information, the import submission date is recorded provisionally until corrected; an explicitly supplied dispatch date takes precedence.
_Avoid_: Planned shipping date, record creation date, inferred dispatch from a tracking number

**Reshipment Shipping Channel / 补发发货渠道**:
The manually entered shipping-channel text for a reshipment parcel. It is not restricted to preset options or automatically populated from the original order or an external service.
_Avoid_: Required carrier-catalog selection, inferred FBA/FBM value, automatic channel lookup

**Overseas Warehouse Destination**:
The overseas warehouse or destination bucket used to plan outbound shipping for purchased goods.
_Avoid_: Warehouse text, shipping note, destination column

**Warehouse Archive**:
The purchase data archive for overseas warehouse destinations, including warehouse name, region, address, site, purpose type, status, display order, and remark.
_Avoid_: Ad hoc warehouse text, duplicated destination list

**Destination Warehouse Address**:
The address stored on the Warehouse Archive and carried into shipping schedule and inventory shipping data for outbound document preparation.
_Avoid_: Re-entered FBA address, shipment-only address when the destination is known

**Shipping Schedule**:
The purchaser-owned plan for assigning ordered goods to overseas warehouse destinations, pickup warehouses, planned ship dates, and transport methods before logistics fulfillment begins.
_Avoid_: Shipment, logistics tracking, warehouse arrival

**Shipping Schedule Line**:
A planned outbound allocation for part or all of one purchase order line.
_Avoid_: Purchase order line, shipment line, fulfillment record

**Shipping Preparation / 出货核对资料**:
A supplier-specific collection of goods selected for an outbound shipment, grouped by destination warehouse and checked against supplier feedback. Selected goods may come from different planned departure dates and retain their original purchase-demand attribution.
_Avoid_: Shipping inquiry batch, quotation comparison, instruction to dispatch

**Supplier Packing List / 出货型号表（表1）**:
The supplier-facing document listing models, quantities, carton packing, weights, dimensions, and purchase order numbers for checking outbound goods. One supplier's document may contain separate destination-warehouse sections.
_Avoid_: Carrier order form, dispatch notification, quotation

**Confirmed Shipping Portion / 已确认出货部分**:
The quantity within a supplier's outbound goods whose shipment and packaging details have been checked. The rest may remain awaiting verification or be explicitly released from the current shipment.
_Avoid_: Entire row completed, stock received, goods already dispatched

**Shipping Source Allocation / 出货来源分配**:
The quantity of a confirmed schedule's source purchase demand reserved for supplier checking and subsequently attributed to carrier orders. Whole-carton splits preserve the original purchase-request attribution and the remaining unassigned quantity.
_Avoid_: Copying a purchase request, duplicating a shipment, independent stock balance

**Logistics Carrier / 物流商**:
An external partner that undertakes shipment execution. Its cooperation status governs new business, not the continued fulfillment of existing logistics orders.
_Avoid_: Supplier, transport method, warehouse

**Carrier Order Template / 物流商下单模板**:
A carrier-specific form for placing formal logistics orders, distinct from the supplier packing list. A carrier may provide multiple forms for different shipping arrangements.
_Avoid_: Inquiry template, quotation, tracking receipt

**Carrier Order Template Version / 下单模板版本**:
A specific edition of a carrier's order form together with its agreed filling rules. Existing logistics orders retain their edition unless an eligible order is explicitly switched.
_Avoid_: Latest template, overwritten attachment

**Carrier Template Mapping / 下单模板字段映射**:
The reviewed, version-bound relationship between cells in a carrier's form and product, shipment, or current-order information. Unrecognized cells need a deliberate decision before the version can be used.
_Avoid_: Executable upload script, carrier-name-specific filling code, an unreviewed suggestion

**Logistics Order Supplement / 本单物流补充资料**:
Information needed by a particular carrier order, such as channel, recipient, reference identifiers, declaration currency, and service choices. It may be suggested from reliable existing records but is confirmed and saved on this order.
_Avoid_: Automatically complete product archive, a default copied from an example form

**Carrier Dispatch Order / 物流单**:
An arrangement covering selected confirmed goods for one destination warehouse, one carrier, and one transport method. It can include multiple suppliers, has its own continuous carton numbering, and is accepted when the carrier returns its single tracking number covering all cartons.
_Avoid_: Supplier packing list, purchase order, proof of transit

**Carrier Order Form / 物流商下单表（表2）**:
The carrier-facing document prepared from a logistics order using the selected carrier template, with shipment and declaration information. Sending the document and receiving the carrier's tracking number are distinct business facts.
_Avoid_: Second independently entered packing list, carrier acceptance merely on export

**Carrier Carton Number / 物流商箱序号**:
A carton number scoped to one logistics order, starting from one and continuing across its supplier groups. The same number in another logistics order identifies a different carton.
_Avoid_: Packing-list row number, global carton number, supplier-local numbering within a combined order

**Pickup Warehouse**:
The supplier-side or pickup location name used by purchasing when arranging outbound shipping.
_Avoid_: Domestic warehouse, overseas warehouse, supplier only

**Transport Method**:
The planned shipping method for a shipping schedule line, such as ordinary sea freight, fast sea freight, or air inbound.
_Avoid_: Logistics status, carrier, route

**Schedule Reimport**:
A batch update path where exported shipping schedule rows are edited outside the workbench and reimported by stable identifiers under the same schedule rules.
_Avoid_: Spreadsheet sync, delete-by-export, manual overwrite

**Purchase Stock Check**:
The purchaser-facing assessment that uses inventory data to decide whether an approved purchase request still needs purchasing before it enters purchase aggregation.
_Avoid_: Manual review only, approval status

**Stock Path**:
The purchaser-owned destination path for ordered goods, such as sending goods to an overseas warehouse or receiving them into domestic storage.
“入FBA仓” means the supplier sends the purchased goods directly to Amazon FBA, without passing through domestic storage or the workbench's overseas warehouse flow. It does not by itself confirm FBA receipt.
_Avoid_: Purchase type, stocking type, shipping note

**Default Stock Path**:
The product master data value used to initialize a purchase assignment's stock path before purchaser adjustment.
_Avoid_: Fixed warehouse, purchase type default

**Expected Delivery Date**:
The purchaser-maintained expected supplier delivery date for a purchase assignment or purchase order line.
_Avoid_: Request date, order date, arrival status

**Domestic Purchase Dispatch**:
A purchaser-owned record of goods actually sent from a supplier toward domestic storage, allocated to the original purchase requests. Confirmed quantities feed replenishment allowance and inventory transit; drafts and voided records do not. Distinct from dispatching replenishment goods toward Amazon FBA.
_Avoid_: Replenishment source registration, domestic warehouse receipt, FBA dispatch

**Domestic Warehouse Receipt**:
The final purchaser-side outcome for ordered goods whose stock path is domestic storage.
_Avoid_: Purchase completion, replenishment receipt

**Overseas Warehouse Shelving**:
The quantity of goods physically placed in an overseas warehouse for a specific purchase source and carrier allocation. A permitted operator confirms the quantity, actual Shanghai business date, warehouse and actor in the carrier workflow; partial confirmations are allowed. This confirmed fact feeds purchase progress, inventory and warehouse outbound turnover. A historical logistics mark alone does not establish the physical quantity or date.
_Avoid_: Replenishment completion, inventory consumption

**Logistics Tracking Entry**:
A purchase-request timeline summary of one associated carrier order, showing its latest reported logistics text, interpreted stage and covered quantity. Updates belong to the same tracking entry; different carrier orders remain distinct.
_Avoid_: Repeated progress messages, fulfillment completion

**Carrier Logistics Report / 物流状态原文**:
The carrier's logistics description matched offline to a carrier and tracking number, preserved as reported rather than replaced by a standardized label.
_Avoid_: Verified arrival proof, purchase completion status

**First-Leg Logistics Stage / 本段物流节点**:
A summary of progress: awaiting departure, in transit, arrived at destination port, plus legacy manually marked shelved entries. Recording a waybill initializes in-transit progress without proving physical departure. Legacy shelved marks preserve their original logistics meaning and are shown as awaiting physical inventory reconciliation. New physical shelving is confirmed per purchase source and carrier allocation with quantity, actual date and warehouse; it drives the purchase request's partial or full shelving progress and inventory. Carrier text recognition remains limited to the first three stages.
_Avoid_: Carrier order processing status, warehouse fulfillment status

**Carrier Preparation Number / 备货单号**:
A single manually entered reference number on a carrier order. It does not link to another document and does not affect the generated carrier file.
_Avoid_: Purchase request number, carrier order number, waybill number

**Carrier Status Recognition Rule / 物流状态识别规则**:
A carrier-specific vocabulary of matching and excluding phrases that maps reported logistics text to a first-leg logistics stage. Unclear reports remain identifiable as needing attention rather than proving further progress.
_Avoid_: Universal keyword guess, automatic fulfillment decision

**Purchase Correction**:
A permission-controlled correction to a locked or already effective purchase order line fact, recorded with old value, new value, reason, and actor.
_Avoid_: Ordinary edit, silent update

**Purchase Order Cancellation**:
A controlled cancellation of a purchase order that has not entered later fulfillment, preserving the original summary batch and returning its assignments to unlocked purchase processing.
_Avoid_: Delete order, remove summary

**Replenishment Consumption**:
Use of purchased goods by replenishment or customer-order activity, distinct from purchaser-side procurement fulfillment. A replenishment request may reserve its allowance while the original goods are still in transit to a warehouse.
_Avoid_: Purchase lifecycle, purchase completion

**Replenishment Request**:
An operations flow where an operator references a purchase code to request goods from domestic or overseas warehouses for Amazon FBA. Purchasing records dispatch after approval. The request completes when all non-cancelled quantities have been dispatched; completion does not mean Amazon has received or shelved them.
_Avoid_: Restock row, replenishment form

**Replenishment Reimport Update / 补货申请回导更新**:
A Flow Reimport Update of a pending-approval replenishment request that preserves its source purchase, owning group and cross-group relationship. An actual change returns the request to approval under the applicable source-authorization and replenishment-allowance rules.
_Avoid_: Recreating an exported request, changing dispatch facts, retaining approval of changed request data

**Eligible Purchase Code**:
A normal purchase code whose goods have entered transit to a domestic or overseas warehouse or reached a later stage, with remaining replenishment allowance and the required source-group authorization. Eligibility is quantity-specific and does not establish that the goods are currently available for warehouse dispatch.
_Avoid_: Approved purchase code, selectable purchase code, completed purchase code

**Replenishment Allowance / 补货申请额度**:
The quantity of eligible source-purchase goods remaining after active replenishment reservations and dispatched consumption, adjusted for confirmed reusable returns. It measures permission to request goods rather than real-time warehouse stock.
_Avoid_: Warehouse inventory, on-hand quantity, FBA stock

**Cross-Group Replenishment / 跨组调货**:
A replenishment request using another organization group's purchase goods while retaining the original purchase attribution. The agreed process confirms source authorization first, reserving allowance, then obtains requesting-department approval; the source group leader handles confirmation, or its department manager when no group leader is configured. These are separate decisions even when assigned to the same person.
_Avoid_: Company-wide unrestricted stock, new purchase, duplicated source quantity

**Replenishment Source Confirmation / 补货货源确认**:
Authorization to use the specified source purchase quantity for a cross-group replenishment request. It establishes the source party's consent and the associated allowance reservation, not warehouse receipt or readiness to dispatch.
_Avoid_: Goods received, warehouse stock verification, dispatch confirmation

**Replenishment Dispatch / 补货发货**:
A purchaser-recorded dispatch of specified replenishment quantities from a warehouse toward Amazon FBA, attributed directly to its source request. Dispatch consumes reserved allowance; dispatching all non-cancelled quantities completes the request.
_Avoid_: FBA receipt, FBA shelving

**Replenishment Processing / 补货处理**:
A purchaser-only workbench area for stock-lock confirmation, offline label receipt, dispatch registration and undispatched cancellation after replenishment approval. Its progress is shared with the operator's original request; label receipt is distinct from actual dispatch.
_Avoid_: Automatic Lingxing integration, independent replenishment inventory, FBA receiving workflow


**Listing Request**:
An operations flow where an operator asks for product listing work. It completes when the department lead approves and returns a unique EAN code to the operator.
_Avoid_: Listing application, shelf request

**Listing Brand Name**:
The brand name filled after a Listing Request receives an EAN Code and returned with that code for later identification.
_Avoid_: Brand inferred from title, product-name prefix

**Disabled Listing Entry**:
The first-phase navigation affordance for listing requests, shown as unavailable with explanatory hover text until the full listing flow is built.
_Avoid_: Listing tab, listing placeholder

**EAN Code Pool**:
The controlled set of unique EAN codes supplied by authorized maintainers and issued during listing request approval.
_Avoid_: EAN list, code inventory

**Middle Data Module**:
The first-level workbench area for shared business data used by multiple workflows. Its first data area is the EAN Code Pool, presented as a second-level tab.
_Avoid_: Basic Configuration, System Settings, workflow records

**Permission Point**:
A named workbench capability combined with a data scope in a permission role. It expresses a specific action or sensitive-field access independently of a person's job title.
_Avoid_: Extra role, admin flag

**EAN Code**:
A unique code issued from the EAN code pool during listing request approval.
_Avoid_: Listing code, product code

**EAN Code Status**:
The lifecycle state of an EAN code in the code pool: available, issued, or disabled.
_Avoid_: EAN approval status, code stage

**Role Simulation**:
A development-only tool for switching the current user's identity globally across an isolated workbench test environment. Production identity comes from the signed-in account.
_Avoid_: Per-page role switcher, fake permission

**Organization Foundation**:
The minimal people and organization data needed for permissions and approvals: users, departments, roles, and department lead relationships.
_Avoid_: Organization HR, employee archive, personnel module

**Personal Profile / 个人资料**:
An employee's own contact and employment information, maintained by administrators and viewed by the employee. Job title describes their position at work and does not grant a workbench role or permission.
_Avoid_: Flow Overview, account security settings, full personnel archive

**Team Affiliation / 所属团队**:
An employee's department and, when assigned, organization group within that department.
_Avoid_: Independent project team, arbitrary multi-level organization path

**Basic Configuration**:
The workbench area for organization foundation, role relationships, permission points, and module navigation configuration. Shared business data such as the EAN Code Pool belongs in the Middle Data Module.
_Avoid_: System settings, admin panel, foundation module

**System Settings**:
The reserved workbench area for later system-level settings. In the first phase it is only a navigation entry.
_Avoid_: Basic configuration, operations settings

**Inventory Monitoring**:
A future first-level module for stock risk details whose important alerts also appear on the workbench default view.
_Avoid_: Inventory dashboard, stock reminders

**Inventory Details / 库存明细**:
The read-only view of uncommitted supply from currently effective, authorized purchase sources, grouped first by exactly matching product name and then by owning organization group when the viewer's scope spans groups. Each purchase source retains its own specification and identity beneath the summary.
_Avoid_: Warehouse physical stock, replenishment allowance, interchangeable goods inferred from a shared name

**30-Day Warehouse Outbound Turnover / 近30日仓内出库周转率**:
Net replenishment dispatches less confirmed usable returns over the latest 30 complete Shanghai calendar days, divided by the average daily closing warehouse stock of the same effective purchase sources. Warehouse stock includes reserved but unshipped goods; an unknown history or contradictory stock is unavailable rather than zero, and a net return can make turnover negative.
_Avoid_: Terminal sales turnover, company-wide historical turnover, average of source rates

**Pending Shipment Quantity / 待出货**:
Effective ordered goods not yet recorded as entering transport to domestic or overseas storage. Included in inventory details but not eligible for replenishment reservation.
_Avoid_: Purchase requested quantity, warehouse availability

**Unreserved In-Transit Inventory / 未占用在途库存**:
Goods recorded in transport toward domestic or overseas storage, less recorded shelving and effective replenishment reservations allocated to transit after warehouse stock. Excludes shipments toward FBA.
_Avoid_: Gross transported quantity, FBA in-transit stock

**Available Inventory / 可用库存**:
Recorded shelved stock remaining after dispatch consumption, confirmed reusable returns, and effective replenishment reservations; reservations use shelved stock before in-transit goods within the same purchase source.
_Avoid_: Replenishment allowance, physical on-hand stock

**Inventory Details Total / 库存明细合计**:
The sum of pending shipment, unreserved in-transit and available quantities. Cross-group replenishment reduces the original purchase group's supply without creating inventory for the requesting group.
_Avoid_: Warehouse stock total, inventory valuation

**AI Access Boundary**:
The rule that AI can only read and act on data the current user is allowed to access.
_Avoid_: AI admin mode, unrestricted AI access

**AI Integration Contract**:
The access and review boundary for AI assistance: analysis inherits the current user's readable data, and business actions require the user's review and existing action permissions.
_Avoid_: AI admin mode, automatic approval

**Business Assistant / 业务助手**:
A conversation entry for analyzing the current user's permitted business data and explaining conclusions with evidence. Analysis is advisory and does not itself create, approve, or change business records.
_Avoid_: Autonomous approver, unrestricted agent

**Analysis Evidence / 分析依据**:
Business facts retrieved within the user's access boundary, with their source, scope and observation time. Evidence is distinct from an AI judgment or a user-provided assumption.
_Avoid_: AI certainty, inferred company facts

**Brand Archive / 品牌档案**: A maintained collection of complete brand names and their trademark, holder, operational usage, authorization-count and declaration-window information, owned by middle data. Name inclusion alone does not establish registration validity or usage rights.
_Avoid_: Brand authorization approval, trademark validity determination

**Amazon Abuse Flag / Amazon滥用标记**: The recorded Amazon-related abuse indication for a brand, labeled “A是否滥用” in the source brand sheet. An unrecorded value does not mean the brand has no abuse issue.
_Avoid_: Global trademark status, blank as no abuse

**Brand Store Authorization / 品牌店铺授权**: A maintained authorization relationship between a brand and a specific store, with a current effective, cancelled or stopped status and retained change history. “授权中” counts currently effective stores; a store's workbench enabled status does not itself change its brand authorizations.
_Avoid_: Authorization application in progress, store name as store identity

**Brand Authorization Snapshot / 品牌授权数量快照**: Counts recorded in a source brand sheet, kept separately from counts derived from linked store authorizations. Missing store details do not establish that no authorization exists.
_Avoid_: Adding historical snapshot counts to current linked counts

**Brand Query / 品牌查询**: Read-only exact name membership lookup. Trim outer whitespace; compare lowercased names exactly (case-insensitive, preserving all other characters). Not collected means absent from this archive, not a statement about registration or usage rights.

**Store Information / 店铺信息**: Operator-maintained information for one platform store at one site, scoped to its assigned group, with independent balances, withdrawal notes, owners and remarks; assigned stores awaiting completion remain visible. Authorized readers can view that site's balance and withdrawal notes, while source brand notes do not establish authorization.
_Avoid_: Store name as identity, source brands as valid authorizations, account status as workbench enabled status, balance records as live balances

**Store Withdrawal Time Mark / 店铺提款时间标记**: An operator-recorded time for a site's “标准” or “发票” withdrawal category. Each category has its own latest mark and retained click history; a mark does not establish a transfer amount or that funds arrived.
_Avoid_: Bank withdrawal transaction, payment confirmation, parsing historical withdrawal notes as marks

**Store Account Status / 店铺账号状态**: The shared operational labels for one site store, maintained consistently through Store Information and Store Group Bindings, such as normal, stopped, video verification or at risk of suspension. Multiple labels may coexist and blanks do not mean normal operation; these labels change neither workbench enablement nor brand authorization.
_Avoid_: Workbench enabled status, one status for all sites with the same name

**Workbench Store Enabled Status / 工作台启用状态**: Whether a store is enabled within the workbench, maintained through Store Group Bindings. It is independent of the store account's operational labels and brand authorizations.
_Avoid_: Platform account health, account suspension, brand authorization cancellation

**Store Grade / 店铺等级**: An optional manually maintained text grade for an individual platform store ID, such as A, A1 or B1. Blank means ungraded; grades are not shared automatically across countries or accounts and do not change authorization or after-sales access.
_Avoid_: Account-wide rating, automatic performance score
