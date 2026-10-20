# 采购申请 TDesign 交互样板

当前项目已迁至 `D:\codex\UI`，在该目录运行 `pnpm dev`、`pnpm build`、`pnpm test`；独立构建包含完整 44 页和根入口，原样板书签入口仍可用。文中旧“生产构建不打包 fixture”的说法仅是迁出前 ERP 工程的历史记录；指向 ERP 的链接只作设计参照，当前运行与构建不依赖 ERP。

## 目标与范围

2026-10-17，用户选定 [TDesign 企业级产品设计](https://tdesign.tencent.com/design/offices)，并要求使用真实组件制作采购申请列表与表单样板。优先验证高频办公的扫读、批量选择与长时间使用舒适度。此轮是独立、可操作的视觉样板，尚不代表全站上线决策。

## 流程与领域

列表查询、状态切换、分页、选择记录 → 查看详情或新建申请 → 校验 → 将申请加入当前页面的示例列表。关闭已修改表单须确认；校验失败保留输入并定位错误。沿用“采购申请”“需采购量”“所属小组”等业务用语，无新领域概念。

表单复用 [已确认设计树](../../erp/docs/purchase-request-form-layout-proposal.md#已确认设计树) 的纵向分区：采购商品与数量、采购方式与去向、直发入仓（选填）、申请信息。已知装箱数必须整箱；未知装箱数显示待采购确认。国内备货不适用运输方式。

## 归属、数据、API 与权限

源码位于 `scripts/fixtures/purchase-request-tdesign/`，独立 HTML 经 Vite 访问。使用已安装的 `tdesign-react`、官方样式和图标；不引入生产全局 CSS，不修改现有采购页面。数据为本地合成样例，刷新复原，无数据库、迁移、API 调用、权限变更或真实审批操作。演示用户与小组不映射真实账号。申请状态仅用于表现既有状态词汇。

## UI 与导入导出契约

浅灰工作区、白色内容面、TDesign 蓝主操作；按真实任务组织筛选、表格和表单。列表支持关键词、采购类型、站点和日期筛选，状态页签、分页、选择计数、详情查看；筛选改变清空选择，避免误操作。选中记录可导出当前样例列为 CSV，标明示例数据；不提供导入、真实审批或真实业务批量写入。

按用户澄清，移除操作区上方的独立页面标题与说明；“新建采购申请”位于上方筛选操作区左侧，与右侧“查询、重置”处于同一操作行。列表内部保留选择计数与导出，不放新建入口。

所有样板页面共用紧凑的面包屑间距：工作区顶部与面包屑下方各留 12px，保留 TDesign 原有文字行高；桌面和窄屏保持一致，避免位置导航占用过多首屏高度。

按用户对详情一致性的要求，采购申请、待复审、需求明细，以及汇总/订单来源申请的只读详情统一使用 [共享右侧抽屉](../scripts/fixtures/purchase-request-tdesign/DetailDrawer.tsx)：桌面宽 960px，窄屏不超出视口，统一标题、关闭按钮、底部关闭操作和独立内容滚动。支持 Escape、遮罩关闭、Tab 焦点约束，关闭后返回原入口，保留列表筛选与展开状态。编辑表单和提交确认继续使用弹窗；分组内明细保持行内展开。

详情保留 [申请资料与时间线](../../erp/docs/purchase-request-tracking-design.md#申请资料与时间线) 的完整流程记录：桌面左侧资料、右侧 TDesign Timeline，窄屏上下排列。按事件发生顺序显示节点、处理人、时间和完整意见，不折叠、不截断、不倒序。初始记录为明确标记的合成示例；当前样板的提交、修改复审资料、复审通过、生成订单追加本地记录，打开或刷新详情本身不生成事件。修改记录保留实际字段变化与调整原因，部分下单保留本次数量。仅显示已有事件，不推测未来物流或审批节点；实际后端时间线及权限合同不变。

新建弹窗头尾固定、主体滚动，字段有标签，保留必填、帮助与就近错误；不因普通输入回车提交。关闭后焦点回到入口。窄屏表格内部横向滚动、表单单列，不挤压内容。列表空结果提供重置入口。样板说明明确本地数据边界。

## 验证与交付

专用类型检查覆盖样板，生产构建检查兼容性；浏览器检查查询、分页、选择、导出、必填与整箱校验、取消保护和本地新增，检查桌面及窄屏截图。截图与评审保存在 `.impeccable/review/purchase-tdesign/`。测试临时产物遵循 `createTestRun` 生命周期。无需后端测试：本轮无后端行为变更。

## 采购处理扩展（2026-10-17）

用户要求继续其他页面。本批扩展待复审、采购需求明细、采购汇总与采购订单，与原采购申请共五页，沿用本样板已确认的 TDesign 视觉和上方操作区：主操作在左、查询与重置在右，无独立可见大标题。最初的 184px 平铺侧栏和移动横向导航已由下方“侧栏导航完善”替代；双列筛选和表格内部横向滚动保留。保持各页筛选和选择状态，筛选或切换状态时清空选择。

待复审突出计划数量、本次装箱数、供应商/单价和待补项，支持查看、修改示例复审资料及合格记录的批量通过预览；需求明细比较申请、计划、已下单和未下单数量。采购汇总按采购类型、采购方、供应商分组，支持展开商品和来源、预览分组订单；采购订单显示合同号、供应商、预计交期、数量及展开明细。业务标签核对 [采购设计适用范围](../../erp/docs/purchase-design-index.md)、生产对应 Table/Workbench 和 `purchase-status.ts`，不以视觉样板修改业务合同。

数据仍为合成的本地样例。复审通过和生成订单仅模拟处理模块内的数据流，先预览确认，明确“示例”；待补项阻止通过/生成。原申请页使用独立样例行，不与处理模块联动，样板说明弹窗明确此边界。订单不模拟实际发货、付款、取消、供应商拆单、权限、文件回导或数据库写入。复审可编辑供应商、单价、采购方、计划数量、本次装箱数和调整原因；保留未保存关闭保护、必填与整箱校验、错误定位。调整原因保存到样例行并在详情展示。弹窗头尾固定、背景根节点 `inert`、Tab 焦点循环；订单预览只读。按领域分组生成示例订单，不将不同采购方/供应商混为一单。

实现限定在同一 fixture，新处理页面共享本地模型和筛选/表格外壳；不抽象生产组件。验证覆盖四页导航、筛选/空态、展开、选择、修改必填/数量校验、预览确认和数量一致性；桌面、当前用户宽度和窄屏检查。新增逻辑的小型断言测试遵循受管入口，类型检查与上下文检查在交付前执行。原样板申请页只扩展导航，不变更申请接口或生产页面。

## 出货处理扩展（2026-10-17）

继续同一 TDesign 样板，新增出货排期、出货核对、物流下单（含跟踪）三个入口，沿现有采购链路向后验证办公任务。沿用上方操作区、列表状态页签、批量选择与导出、统一详情抽屉及完整时间线；新建和编辑使用共享表单弹窗，关闭有修改的表单须确认。

本批支持：草稿排期编辑与批量确认；从已确认排期按整箱选货并按供应商生成核对资料；确认待核对数量；从已确认且未分配的核对资料创建同一目的仓的物流单；生成示例 CSV、记录发送、登记运单与维护物流原文。字段和状态依据 [排期链路](../../erp/docs/shipping-workflows.md#排期拆分确认与退回)、[出货核对](../../erp/docs/logistics-workflows.md#出货核对创建确认与释放)、[物流建单](../../erp/docs/logistics-workflows.md#物流建单与申报快照) 及 [物流动作](../../erp/docs/logistics-workflows.md#导出发送撤回与运单)。排期确认仅确认计划，物流反馈不生成入库或上架事实。

实现仍归属于 `scripts/fixtures/purchase-request-tdesign/`，使用独立合成的排期、核对和物流数据；这三个新页面共享本地来源余额，既有采购样例不自动生成排期。每次创建校验整箱、来源余额；物流建单校验目的仓、50 箱 / 30 立方米上限，实际运输方式来自选中示例模板，改变计划方式需要原因。提交失败保留输入，重复选择不能超过剩余可用量。处理事件保留操作者、时间、数量与说明。

无生产 API、数据库、权限或迁移改动。导出为标识明确的样例清单，不冒充实际业务回导/物流模板；未模拟真实文件版本、权限脱敏、并发服务端失败、部分释放、撤回取消、实物上架或自动物流文本识别。物流原文只追加记录，保留既有阶段。验证包含来源数量守恒、原子拒绝非法选择、分单边界、物流状态守卫、小屏与键盘、八页导航以及原样板回归。

### Direction contract

THESIS: 在同一采购协作样板中完成排期到物流跟踪的连续任务，默认列表只保留比较和当前操作所需信息。

OWN-WORLD: 用户选定的真实 TDesign 组件、白色内容面、浅灰工作区与蓝色主操作。

STORY: 查排期、选货核对、建物流单、维护反馈；数量余额和完整时间线解释每次变化。

FIRST VIEWPORT: 224px 分组侧栏，可收起为 64px 图标栏；上方筛选操作区左侧主操作、右侧查询重置，下方状态页签及紧凑表格。详情统一 960px 右侧抽屉，左资料、右时间线。

FORM: 已确认样板的直接扩展，code-led；不重新选择视觉方案，无新 seed。

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## 运营与库存扩展（2026-10-17）

目标是在同一独立样板增加补货申请、上架申请、库存明细，延续左侧主操作、紧凑列表、统一详情抽屉及完整时间线。库存来源详情包含只读实物上架记录，不新增与生产导航不符的独立上架记录页面。

领域与流程遵循 [补货申请与预留](../../erp/docs/replenishment-workflows.md#补货申请与预留)、[库存计算与汇总](../../erp/docs/replenishment-workflows.md#库存计算与汇总)及 [上架申请流程](../../erp/docs/listing-workflows.md#新建归属与审批职责)。补货按具体采购来源申请整箱数量：同组提交占用，跨组货源确认才占用，申请审批不重复占用，驳回或撤回释放。此轮演示至待发货，发货、取消和退回处理留待后续页面。库存按品名汇总，再查看小组与独立来源；待出货、未占用在途、可用库存分列，异常显示待核对而非零。实物上架记录为只读合成事实，不从物流文字或刊登审批推导。

上架申请支持新建、撤回、修改重提、通过/驳回及完成后补充 ASIN/品牌；演示 EAN 使用明确的 DEMO 标识，审批成功才分配且不重复发码。主图本地选择并在内存预览，不上传服务。仅展示主要必填刊登资料和备注，不模拟图片权限、正式 EAN 池、工作簿导入或真实回导。

归属、状态与时间线均由新增 fixture 数据模块维护，不改生产前后端、权限、API、数据库或迁移。演示者可切换体验不同环节，不代表生产授权；来源与申请共用独立示例集，和先前采购、出货样例隔离。导出仅为已筛选/已选数据 CSV；重载恢复初始数据。表单复用相同未保存保护与焦点契约，错误保留输入并定位；查询、状态、选择和分页各页面保留。详情始终使用共享抽屉。

验证：新增数据断言覆盖整箱/超额、同组与跨组占用时点、审批释放、EAN 唯一与资料校验、异常库存及合计；专用类型检查，复用未改生产构建结果；浏览器验证三页、表单校验、完整演示流转、抽屉时间线、键盘与桌面/窄屏布局，按上下文维护运行索引验证。沿用上文 Direction contract，不更改全局设计规则。

## 订单处理扩展（2026-10-17）

在相同 TDesign 样板增加每日订单发货、售后记录、补发表，保留上方左侧操作、列表筛选与状态页签。详情全部复用带完整时间线的右侧抽屉，编辑及确认复用 PreviewForm；不新增第二套视觉规范。

领域依照 [每日发货手工编辑](../../erp/docs/order-workflows.md#每日发货手工编辑与读取)、[售后跟进与补发创建](../../erp/docs/order-workflows.md#售后跟进与补发创建)、[发货维护](../../erp/docs/order-workflows.md#补发发货维护与回导)、[进度与历史](../../erp/docs/order-workflows.md#售后进度与历史展示)及[结案与软删除](../../erp/docs/order-workflows.md#结案与补发软删除)。每日发货以商品明细展示，维护状态和内部备注作用于同系统单号的全部明细；批量操作按系统单号去重，确认时说明影响范围。来源字段只读，导出包含当前筛选或所选示例。

售后登记保留独立问题及涉事商品快照，不从每日发货表猜测关联。演示人工登记、沟通跟进、发起补发/换货、结案和重开。创建补发同时记录跟进且保持处理中；同一售后允许多次申请，每次数量按来源商品校验。补发表支持直接申请和来源申请、多个包裹及商品分配、明确登记运输状态、必填原因的本地软删除。当前进度排除已删除申请，时间线保留历史；签收不自动结案，有运单不自动认定运输状态。

使用独立内存示例；人工演示操作不代表生产权限。此轮仅覆盖上述主要人工流程，不实现工作簿导入回导、真实查单、图片附件、退款退货登记或生产并发；无生产前后端、接口与依赖变更。复用既有抽屉、表单及 CSV 导出，局部新增三个页面、表单及数据规则文件。新增断言覆盖同单更新、跨记录关联隔离、补发创建原子性、分配上限、显式状态与删除历史；检查类型、桌面/实际宽度/窄屏、焦点、未保存保护与数据流，交付前执行上下文验证。

## 侧栏导航完善（2026-10-17）

将已实现的 14 页按现有 [模块导航](../../erp/src/lib/module-navigation.ts) 归入运营流程、采购处理、出货处理、订单处理四组；采购申请属于运营流程，出货排期属于采购处理。仅调整独立样板的应用壳，不增加业务页、生产权限、API、数据模型或导入导出行为。

由 [PreviewNavigation.tsx](../scripts/fixtures/purchase-request-tdesign/PreviewNavigation.tsx) 维护这一份菜单配置，分组与面包屑共用分类，局部规则见 [导航 surface brief](../.impeccable/surfaces/res-purchase-request-tdesign-previewnavigation-tsx.md)。保留真实 TDesign Menu、Button、Popup 和 Drawer：展开态为 224px、模块可展开收起，叶子清晰标记当前页；收起态为 64px 四模块图标栏，点击或键盘打开子项浮层，Tab/方向键进入子项，Escape 返回触发项。680px 及以下使用同一菜单数据的左侧导航抽屉，选择后关闭、焦点回到入口；顶栏菜单按钮具有实际行为。业务详情仍统一为右侧详情抽屉。

导航固定于视口，长菜单在侧栏内部滚动，底部说明入口固定；当前页面与各页已保留的筛选及内存示例不会因收起或切换导航被清空。分组展开状态在本次页面会话内保留，当前页所在分组在切换时展开。验证全部 14 页可达、分组归属、面包屑一致、折叠浮层键盘/Escape、手机焦点约束与背景隔离、跨断点关闭恢复、桌面/短屏/窄屏及表单回归；执行专用类型检查与上下文验证，复用未变业务数据的测试结果。

## 采购档案扩展（2026-10-17）

- 用户要求继续其他页面。本批在既有视觉和交互约定内补齐产品主档、供应商、采购方三个页面；侧栏增加「采购档案」分组，覆盖总数变为 17。新建和导出留在上方操作区左侧，筛选右侧查询/重置，不增加操作区上方标题。
- 产品以稳定主档 ID 识别，同名不同型号允许共存。公共资料与供应商/国家供货分开；行展开显示供货报价、单位、价格口径、装箱数及最近下单事实。新建主档、公共编辑、添加供货和供货编辑使用真实 TDesign 表单弹窗；详情仍为共享右侧抽屉及时间线。
- 供应商主体包含国内/海外采购资料，两类资料分别维护联系人、支持站点、结算方式和启停状态；已有采购资料不能通过取消勾选删除。供货关联采购资料稳定 ID，供货编辑不能更换供应商和国家，重复组合必须报错。
- 采购方完整名称用于冲突核对，简称不作为身份。设置默认会解除其他默认，允许取消默认或停用默认采购方；没有启用的默认项时提示，不自动选择第一条。档案更新不重写历史订单。
- 数据仅当前页面内存，三页共享本批档案关系和操作时间线，与其他批次业务样例独立。不接接口、修改权限、重算历史价格或执行真实归并/导入。仅提供能实际工作的列表筛选、选择导出、表单保存、详情、供货和默认状态操作；未实现的流程不放假按钮。
- 本轮表单用于验证信息层级，覆盖公共身份与主要申报字段、供货报价/单位/口径/箱规、采购资料和采购方联系设置；主图、完整退税字段、重量尺寸及导入回导不在本轮实现范围，不能当作生产档案全字段替代。
- 验证：档案身份、供货组合隔离、参考价与下单事实分离、采购方默认切换和历史记录使用无落盘数据测试；浏览器检查三页列表/表单/抽屉/时间线、键盘关闭和焦点、筛选记忆、桌面/用户宽度/390px 及 320px 边界。专用 TypeScript 检查及 context 验证；生产代码和后端未变，不重复无关后端套件。

## 海外仓与物流商扩展（2026-10-17）

- 继续既定 TDesign 方向，补齐「采购档案」的海外仓和物流商入口，总数 19 页。仍使用上方左侧新建/导出、右侧查询重置；详情统一共享右侧抽屉及时间线，编辑与确认统一共享表单弹窗。
- 海外仓展示仓名、站点、用途、地区/地址、排序、启停与同站点同用途的优先项。优先项由启用状态和排序计算，不新增默认标记。生产目前按仓名 upsert，样板编辑固定仓名/站点，新建重复名称报错并要求编辑原记录，避免把改名当作稳定 ID 更新；不演示身份迁移。排序、状态和地址变更均留历史，提示后续选择影响，不声称所有排期只读旧地址。
- 物流商提供主体档案与展开的模板系列/版本。系列、版本和默认各自保留身份；本批用明确标注的内置表结构创建示例版本，完成字段映射、生成演示样例、只读样例核对、通过/退回、启停及 fork 新版。映射重存清除旧样例，曾核对版本必须复制新版本修订；新版本不替换默认，核对启用才更新系列默认。默认物流商模板只允许可用系列，已有默认不随另一个系列核对而改变。
- 模板样例只呈现本地表格数据，无真实 Excel 上传、解析、文件下载、真实订单绑定和物流识别规则。本轮不接 API、改权限或修改既有物流单；停用提示可能阻止绑定版本重新生成文件，已生成文件不因默认变化重写。所有按钮只提供本批实际可运行的动作。
- 复用共享弹层及局部档案视觉，新增本批数据规则与测试；新建/编辑/默认/版本动作的旧值、新值及原因写入时间线。验证覆盖规则守卫、默认与 fork、样例过期、必填及空态，桌面/用户宽度/390px 与 320px、键盘焦点和窄屏时间线；仅独立 fixture，不扩大为生产验收。

## 数据查询扩展（2026-10-17）

- 延续现有 TDesign 样板，新增「数据查询」分组及订单查询、定价查询、品牌查询三页，本批后共 22 页。查询页不伪造新建或编辑业务动作。查询规则及交互保留；2026-10-20 的首屏与结果布局调整见下方改版记录。
- 订单样板只检索合成本地导入总表，字段依照 [订单查询合同](../../erp/docs/order-query-workflows.md#本地搜索分页与详情)。完整 Amazon 格式按平台或系统单号精确查，其余多个词同时匹配平台单号、系统单号、品名、可靠简称与原导入店铺名；不将型号、地址和运单当作搜索字段。一个平台单号可返回多条系统单记录，列表按记录计数；保留各物流来源和差异，未提供运单不推定未发货。来源价格仅在详情显示原值并标明币种及含义未确定，不汇总为销售额。客户联系方式不放入合成数据，也不演示前端解锁敏感权限。未命中不发领星请求，并明确未连接外部查询。
- 定价查询按 [定价读取合同](../../erp/docs/product-pricing-design.md#用户已确认的业务流程) 精确匹配完整品名（忽略首尾空白与英文大小写，保留内部空格和标点），支持国家和货源类型筛选。只展示启用记录的品名、销售规格、国家、货源、币种、指导价和更新时间；空/零成本的查询投影为暂无报价，不展示免费售价。合成查询数据没有成本、倍率、供应商或采购参考价字段；不添加维护历史入口。
- 品牌查询按 [品牌查询合同](../../erp/docs/brand-query-design.md#流程与界面) 只返回完整名称的已收录/未收录，忽略首尾空白和英文大小写，不扩展为模糊搜索、授权关系或商标核验；不提供编辑或权属详情。输入错误与未收录使用不同反馈。
- 三页只读详情和本页查询记录均复用 DetailDrawer。新增可选时间线标题，默认仍为流程时间线，查询使用“本页查询记录”，只记录当前会话的查询、查看和重新开始，不冒充维护事件或订单履约历史。订单正式界面目前使用完整详情页，本样板遵从用户此次统一抽屉的选择，未替换生产实现。
- 本批不接 API、鉴权、Excel 导入、外部平台、异步竞态和真实网络失败。新增纯查询规则断言，验证匹配边界、空条件、报价投影和敏感字段缺席；浏览器覆盖输入/已提交条件分离、详情返回、三个查询结果、未命中、分页、侧栏、桌面/用户宽度/窄屏及共享抽屉回归。沿用原生产构建，专用 fixture 类型检查和上下文校验单独执行。

### 查询页布局改版（2026-10-20）

三个查询入口改为连续内容面：首屏显示页面标题、宽主查询框、规则与试填示例，不再占用一整块等待空状态。提交后顶部收紧，结果区显示已提交条件、记录数或品牌收录状态；导入与查询记录在顶部，导出在结果区。订单保留每页 10/20/50 条及总数，定价保留规格、币种、暂无报价和内部横向滚动；品牌明确区分提交名称与匹配名称。示例只填入，Enter 提交；草稿变更保留上次结果并禁用导出，错误校验不清除结果。订单/定价零命中不能导出；品牌“未收录”是一条有效的内部核对结果，仍可导出“未收录”状态。重新开始清空输入、结果和分页，保留本页会话记录；详情与记录沿用共享抽屉。导入仍是前端样式预览，导出仍为本地 CSV 示例。

## EAN 与店铺归组扩展（2026-10-17）

- 延续真实 TDesign 样板，新增中台数据分组下的 EAN 码池、店铺归组，本批后共 24 页。新建、导入和导出放在上方操作区左侧，不新增可见大标题；详情、导入结果和历史统一右侧抽屉，新建/编辑/导入复用现有表单弹窗。
- EAN 依照[码池与审批发码](../../erp/docs/listing-workflows.md#审批发码与资料补充)及[导入合同](../../erp/docs/middle-data-module-design.md#importexport-contract)：保留 13 位 ASCII 数字字符串，不额外增加校验位规则；新码可用，重复不覆盖。CSV 有效行入库、错误行分别反馈，空行忽略；本地文件只读取 UTF-8 CSV，允许粘贴。可用/已发放/停用计数来自整个示例池，筛选分页不改全池统计。选中行导出优先于当前筛选；只读已发放关联和历史，不提供手动发码、停用、回收或删除。与旧上架样板的数据集独立，不伪称跨页审批发码已接通。
- 店铺归组沿用[站点身份与状态](../../erp/docs/store-workflows.md#站点身份与状态)、[归组交接](../../erp/docs/store-workflows.md#转组启停与资料交接)及[综合搜索](../../erp/docs/store-group-bindings-ui-design.md#2026-10-14-综合搜索已确认)。复用现有纯检索函数实现即时 AND 搜索、国家别名与状态完整匹配；不提供品牌搜索，因为此页未载入授权摘要。页签和国家/小组/工作台启停条件取交集，切换条件回到第一页。
- 店铺以 SID 保持身份，已有 SID 和国家不可编辑；简称、账号状态只读，修改名称/平台/等级/归组/工作台启停须说明原因。已有订单快照或售后记录的站点拒绝转组；允许转组的示例资料跟随目标组，不属于目标组的当前负责人移除，源负责人文字及历史保留。未建档站点不自动建档；工作台停用不清空账号标签或资料。本地版本校验及原子变更用于演示，未改变真实权限。
- 全部为独立合成内存示例，无真实 API、领星同步、权限变更或持久化；店铺 CSV 回导、品牌授权与运营资料维护留在相应后续页面。本批新增纯规则测试覆盖 EAN 部分成功、重复、身份、转组保护、负责人交接及搜索边界；复用现有表单/抽屉键盘机制并做浏览器回归，单独执行 fixture 类型与上下文校验。
- 实现见[两个中台页面](../scripts/fixtures/purchase-request-tdesign/MiddleDataPages.tsx)、[添加、导入与归组表单](../scripts/fixtures/purchase-request-tdesign/MiddleDataForms.tsx)、[本地规则与历史](../scripts/fixtures/purchase-request-tdesign/middle-data.ts)、[规则测试](../scripts/fixtures/purchase-request-tdesign/middle-data.test.mjs)及[局部 surface brief](../.impeccable/surfaces/purchase-request-tdesign-middledatapages-tsx.md)。

## 品牌档案与产品定价扩展（2026-10-18）

- 在既定 TDesign 样板中补品牌档案、产品定价，中台数据分组共四页，样板累计 26 页。维持上方操作区左侧新建、共享右侧详情抽屉与完整时间流、共享编辑弹窗，窄屏分页沿用上一批的可访问前后页结构。
- 品牌资料以 `backend/app/brand_archive.py` 的字段与校验为依据，支持名称、分类、使用/登记状态、商标及宣誓日期、权属资料、原表数量快照和核查说明；保持原文语义，不判定法律有效性。原表快照与按覆盖站点统计的当前授权分开展示，详情提供只读授权概况，不在本批创建或改变授权关系。新增/编辑保留本地版本保护、字段变更历史，日期与完整快照校验失败保留输入。
- 产品定价沿用[业务与价格口径](../../erp/docs/product-pricing-design.md)：从明确的产品供应商记录选择，按销售规格、国家与货源区分；国内货源须来自 CN，当地货源须匹配目标国。编辑不能改关联档案；切换国家/货源清空成本。采购单价仅参考且币种未记录，最终成本或报价乘倍率得指导价，默认倍率 4，按两位小数四舍五入；空/零成本显示暂无报价。保存原因必填，启停保留完整历史，无硬删除。
- 页面以合成的完整维护视图演示，刷新重置，独立于旧查询、采购档案和店铺样板，不接真实接口、敏感权限、外部商标服务或生产数据；明确标记示例资料。品牌 CSV 导入、授权编辑、定价导出和跨页实时联动不纳入本批。品牌导出取全部当前筛选结果；采购参考价不预填成本，切换供货记录仅预填销售规格。

源码入口为[两页列表与只读详情](../scripts/fixtures/purchase-request-tdesign/BrandPricingPages.tsx)、[四页签品牌表单与定价表单](../scripts/fixtures/purchase-request-tdesign/BrandPricingForms.tsx)、[合成数据与维护规则](../scripts/fixtures/purchase-request-tdesign/brand-pricing-data.ts)和[7 项规则断言](../scripts/fixtures/purchase-request-tdesign/brand-pricing-data.test.mjs)。导航经 `main.tsx` / `PreviewNavigation.tsx` 接入；[共享窄屏分页](../scripts/fixtures/purchase-request-tdesign/PreviewPagination.tsx)由 MiddleDataPages 原样提取。`preview.css` 的局部维护样式保留 940px 内部滚动宽表、窄屏换行供货选项与数字右对齐；指导价 20px 仅强调当前计算结果。完整方向与局部约束见[本批 surface brief](../.impeccable/surfaces/purchase-request-tdesign-brandpricingpages-tsx.md)。

完成验证见[构建者检查记录](../.impeccable/review/purchase-tdesign/brand-pricing-checks.json)：新增 7 项纯规则测试与最终 fixture TypeScript 检查通过，未变代码复用此前 53 项纯测试和生产构建，无后端测试。浏览器覆盖校验失败与输入保留、新建/编辑保存、未保存保护、空态重置、抽屉键盘循环及焦点恢复；定价覆盖 `10.01 × 1.5 = 15.02`、换国清空成本、规格预填、修改历史与移动分页。四个视口为 1440×1000、1058×884、390×844、320×740；交互完成后查询浏览器错误日志（最多返回 6 条），结果为空。独立 [finish review](../.impeccable/review/purchase-tdesign/brand-pricing-review.md)查看全部 16 张本地合成截图和相关源码，结论 **ship**、无实质修复项，未独立运行浏览器、测试或检测器；截图包含品牌 12 → 13 条、启用定价 11 → 12 条及已修改记录等不同交互阶段。[唯一一次检测器运行](../.impeccable/review/purchase-tdesign/brand-pricing-detector.json)只有 8 项字号建议（7 项既有、1 项有意的 20px 指导价），但因无关旧库存构建状态的 `COMP_ROUND_OPEN` 返回 1，不是干净退出。没有新增发布用图像资产；实际 CSV 下载、真实读屏、接口、权限、持久化与并发未验证，结论仅限独立样板。

## 剩余页面 A 段交接（2026-10-18）

**目标与范围。** 按[覆盖矩阵](remaining-tdesign-coverage.md)补齐补货处理与店铺信息；面向采购处理人员与获授权的店铺资料维护人员。只操作独立内存合成记录；不调用后端、领星或真实账号。采购申请样板和店铺归组样板已有独立数据，本段明确它们不会自动联动。

**流程与领域。** 补货处理从已通过的补货申请进入阶段队列；待锁仓确认后待收标签，收到标签后可登记分次发货，未发余额到零且无待取消时成为完成。锁仓问题保留待锁仓并记原因。取消由申请侧先提出独立待处理明细，处理侧按明细 ID/版本确认或驳回；待取消数量暂不可发且不提前释放预留。发货记录仓库、实际日期、数量与可选凭证；可用退仓按具体发货明细 ID/版本登记，须仓库和凭证，累计不超过该笔已发，不减原已发、不恢复未发、不重开已完成。每步保留时间流。店铺信息以 SID 定位站点，资料档案有独立版本；完整资料、账号状态、当前负责人、提款操作记录分别展示。账号停用不等于工作台停用；提款标记不转账或扣余额。品牌文字不推导真实授权。

**归属、数据、API 与权限。** fixture 中新建 A 段局部数据模型、列表与表单，不修改 `src/`、数据库、迁移、API 或真实权限。合成数据注明“示例”，动作权限只以样板演示角色分区，不表示生产授权。新记录和修改只保留当前页面内存；本地版本用于演示冲突提示，不能宣称服务器并发控制。

**界面与文件合同。** 筛选及主操作位于上方操作区，详情使用右侧 `DetailDrawer` 并完整显示历史；动作表单使用 `PreviewForm`。处理列表保留阶段计数、数量分解和合法下一步；错误后保留输入并聚焦。店铺列表可筛选、导出当前全部匹配；档案编辑区分只读共享字段与可改资料。店铺信息回导使用 XLSX 模板、预检、逐行成功/失败及失败行重试；店铺归组 CSV 留独立入口和整批原子确认。品牌授权与品牌 XLSX 在 F 段接入共享合成 SID/品牌状态后完成，不以本段文字视图冒充有效授权。

**测试与推出。** 为数量、阶段、版本、店铺身份和逐行结果写纯规则断言，fixture TypeScript 与上下文检查；浏览器验证筛选、详情、保存、错误保留、未保存保护、键盘和 1440/1058/390/320px。截图仅为样板证据。生产接入另立交接，不改生产服务。

## 剩余页面 B 段交接：链接维护（2026-10-18）

**目标与范围。** 在同一真实 TDesign 样板中补 Review 直评需求、运营单需求、Vine 评价计划三页，分别演示登记、审批或退回、业务处理、查询、只读详情及完整时间线。操作者、审批人、处理人仅为合成角色；样板不访问真实权限、图片服务或业务接口。

**流程与领域。** Review 审核状态与资源显示状态独立，已通过后才可写实际资源结果；掉评及日期纠正留原因。运营单需求由指定审批人核对，资源编码、账号情况和两类结果独立回填，不自动推定完成。Vine 审批与提报数量独立；正整数注册数、`0 ≤ 评论数 ≤ 认领数 ≤ 注册数`，第 90 天仍在跟踪，次日按期限结束，评论收齐优先。退回重提沿用原 ID/历史，取消为终态；所有动作按版本复查，错误保留草稿。

**归属与合同。** 源码只增 fixture 局部数据、表单、页面和纯规则检查，使用现有 `DetailDrawer`、`PreviewForm`、`PreviewDialog`。文件模式分别保持 Review 的明细只读/新建/运营/资源，运营单的新建/运营/资源，Vine 的新建/进度；前两者逐行部分成功与失败行重试，Vine 整批预检确认且任何错误不写。预检不改记录，提交重新校验版本及选中稳定 ID。XLSX 由本地工作簿工具生成和读取，实际服务器批次令牌、回执、权限遮蔽及图片上传不在本样板内模拟为真实成功。

**验证。** 每页至少覆盖状态守卫、版本、数量或日期及预检写入边界的纯规则断言；浏览器核对列表筛选、审批与处理、失败输入保留、只读详情时间线、桌面和窄屏操作与键盘焦点。所有样板数据标明合成，不把审查按钮当权限授予。

## 后续 C–F 段

跨境数据、基础配置、工作台与账号支持、物品/系统偏好以及剩余文件入口见[剩余 TDesign 样板 C–F 段设计交接](remaining-tdesign-design-handoff.md)。

## 上线边界

通过独立预览评估外观与操作节奏，认可后再单独确定生产替换范围。此样板未覆盖真实权限、异步失败、同名主档消歧、批量审批与导入契约；不能直接作为生产实现移植。既有未提交采购页面修改保留。

## 运行与验证记录

## EAN 与店铺归组

EAN 与店铺归组扩展验证（2026-10-17）：本批后共 24 页。新增 7 项与既有 46 项纯内存数据测试合计 53 项通过，布局修正后新增 7 项再次通过；最终分页修复后专用 TypeScript 检查通过。生产代码未变，复用此前生产构建结果（不包含 fixture）；无后端变更，本批未运行后端测试。

浏览器验证了 EAN 空值错误聚焦、保留前导零添加、混合导入 2 条成功与 2 条失败、仅失败行重试、未保存阻止关闭与继续填写、空态和重置。表头首屏选择 10 条、第二页保留 10 条，再添加 9 条后共选 19 条，重置清除选择。店铺搜索“停用”不命中“存在停用风险”；DEMO-SID-001 引用保护使归组禁用，DEMO-SID-004 缺少原因时聚焦错误，补原因从家居组转至日用组后移除“林同学（示例）”、保留“陈同学（示例）”，源负责人文字和历史保留；移动端新建 DEMO-SID-013 通过。

检查尺寸为 1440×1000、用户窗口 1058×884、390×844、320×780。宽表内部滚动、手机时间线末尾可达，未观察到文档级横向溢出；共享抽屉 Tab 循环、Escape 返回触发入口、背景 inert 和表单未保存保护均已验证。独立评审首轮查看 14 张有效截图和关键源码，仅发现 320px 分页裁切；改为移动端真实 TDesign 上一页/下一页按钮、常驻页数、语义 nav/status 及 44px 目标，760px 以下隐藏原分页。修复后浏览器用 Enter 验证第 1 页 → 第 2 页（3 条）→ 第 1 页；评审者重看两张移动截图及源码，唯一问题 resolved，最终 **ship**、clear。此次定向复核沿用其余 12 张未变布局，未独立重跑浏览器、检测器或测试，未重新审查全应用。见[独立评审](../.impeccable/review/purchase-tdesign/middle-review.md)。

初始 `DatabaseIcon` 导出错误已修正为 `DataBaseIcon`；最终读取的浏览器日志只有 23:07 的 4 条旧 HMR 错误，没有更新的错误记录。检测器仅在分页修复前运行一次，报告 preview.css 第 8、10、23、36、131、133、167 行的 7 条既有字号建议，本批新增样式无命中；未在分页修复后重跑。`COMP_ROUND_OPEN` 属于 2026-09-11 库存图片任务，本批未修改。

14 张 `middle-*.png` 为本地合成示例，两个移动列表已在分页修复后重拍。代表证据：[EAN 桌面](../.impeccable/review/purchase-tdesign/middle-ean-desktop.png)、[导入结果](../.impeccable/review/purchase-tdesign/middle-ean-import-result-desktop.png)、[1058px 引用保护](../.impeccable/review/purchase-tdesign/middle-store-blocked-form-user-1058.png)、[1058px 店铺详情](../.impeccable/review/purchase-tdesign/middle-store-detail-user-1058.png)、[手机时间线](../.impeccable/review/purchase-tdesign/middle-store-timeline-mobile.png)、[320px 最终店铺列表](../.impeccable/review/purchase-tdesign/middle-stores-mobile-320.png)。不同截图保留交互阶段：码池 15 → 19 → 21 条、店铺 12 → 13 条。本批无新图像资产；原生文件选择器和实际下载未做浏览器验证，证据限粘贴 CSV、解析规则及复用导出工具。未运行真实读屏软件，验收不覆盖真实网络、接口、权限或后端。

## 数据查询

数据查询扩展验证（2026-10-17）：本批后共 22 页。实现见 [三个查询页面](../scripts/fixtures/purchase-request-tdesign/QueryPages.tsx)、[合成数据与查询规则](../scripts/fixtures/purchase-request-tdesign/query-data.ts) 和 [规则测试](../scripts/fixtures/purchase-request-tdesign/query-data.test.mjs)。新增 7 项与既有 39 项纯内存数据测试合计 46 项通过；最终语义修复后专用 TypeScript 检查再次通过。生产代码未变，复用此前生产构建结果（不包含 fixture）；无后端变更，本批未运行后端测试。

浏览器验证了初始等待输入、示例只填入、Enter 提交、修改条件保留上次结果及未提交提示、重新开始与切页状态保留。订单查询覆盖 12 条结果与第二页、同一完整平台单号返回 2 条系统单记录；定价覆盖加拿大筛选 2 条、当地货源进一步筛选 1 条及暂无报价；品牌覆盖已收录、未收录和输入错误保留已有结果。共享抽屉 Tab 循环、Escape 关闭与焦点返回、背景 inert、手机时间线末条可达，以及旧海外仓详情默认“流程时间线”均通过。原生输入的 aria-describedby / aria-invalid 已检查；最终结果摘要的同一常驻 polite 节点已验证初始 → 零命中 → 2 条记录更新，未使用真实读屏软件。

检查尺寸包括 1440×900/1080、用户窗口 1058×884、390×844、320×780。定价品名与销售规格合列，720px 最小表宽使 1058px 窗口内指导价完整可见；320px 检查未见文档级横向溢出，宽表保留内部滚动。最终语义修复前读取的浏览器 warning/error 日志为空，未把该结果扩大为修复后的完整日志复测。检测器运行一次，仅报告 preview.css 的 7 条既有字号建议（第 8、10、23、36、131、133、167 行），查询新增样式无命中；`COMP_ROUND_OPEN` 属于 2026-09-11 库存图片方案，本批未修改。

数据查询独立 finish review 的最终结论为 **ship**。首次评审查看 12 张截图及关键源码，发现结果缺少状态播报、未收录品牌详情把提交名称显示为匹配名称；现已补常驻 polite / atomic 状态摘要并明确显示“未匹配到名称”。评审者定向复读修复代码并查看 1 张新增详情截图，两项均 resolved，无剩余阻断项；未独立运行浏览器、测试或真实读屏软件，未重新开展全应用审查。见[独立评审记录](../.impeccable/review/purchase-tdesign/query-review.md)与[数据查询 surface brief](../.impeccable/surfaces/purchase-request-tdesign-querypages-tsx.md)。

14 张 `query-*.png` 均为本地合成数据截图，包含交互后状态及最终交付图。代表证据：[定价桌面](../.impeccable/review/purchase-tdesign/query-pricing-desktop.png)、[1058px 未提交条件](../.impeccable/review/purchase-tdesign/query-pricing-pending-user-1058.png)、[1058px 最终定价](../.impeccable/review/purchase-tdesign/query-pricing-final-user-1058.png)、[未收录品牌详情](../.impeccable/review/purchase-tdesign/query-brand-unmatched-detail-user-1058.png)、[390px 品牌详情](../.impeccable/review/purchase-tdesign/query-brand-detail-mobile-390.png)、[手机时间线末尾](../.impeccable/review/purchase-tdesign/query-timeline-mobile-390.png)、[320px 输入错误](../.impeccable/review/purchase-tdesign/query-brand-error-mobile-320.png)、[320px 定价表](../.impeccable/review/purchase-tdesign/query-pricing-mobile-320.png)。本批无新图像素材；验收仅限本地查询样板，不覆盖真实接口、权限、外部平台、网络失败或异步竞态。

## 海外仓与物流商

海外仓与物流商扩展验证（2026-10-17）：本批后共 19 页。实现见 [档案列表、模板版本与详情](../scripts/fixtures/purchase-request-tdesign/LogisticsArchivePages.tsx)、[仓库、物流商与模板表单](../scripts/fixtures/purchase-request-tdesign/LogisticsArchiveForms.tsx)、[本地状态与版本规则](../scripts/fixtures/purchase-request-tdesign/logistics-archive-data.ts) 和 [规则测试](../scripts/fixtures/purchase-request-tdesign/logistics-archive-data.test.mjs)。新增 8 项与既有 31 项纯内存数据测试合计 39 项通过；专用 TypeScript 检查通过。未修改生产接口或后端，复用此前生产构建结果（不包含 fixture），本批未运行后端测试。

浏览器验证了仓库查询空态、重置、编辑、排序优先项与旧值/新值历史；物流商新建、必填校验、未保存保护；模板新建、映射必填、样例生成、详情预览、核对勾选守卫、通过启用、默认系列切换、复制版本与停用默认后的不可用提示。数据测试另覆盖重复身份、站点/用途边界、排序相同的建立顺序、过期样例拒绝、退回原因、已核对版本冻结与默认恢复。实际 Excel 解析、下载、订单绑定、物流识别规则和服务端并发不在本批验证范围。

检查尺寸为 1440×900、用户窗口 1058×884、390×844、320×780。手机模板选择与操作改为纵排/换行，宽数据表保留内部横向滚动；上述窗口未观察到文档级横向溢出。共享抽屉的 Tab 循环、Escape 回到触发按钮、背景 inert，以及窄屏时间流末尾可达均已验证；浏览器控制台无新增警告或错误。18 张最终检查截图保存在 `.impeccable/review/purchase-tdesign/archive-*.png`。检测器仅报告 7 条既有字号建议（本批档案样式无新增建议）；其 `COMP_ROUND_OPEN` 属于 2026-09-11 库存图片方案，与本次 TDesign 扩展无关，未修改其构建状态。

海外仓与物流商独立 finish review（2026-10-17）：结论为 **ship**，无实质修正项。评审者独立查看全部 18 张 `archive-*.png` 截图及关键源码；未独立重跑浏览器或测试，运行验证由上述实现线程记录支持。局部方向、交互和数据边界见[海外仓与物流商 surface brief](../.impeccable/surfaces/purchase-request-tdesign-logisticsarchivepages-tsx.md)，沿用现有 DESIGN.md，结论仅限本地样板。

## 采购档案

采购档案独立 finish review（2026-10-17）：结论为 **ship**，无实质修正项。评审者独立查看 18 张 `catalog-*.png` 截图及关键源码；未独立重跑浏览器或测试，运行验证由下述实现线程记录支持。局部方向、交互和数据边界见[采购档案 surface brief](../.impeccable/surfaces/fixtures-purchase-request-tdesign-catalogpages-tsx.md)，沿用现有 DESIGN.md。

采购档案扩展验证（2026-10-17）：本批后共 17 页。实现见 [档案列表与详情](../scripts/fixtures/purchase-request-tdesign/CatalogPages.tsx)、[档案表单](../scripts/fixtures/purchase-request-tdesign/CatalogForms.tsx)、[本地档案关系与历史](../scripts/fixtures/purchase-request-tdesign/catalog-data.ts) 和 [数据测试](../scripts/fixtures/purchase-request-tdesign/catalog-data.test.mjs)。新增 6 项及既有 25 项数据检查全部通过，专用 TypeScript 检查通过。生产代码未变，复用此前生产构建结果（不打包 fixture），本批未运行后端测试。

浏览器实测同名不同型号主档新建及双页签保存、供应商国内/海外联系人和站点分别保存、新主档关联新供应商海外供货、参考价 28.50 → 31.20 后最近下单仍为 2026-10-15、默认采购方由 CGF-001 切换 CGF-002 且双方保留历史。筛选切页后保留、空态重置、查询后清除所选、必填报错、未保存 Escape/继续/放弃、焦点返回和 Tab 循环、停用默认项的提示均已检查。1440×1000、用户 1058×884、390×844、320×640 检查通过；手机取消右固定操作列避免遮住品名，表格自身横向滚动，表单底部固定，详情时间线末尾可达。最终读取错误日志为空。InputNumber 验证使用实际按键输入及 Tab 提交；自动 fill 对该组件不会提交值，未以该动作作为改价成功证据。

本轮检测器运行一次，新档案页面与表单无命中；共享 CSS 保留 7 项已有字号/图标阶梯提示，旧 COMP_ROUND_OPEN 对应另一库存设计任务。截图含手动新增的 CP-007、GYS-005、GH-008 及修改后的默认和价格：[产品桌面](../.impeccable/review/purchase-tdesign/catalog-products-desktop.png)、[供应商桌面](../.impeccable/review/purchase-tdesign/catalog-suppliers-desktop.png)、[采购方桌面](../.impeccable/review/purchase-tdesign/catalog-companies-desktop.png)、[供货时间线](../.impeccable/review/purchase-tdesign/catalog-supply-detail.png)、[用户窗口](../.impeccable/review/purchase-tdesign/catalog-user-1058.png)、[手机列表](../.impeccable/review/purchase-tdesign/catalog-mobile.png)、[手机表单](../.impeccable/review/purchase-tdesign/catalog-supplier-form-mobile.png)、[手机时间线末尾](../.impeccable/review/purchase-tdesign/catalog-timeline-mobile.png)。其余同批证据为相同目录 `catalog-*.png`，仅代表本地样板。

## 基线入口与运行

侧栏完善验证（2026-10-17）：最终专用 TypeScript 检查通过。浏览器逐一切换 14 个入口，核对模块及面包屑；采购申请查询后切换页面再返回仍保留关键词与单条结果。展开/收起、折叠子菜单的 Enter、Tab、方向键、Home/End、Escape 和焦点返回通过；390px 抽屉的 Shift+Tab 首尾循环、背景 inert、选页关闭、Escape 返回、分组切换不抢焦点及跨断点关闭恢复通过。1440×1000、1058×600、390×844、320×640 视觉检查及 320/680/681px 边界无页面横向溢出；短屏菜单独立滚动，320px 导航宽度限制为 272px。原申请表单打开与关闭回归通过；过程中观察到 TDesign Select 自身在处理 Escape 时的空浮层节点异常，未阻止关闭，本轮未更改 Select。导航复查未产生新增错误。布局检测器本轮结果为空，旧 COMP_ROUND_OPEN 不属于本样板。未更改业务数据逻辑，复用上一批 25 项通过结果；无生产或后端改动，未重跑生产构建及后端测试。截图包含手动展开/收起状态：[桌面分组](../.impeccable/review/purchase-tdesign/navigation-desktop.png)、[图标栏子菜单](../.impeccable/review/purchase-tdesign/navigation-collapsed.png)、[短屏滚动](../.impeccable/review/purchase-tdesign/navigation-short.png)、[手机导航](../.impeccable/review/purchase-tdesign/navigation-mobile.png)。

2026-10-17，使用 `tdesign-react 1.18.3`。React 19 适配仅在 [样板入口](../scripts/fixtures/purchase-request-tdesign/entry.tsx) 引入；实现见 [列表与详情](../scripts/fixtures/purchase-request-tdesign/main.tsx)、[申请表单](../scripts/fixtures/purchase-request-tdesign/RequestForm.tsx)、[局部样式](../scripts/fixtures/purchase-request-tdesign/preview.css)、[合成数据](../scripts/fixtures/purchase-request-tdesign/data.ts) 和 [专用类型检查配置](../scripts/fixtures/purchase-request-tdesign/tsconfig.json)。

处理扩展入口见 [四个处理页面](../scripts/fixtures/purchase-request-tdesign/ProcessingPages.tsx)、[共享弹窗](../scripts/fixtures/purchase-request-tdesign/PreviewDialog.tsx)、[处理数据与本地流转](../scripts/fixtures/purchase-request-tdesign/processing-data.ts) 和 [数据断言测试](../scripts/fixtures/purchase-request-tdesign/processing-data.test.mjs)。

出货扩展入口见 [三个出货页面](../scripts/fixtures/purchase-request-tdesign/ShippingPages.tsx)、[排期、选货与物流表单](../scripts/fixtures/purchase-request-tdesign/ShippingForms.tsx)、[来源余额与事件流转](../scripts/fixtures/purchase-request-tdesign/shipping-data.ts)、[出货数据断言测试](../scripts/fixtures/purchase-request-tdesign/shipping-data.test.mjs) 和 [局部 surface brief](../.impeccable/surfaces/ixtures-purchase-request-tdesign-shippingpages-tsx.md)。出货扩展完成时主入口共八页，其中三个出货页面共享独立合成数据；核对确认量与物流分配量分别计量，时间线覆盖初始样例及后续选货、确认、分配、导出、发送和物流维护事件。

统一详情使用 [共享抽屉](../scripts/fixtures/purchase-request-tdesign/DetailDrawer.tsx) 与 [时间线样例模型](../scripts/fixtures/purchase-request-tdesign/history.ts)。

运营与库存扩展见 [三个运营页面](../scripts/fixtures/purchase-request-tdesign/OperationsPages.tsx)、[补货与刊登表单](../scripts/fixtures/purchase-request-tdesign/OperationsForms.tsx)、[本地来源、申请与库存投影](../scripts/fixtures/purchase-request-tdesign/operations-data.ts) 和 [数据断言](../scripts/fixtures/purchase-request-tdesign/operations-data.test.mjs)。出货及运营表单复用 [PreviewForm](../scripts/fixtures/purchase-request-tdesign/PreviewForm.tsx) 的标签、未保存保护和固定底部，弹层继续使用 PreviewDialog；后者在打开时同时关联 input 与 textarea 标签，并跳过禁用字段设置焦点。

订单处理扩展见 [三个订单页面](../scripts/fixtures/purchase-request-tdesign/OrderPages.tsx)、[登记、跟进与分包表单](../scripts/fixtures/purchase-request-tdesign/OrderForms.tsx)、[本地订单与补发流转](../scripts/fixtures/purchase-request-tdesign/order-data.ts)、[数据断言](../scripts/fixtures/purchase-request-tdesign/order-data.test.mjs) 和 [订单 surface brief](../.impeccable/surfaces/s-fixtures-purchase-request-tdesign-orderpages-tsx.md)。共用表单标签在初次弹窗打开和动态增删行后关联，字段标识保持稳定；详情切换关联记录时回到资料顶部。侧栏随页面增加支持内部滚动，业务列表保留状态页签和筛选记忆。

当前在独立的 `D:\codex\UI` 项目根目录运行（与 ERP 生产工程完全分离）：

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm test
```

直接打开 [项目根入口](http://127.0.0.1:5182/)；原 [样板入口](http://127.0.0.1:5182/scripts/fixtures/purchase-request-tdesign/index.html)仍可用于旧书签。当前 `pnpm build` 会同时打包这两个入口的完整 44 页样板，生成 `dist/`；`pnpm test` 运行迁入的 22 个样板测试文件。下列首版申请页记录属于迁出前的历史验证，当时 ERP 的生产构建不打包 fixture，不代表当前独立项目的构建范围。指向 `../../erp/` 的业务规范与正式代码链接仅供设计参照，运行和构建不依赖 ERP。

首版申请页历史验证结果：

- 检查通过：`pnpm exec tsc -p scripts/fixtures/purchase-request-tdesign/tsconfig.json`、`pnpm run build`，以及相关 9 个路径的 `verify:context`（0 error、0 warning）；构建仍有既有大包与 Zod 注释警告。
- 浏览器实测通过：搜索空结果与重置、状态键盘 Enter 切换、分页、选择后 CSV 导出、详情、必填校验、已知装箱数时 13 被拒而 360 通过、未知装箱数时 7 通过、取消确认与继续填写，以及提交后本地新增和成功提示。
- 已检查 1440×900、1280×720、390×844：窄屏表格内部横向滚动，表单头尾固定。截图见 [桌面列表](../.impeccable/review/purchase-tdesign/desktop-list.png)、[1280 列表](../.impeccable/review/purchase-tdesign/user-1280-list.png)、[桌面表单](../.impeccable/review/purchase-tdesign/desktop-form.png)／[下部](../.impeccable/review/purchase-tdesign/desktop-form-lower.png)、[窄屏列表](../.impeccable/review/purchase-tdesign/mobile-list.png)、[窄屏表单](../.impeccable/review/purchase-tdesign/mobile-form.png)／[下部](../.impeccable/review/purchase-tdesign/mobile-form-lower.png)。
- 独立评审发现的 Dialog 焦点约束问题已修复：背景与父弹窗 `inert`、首尾 Tab 循环、关闭按钮标签、关闭后焦点恢复；主表单及放弃确认的双向 Tab 和焦点返回均实测通过。[评审记录](../.impeccable/review/purchase-tdesign/review.json)结论为 `ship`，范围仅限本地样板，不代表生产审核通过。

## 采购处理扩展

本次采购处理扩展验证结果：

- 专用类型检查通过；`node --test scripts/fixtures/purchase-request-tdesign/processing-data.test.mjs` 的 3 项测试通过。仅修改 fixture，复用此前生产构建结果；无后端变更，未运行后端测试。
- 浏览器通过四页导航与键盘 Enter、搜索空态及重置、必填供应商错误定位、装箱数 24 时拒绝 481／接受 480、未保存时继续编辑；复审通过后需求计数为 13，预览数量 120 并生成示例订单后订单计数为 6。
- 两项评审发现已修复：样例整箱拆分调整为 168／192，分组预览数量核对为 512；调整原因保存并可在详情查看，界面实测计划数量 360 → 372 及原因保留。复评结论为 `ship`，仅限此独立样板。
- 检查 1440px 桌面全页与 1440×900 弹窗、实际用户宽度 1058px、390×844 移动端；后两者无文档横向溢出。弹窗正向 Tab 循环与背景根节点 `inert` 实测通过。截图为 `.impeccable/review/purchase-tdesign/processing-*.png`，交互结果见 [处理页检查记录](../.impeccable/review/purchase-tdesign/processing-checks.json)。
- 检测器对字号 16／18px、图标 26／28px 偏离全局阶梯的提示仅作参考；此样板采用用户指定的 TDesign 风格，未改写全局设计规范。既有 `COMP_ROUND_OPEN` 项与本次范围无关。

## 后续扩展验证

详情时间线补齐验证（2026-10-17）：专用类型检查与扩展后的 6 项数据测试通过。浏览器检查五页详情入口、审批驳回分支、新建仅一条提交记录、修改 360 → 372 与原因保留、复审通过和订单 PO-DEMO-0006 的 372 件下单记录；重开详情不追加记录。1058px 桌面双列、390×844 窄屏单列均无横向溢出；窄屏可滚动至最后节点，底部关闭固定；Tab 首尾循环及 Escape 返回原入口通过。截图见 [申请时间线](../.impeccable/review/purchase-tdesign/timeline-request.png)、[处理时间线](../.impeccable/review/purchase-tdesign/timeline-processing.png)、[订单来源时间线](../.impeccable/review/purchase-tdesign/timeline-order.png) 和 [窄屏时间线](../.impeccable/review/purchase-tdesign/timeline-mobile.png)。仍仅验证独立样板，无生产或后端变更。

出货处理扩展验证（2026-10-17）：专用类型检查通过；`node --test scripts/fixtures/purchase-request-tdesign/shipping-data.test.mjs scripts/fixtures/purchase-request-tdesign/processing-data.test.mjs` 共 12 项通过，初始时间线补齐后再次通过出货 6 项及类型检查。`pnpm run build` 通过，仍有既有 Zod 注释与大包警告；生产构建不打包 fixture，无后端变更或后端测试。浏览器通过搜索重置、草稿必填定位与保存、未保存确认、排期确认、空来源、供应商分组与核对确认、混仓拒绝并保留选择、整箱余额、建单导出与本地发送记录、空运单定位与登记、物流原文保存且不自动改变阶段。检查 1440×900 及全页、实际用户宽度 1058px、390×844：内部表格滚动、无文档横向溢出、窄屏选择合计与分页可用、详情时间线末尾可达且关闭固定；桌面抽屉与移动表单焦点循环、抽屉 Escape 恢复及背景 `inert` 通过。独立完成评审检查 13 张截图与相关代码，结论 `ship`、无实质问题；该评审未独立重跑浏览器或测试，结论仅限本地样板。检测器仅保留与已批准 TDesign 一致的 5 项既有字号提示。

出货截图均来自本地合成数据：[核对桌面](../.impeccable/review/purchase-tdesign/shipping-preparation-desktop.png)、[物流桌面](../.impeccable/review/purchase-tdesign/shipping-dispatch-desktop.png) 为新初始化状态；[排期桌面](../.impeccable/review/purchase-tdesign/shipping-schedule-desktop.png)、[窄屏建单](../.impeccable/review/purchase-tdesign/shipping-create-mobile.png)、[窄屏详情](../.impeccable/review/purchase-tdesign/shipping-detail-mobile.png) 等交互截图包含手动流转后的状态，其余同批截图位于 `.impeccable/review/purchase-tdesign/shipping-*.png`。

运营与库存扩展验证（2026-10-17）：本批后样板共 11 页；operations、shipping、processing 三套数据测试共 18 项通过，最新运营 6 项及最终专用类型检查再次通过。生产代码未变，复用上一批构建结果（不打包 fixture）；未运行后端测试。浏览器通过补货必填、24 件/箱时拒绝 49／接受 48、跨组货源确认后仅预留一次（可用 480 → 432）、未保存保护及数量错误定位；刊登完成本地选图/移除/预览、驳回修改重提、审批分配 `DEMO-EAN-000007`，补充 ASIN/品牌后 EAN 保留；库存来源展开、异常待核对及搜索重置通过。1440px、实际 1058px、390×844 检查通过，涵盖抽屉 Shift+Tab／Escape 与背景 `inert`、移动表单焦点和固定底部、来源浮层换行无溢出，以及共享表单提取后的物流建单开关回归。独立评审查看 17 张截图及相关代码，结论 `ship`、无实质问题，未独立运行浏览器或测试；检测器仍仅有 5 项既有 TDesign 字号提示。局部规则见 [运营 surface brief](../.impeccable/surfaces/tures-purchase-request-tdesign-operationspages-tsx.md)。截图见 [1058px 补货列表](../.impeccable/review/purchase-tdesign/operations-replenishment-user.png)、[窄屏刊登表单下部](../.impeccable/review/purchase-tdesign/operations-listing-form-mobile-lower.png)、[库存来源详情](../.impeccable/review/purchase-tdesign/operations-inventory-detail.png)，其余为同目录 `operations-*.png`；手动流程截图含第 7 条申请，初始为 6 条。选图测试使用仓库 `public/xingdi-mark.png`，截图中的标志仅证明本地文件读取，并非商品实拍；历史样例缺主图有说明，新建及重提主图必填。结论仅限内存样板，不覆盖正式 EAN 池、生产权限与并发或实际出库/退回。

订单处理扩展验证（2026-10-17）：本批后共 14 页；订单 7 项、运营/出货/采购处理各 6 项，共 25 项数据测试通过，最终专用类型检查通过。复用此前生产构建结果（不打包 fixture），本批未重跑生产构建；无生产或后端改动，未运行后端测试。浏览器通过同单全明细与批量范围、保留备注、人工登记、数量上限、换货联动创建、两包裹超额拒绝、显式运输状态、删除原因与历史保留、独立申请不猜关联、自建店铺、人工重开/结案及搜索重置。1440px、实际 1058px、390×844 无页面横向溢出；抽屉与手机表单键盘焦点、Escape、背景 `inert`、未保存保护、长表单固定底部及时间线末条可达通过。动态商品 13 字段、包裹增删后 15 字段均标识唯一且无未标注字段，既有物流表单 5 字段回归通过。独立评审先检查 20 张截图及实现，发现包裹资料、等总量商品调整和混合备注历史不完整；已改为按字段及逐商品记录前后值并补回归断言，复评检查代码、断言与三张更新截图后结论 `ship`，无剩余实质问题；评审未独立运行浏览器或测试。检测器本轮运行一次，仅 5 项既有 TDesign 字号提示。21 张 `orders-*.png` 均为本地示例，包含手动流转状态；代表截图为[每日发货桌面](../.impeccable/review/purchase-tdesign/orders-daily-desktop.png)、[补发详情](../.impeccable/review/purchase-tdesign/orders-reshipment-detail.png)、[窄屏发货历史](../.impeccable/review/purchase-tdesign/orders-shipping-history-mobile.png)，后两张包含最终历史修复。验收仅限上述内存样板与人工流程。




## 列表单行筛选与操作工具条（2026-10-18）

目标：在独立 TDesign 样板的列表页，将新建、关键词与常用条件、查询/重置、辅助操作排列在同一行；窄屏将次要条件和操作收进可展开的面板。本节取代前面各扩展批次对双列/两行筛选、查询重置固定在右侧、导入导出固定在左侧的布局约定；前文对数据含义、文件范围、状态和权限的约定继续有效。工作台首页、日历、登录、详情、表单、系统设置、业务助手及无筛选操作的队列保持各自布局。页面覆盖与排除项见[覆盖矩阵](remaining-tdesign-coverage.md#列表工具条覆盖)。

实现入口为 [ListFilterToolbar](../scripts/fixtures/purchase-request-tdesign/ListFilterToolbar.tsx) 和 [局部样式](../scripts/fixtures/purchase-request-tdesign/preview.css)。调用页明确传入 `fields`、`create`、`query`、`reset`、`actions`、`batch`，不从按钮顺序推断业务含义。新建维持主按钮；查询在无新建页可作主按钮；重置为文字按钮；文件及批量操作为次按钮。隐藏条件在触发按钮显示已填数量；有默认选中但不代表额外筛选的页显式提供 `active`。即时筛选页不添加虚假的查询动作。桌面控件约 34px，触屏操作约 44px；按容器宽度逐步收起字段，最窄时合并筛选与操作。展开面板支持 Escape、关闭按钮与操作后的焦点返回。

边界：各页原有草稿/已应用筛选、分页、选择、批量禁用、导入/导出范围及空态语义继续由原页面管理；工具条只调整呈现和操作位置。文件操作仍是本地样板，未改变 API、权限、迁移或生产数据。验证须覆盖 1440、1058、390、320px 的所有适用页面、弹层操作和键盘焦点；以 fixture TypeScript、相关数据断言、生产构建及 scoped context 检查作为交接门槛。

上一轮交接验证（2026-10-18）：40 个适用页面在 1440、1058、320px 核对单行工具条及页面横向边界；390px 抽样采购申请、库存和品牌。采购申请展开筛选在 320/390/1440px、EAN 在 390px 另量测面板边界，均未越出视口。采购申请 320px 面板实测左 24px、右 281px，页面滚动宽 305px；390px 面板左 24px、右 351px，页面滚动宽 375px。库存隐藏条件计数、先查询后应用与重置，EAN 导入/导出、弹窗关闭后的焦点返回也经浏览器核对；EAN 从 390px 已展开筛选切回 1265px 时，消失的触发按钮将焦点移交给可见关键词输入。fixture TypeScript 通过，21 个数据测试文件共 86 项通过，生产构建通过（它不打包 fixture），22 路径 scoped context 检查 0 error/0 warning。证据见[采购 1058px](../.impeccable/review/purchase-tdesign/single-row-toolbar/purchase-user-1058.png)、[采购展开 320px](../.impeccable/review/purchase-tdesign/single-row-toolbar/purchase-filters-open-320.png)、[采购展开 390px](../.impeccable/review/purchase-tdesign/single-row-toolbar/purchase-filters-open-390.png)、[采购展开 1440px](../.impeccable/review/purchase-tdesign/single-row-toolbar/purchase-filters-open-1440.png)、[EAN 展开 390px](../.impeccable/review/purchase-tdesign/single-row-toolbar/ean-filters-open-390.png)、[品牌合并 320px](../.impeccable/review/purchase-tdesign/single-row-toolbar/brand-merged-320.png)。

### 自然流布局与字段语义修订（2026-10-19）

本修订取代本节此前的均等 8px 间距、外置字段标签、固定最多三项条件及右侧弹性空白布局；40 个适用列表页沿用同一工具条。主行按新建、原顺序筛选、更多筛选、查询、重置、辅助动作自然向右排列。新建为实心主按钮；有新建时查询为蓝色描边，无新建时查询仍可作实心主按钮。筛选之间约 12px，主操作与筛选、筛选与查询约 24px，查询与重置约 8px；极窄屏的新建与筛选入口缩为 8px，以保证带已选数量的入口不越界。

共享布局按工具条实际容器宽度、当前按钮文字与操作宽度计算，规划逻辑见[布局函数](../scripts/fixtures/purchase-request-tdesign/list-filter-toolbar-layout.ts)及其[边界测试](../scripts/fixtures/purchase-request-tdesign/list-filter-toolbar-layout.test.mjs)。关键词、普通下拉、日期范围分别以 280px、160px、260px 的可读下限参与收纳计算；所有可见筛选字段从这些宽度伸展，吸收按钮及固定间距之外的可用宽度，不设最大宽度，按钮宽度由隐形测量副本取得。先收纳辅助动作，再从末尾逐项收纳条件；查询与重置只有主行仍放不下时才进入筛选面板，极窄屏可合并筛选与操作。全部条件能放下时不显示空的更多筛选入口，不把上一次已伸长的字段宽度当作下一次的硬需求。

主行隐藏外置文字标签，但保留 label 的可访问名称；空值下拉使用明确的业务提示，已有选值的下拉在控件内部显示字段前缀。日期范围两端分别有可见提示与完整 aria 名称，长的计划出货提示缩写为「计划出货开始/计划出货结束」。更多筛选面板保留正常标签。面板关闭或尺寸变化导致持焦控件移除时，仅在焦点属于工具条的前提下移交给仍可见的筛选或操作。各页原有筛选值、draft/applied 查询、批量禁用与文件范围不变。

本轮调用页字段语义修订见[品牌定价](../scripts/fixtures/purchase-request-tdesign/BrandPricingPages.tsx)、[目录](../scripts/fixtures/purchase-request-tdesign/CatalogPages.tsx)、[运营](../scripts/fixtures/purchase-request-tdesign/OperationsPages.tsx)和[门店信息](../scripts/fixtures/purchase-request-tdesign/StoreInformationPages.tsx)。手机日期弹层在 320px 下改为两个月纵向滚动，宽度随视口收敛、弹层高度限于剩余屏幕；两端日期仍可跨月选择。

本轮验证（2026-10-19）：浏览器遍历 40 个适用页的 1600、1058、320px 工具条，确认单行、主行无外置标签及无页面横向溢出；1440px 抽查侧栏展开/收起，390px 抽查采购和品牌合并操作，另核对 320px 初始加载后放大、已选隐藏条件、长批量操作和焦点移交。采购日期面板在 320px 下弹层与页面的滚动宽度均等于各自可见宽度，周日列完整，两个月份的日期可跨月选择。证据见[采购 1600px](../.impeccable/review/purchase-tdesign/natural-flow-toolbar-20261018/purchase-wide-1600.png)、[采购 320px](../.impeccable/review/purchase-tdesign/natural-flow-toolbar-20261018/purchase-320.png)、[最终手机日期弹层](../.impeccable/review/purchase-tdesign/natural-flow-toolbar-20261018/date-popup-mobile-320-final.png)。本轮重跑 fixture TypeScript、4 项工具条布局边界测试及生产构建，均通过；生产构建不打包 fixture，已有第三方注释与大包体提示不影响构建。上一轮的 21 个数据测试文件及其 86 项结果是旧布局时的记录，本轮业务数据逻辑未改，未重跑。

### 主行填满修正（2026-10-19）

用户反馈宽屏仍留空，本次取消主行字段的 CSS 最大宽度。字段仍以 280/160/260px 可读下限参与收纳规划，但渲染时共同吸收剩余空间；按钮保留固有宽度，控件顺序及 12/24/8px 间距不变。无可见字段的极窄行允许尾部留空，不拉伸按钮，也不以伸展后的实际宽度反推收纳门槛。

浏览器实测采购申请 1920px 视口下工具栏宽 1577px，关键词/采购类型/站点/日期宽分别约 371/251/251/351px，末尾按钮距工具栏右缘 0px；1600、1440、1058px 有可见字段时也均为 0px。1440px 收起侧栏后四字段完整显示、末尾距离仍为 0px；390/320px 仅按钮行分别留 95/25px，无页面横向溢出。库存少字段与品牌多操作页面在宽屏末尾均贴齐，窄屏仍按原顺序收纳；独立复核另核对 EAN 和产品主档。证据见[采购 1920px](../.impeccable/review/purchase-tdesign/fill-toolbar-20261019/purchase-1920-after.png)、[采购 1600px](../.impeccable/review/purchase-tdesign/fill-toolbar-20261019/purchase-1600-after.png)、[侧栏收起 1440px](../.impeccable/review/purchase-tdesign/fill-toolbar-20261019/purchase-1440-sidebar-collapsed-after.png)、[库存 1920px](../.impeccable/review/purchase-tdesign/fill-toolbar-20261019/inventory-1920-after.png)、[品牌 1920px](../.impeccable/review/purchase-tdesign/fill-toolbar-20261019/brand-1920-after.png)。本次 fixture TypeScript 与原有 4 项布局测试通过；生产构建复用同日上一轮结果，因为生产构建不包含 fixture，本次仅改 fixture CSS 和交接文档。业务数据逻辑未改，未重跑数据测试。

## 采购申请长列表样例（2026-10-19）

为查看实际下滑效果，仅将采购申请的[本地合成记录](../scripts/fixtures/purchase-request-tdesign/data.ts)从 23 条增至 120 条，[默认分页](../scripts/fixtures/purchase-request-tdesign/main.tsx)由 10 改为 50 条，并增加 100 条/页选项。前 23 条的编号、字段、顺序及详情时间线保持原样，新增 97 条使用稳定且唯一的编号、合法跨月日期及既有产品、状态、人员与站点组合；处理页仍仅引用原前 18 条，首页引用的原编号继续有效。保留真实分页、表格横向滚动和现有页面纵向滚动，不增设固定表头或新的滚动区域。

长表下滑时发现 TDesign 固定左右列高于 sticky 顶栏；[局部样式](../scripts/fixtures/purchase-request-tdesign/preview.css)为表格滚动区域建立独立堆叠上下文，使固定列保持在顶栏之下。浏览器在 1058px 宽、首屏页底核对顶部说明按钮位于固定列之上，表格内部横向滚动仍可操作，后段记录详情抽屉及其时间线可打开。默认 50 条时表格 50 行、总计 120 条/3 页；向下滚动的中段与底部均可达，100 条/页为 2 页，末页 20 条。证据见[首屏顶部](../.impeccable/review/purchase-tdesign/scroll-sample-20261019/purchase-50-top.png)、[滚动中段](../.impeccable/review/purchase-tdesign/scroll-sample-20261019/purchase-50-middle.png)、[1058px 页底顶栏](../.impeccable/review/purchase-tdesign/scroll-sample-20261019/purchase-50-bottom-1058-topbar.png)、[末段详情](../.impeccable/review/purchase-tdesign/scroll-sample-20261019/purchase-last-detail-1058.png)。专用 fixture 类型检查、原 6 项处理数据测试通过；一次性断言核对 120 条、唯一编号、日期/时间线/整箱数量和前 23 条逐字段不变。生产构建不打包本 fixture，复用同日已通过的构建结果。
