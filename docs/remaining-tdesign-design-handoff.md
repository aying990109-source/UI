# 剩余 TDesign 样板 C–F 段设计交接

核对日期：2026-10-18。此交接承接 [采购申请 TDesign 样板设计](purchase-request-tdesign-preview-design.md)的 A/B 段和[剩余覆盖矩阵](remaining-tdesign-coverage.md)。对象是 `scripts/fixtures/purchase-request-tdesign/` 内的合成交互样板；ERP 的生产代码、API、数据库、权限与部署均不在本次改动范围，指向 ERP 的链接仅作设计参照，独立样板运行不依赖 ERP。入口继续使用上方左侧主操作、TDesign 表格/表单、右侧详情及完整时间线；不把本地状态视为生产写入。

当前项目位于 `D:\codex\UI`，在该目录运行 `pnpm dev`、`pnpm build`、`pnpm test`；独立构建包含完整 44 页。下文旧“生产构建不打包 fixture”的记录仅是迁出前 ERP 工程的历史限制。

## C 跨境数据：销售与目标

- **目标与角色。** 销售数据提供月份、组织、金额状态筛选及详情、导出；目标管理面向目标维护者提供首次制定和修订、年度/月度精确合计、进度说明与版本历史。销售事实与目标计划独立。
- **数据与口径。** 合成销售月保留销售日归属、原币金额、汇率和来源状态。来源失败、未采集、汇率待核验与未来月份不补零；只在完整月份范围内计算正式实际额及达成率，部分已取得金额另列。未来年度显示“期间未开始”，不把零个应观察月份显示为已完成。目标金额以整数分保存，年度与覆盖月份总和一致；修订锁定已结束月份，原目标不随修订覆盖。
- **交互与错误。** 筛选草稿需查询才应用；修改条件后旧结果保留但禁用详情/导出，重置清除。目标表单月度、总额、修订方式和原因均参与未保存保护；错误保留输入并聚焦。详情保留来源证据和目标修订时间线。
- **契约与验证。** 仅合成数据，不连接销售采集或汇率接口。规则见 `sales-target-data.ts`，页面见 `SalesTargetPages.tsx`；`sales-target-data.test.mjs`覆盖来源、进度、版本及精度，另做 2027 未来目标与未保存草稿浏览器核对。

## D 基础配置：人员、组织、权限与归属

- **目标与对象。** 人员与组织页包含部门、小组、有效人员、角色绑定、部门经理、经理本人申请的审批人和小组负责人；角色权限页显示功能读写范围；单据归属页只确认待核对历史快照；权限记录只读本地审计。合成开户只建立人员记录，不签发凭据。
- **授权语义。** 全公司查看覆盖本人编辑；本组与负责小组没有静态大小关系。内置管理员的功能配置只读，不能移除最后一名有效内置管理员；角色创建/维护检查读写范围、版本与原因。组长移动或停用前先交接；经理或替代审批人不能留下无效职责，经理本人申请的审批人不能是经理本人。经理已属本部门时转为部门直属，任命本身不自动跨部门调动；部门与小组从属关系必须一致。历史单据归属快照不因人员调组或部门更名自动改写。
- **交互与异常。** 每项保存预先同步校验，再更新局部状态；失败保留表单并聚焦错误。部门和人员详情有完整本地时间线，列表可筛选；归属已确认后不可任意转组。部门/小组移除、批量真实开户、敏感管理重验、生产权限启用和真实审计保留为生产边界。
- **契约与验证。** 规则和页面位于 `access-preview-data.ts`、`AccessPreviewPages.tsx`；`access-preview-data.test.mjs`覆盖范围覆盖、版本、最后管理员、组长交接、经理直属及历史快照。正式语义以 [权限链路](../../erp/docs/access-workflows.md)为准。

## E 工作台、账号及支持入口

- **首页（2026-10-19 修正）。** 一级导航只有“首页”一个直接入口，个人待办、业务与团队队列、工作日历均为首页内的内容区；页内链接只定位，不切换页面。个人待办状态筛选、完整来源队列、日历日期明细和活动维护保留。首页区分个人待办、业务待办和团队事项；个人项可完成/恢复，计划日期与实际完成时间独立，完成后先恢复再编辑。业务和团队队列是可跳转的合成来源快照，不在首页勾选完成；来源编号与对应样板记录可核对，但不是实时自动投影。日历同日分别列未完成个人、业务/团队、活动、已完成个人；国家、平台、类型、关注条件只筛活动。活动按当地日期，工作台今天按北京时间。来源未知/采集失败显式展示，人工维护与候选复核保留版本、原因和历史；关注、建议采纳、关联待办独立，活动改期不改个人计划日期。
- **账号与资料。** 登录示例只用固定合成凭据反馈本地会话；不创建真实 Cookie、挑战证明或账号。个人资料演示五个扩展字段和独立头像草稿；选择图片或颜色只预览，保存才替换，取消保留原头像。用量视图明确无真实模型计量，不展示伪造账单。正式身份、权限、图片解码与用量均以 [权限](../../erp/docs/access-workflows.md)、[个人资料](../../erp/docs/profile-workflows.md)为准。
- **帮助与助手。** 帮助按任务搜索并阅读前提、步骤、结果及边界；助手只匹配固定本地说明，回复附可点引用，未知问题明确未知。无模型调用、业务数据读取、真实会话历史或来源授权的假模拟。正式规则参见 [帮助设计](../../erp/docs/help-documentation-design.md)与[助手链路](../../erp/docs/agent-workflows.md)。
- **验证。** `workbench-preview-data.test.mjs`检查个人状态、建议选日、活动版本与候选；`support-preview-data.test.mjs`检查引用及未知回答。浏览器覆盖关联活动直接建待办、未来日期/来源筛选、资料草稿取消与保存、帮助阅读、助手引用、桌面/窄屏键盘路径。

## 独立登录页补充（2026-10-18）

以 [LoginPreview](../scripts/fixtures/purchase-request-tdesign/LoginPreview.tsx) 替换工作台内部的登录示例，沿用 TDesign。直接入口为 `index.html#login`；2026-10-19 起统一从顶部头像菜单登录或退出，不再放入侧栏和个人资料操作区。[凭据规则](../scripts/fixtures/purchase-request-tdesign/login-preview-data.ts)仅同步校验固定合成账号；登录态仍为内存演示，业务样板不受其鉴权。凭据不持久化、不发请求，生产认证、ALTCHA 与权限逻辑未改动。

用户已确认[静态效果稿](../.impeccable/review/purchase-tdesign/login-static/approved.png)，在 `codex/tdesign-login-static` 实现，无需重新选择设计方向。全页采用白色/浅灰底、左侧无外框表单和右侧大型立体插图；标题为两行“登录到 / 企业运营工作台”。[局部样式](../scripts/fixtures/purchase-request-tdesign/login-preview.css)按用户对输入框过大的反馈，将桌面表单固定为 400px 宽、输入和提交控件固定为 40px 高、输入文字固定为 14px，标题保留 34–48px；不超过 1050px 时隐藏插图、居中 400px 表单，不超过 680px 时使用 24px 边距、30px 标题、48px 输入及提交控件，其他主要操作目标至少 44px。以上均为本页面选择，不更新全局 `DESIGN.md`、`PRODUCT.md` 或设计令牌。

真实 TDesign Input、Button 与官方图标承担交互，品牌复用既有 SVG；保留视觉隐藏且关联输入的标签、显示/隐藏密码、Enter 提交、行内错误、错误字段聚焦及失败后保留输入。“登录遇到问题？”展开帮助和演示凭据，仍通过显式按钮填入。成功进入首页、退出清空登录字段，合成校验和已挂载业务页的内存状态行为不变。[背景 WebP](../scripts/fixtures/purchase-request-tdesign/assets/login-background.webp)为 1672×941、44,674 字节，由批准稿生成背景后仅作编码转换；[来源侧记](../scripts/fixtures/purchase-request-tdesign/assets/login-background.webp.json)保留准确提示词与参考图。

本轮[验证记录](../.impeccable/review/purchase-tdesign/login-static/validation.json)记录 fixture 类型检查、登录/支持规则共 2 项和生产构建通过；浏览器覆盖错误及聚焦、帮助及填入凭据、Tab/Space/Enter、登录、退出清空和旧动态 URL。1672×941、1440×810、1058×884、390×844、320×844 截图有效且无横向溢出。初版独立 [finish review](../.impeccable/review/purchase-tdesign/login-static/review.md)结论为 **ship**，无实质缺陷；初版自动图像比较约 92% 仅作辅助证据，不覆盖后续紧凑尺寸调整。既有 Zod/包体积警告及 9 项局部字号提示保留；无关全局 shipping 状态的 `COMP_ROUND_OPEN` 不构成检测器全绿。未实测屏幕阅读器、真实软键盘、跨浏览器或生产认证。本轮 scoped `verify:context` 已通过：0 errors、0 warnings。

[早期验证](../.impeccable/review/purchase-tdesign/login-validation.json)与[早期评审](../.impeccable/review/purchase-tdesign/login-review.md)仅作为未变行为的历史证据，不再代表当前视觉稿；[页面构建记录](../.impeccable/surfaces/tdesign-login.md)保存当前局部设计约定及截图链接。

## F 预留功能与文件入口

### 登录动态背景方案已取代

此前 A/B/C 动态候选已被用户确认的静态稿取代，动态原型文件及选择器已删除。[入口](../scripts/fixtures/purchase-request-tdesign/entry.tsx)统一装配当前 [LoginPreview](../scripts/fixtures/purchase-request-tdesign/LoginPreview.tsx)；旧 `?prototype=login-motion&variant=B#login` 也显示相同静态页，无 canvas。当前实现和验收以上述独立登录页补充及其最终证据为准。

- **独立物品管理。** 用户确认基础物品清单/资料维护；编号、名称、类别、单位、启停、版本与时间线独立于产品主档、库存和采购关系。必填/重复/版本错误不得关闭表单或虚报成功。
- **系统设置。** 只保存显示密度和默认首页到当前浏览器本地存储；当前页不自动跳转，刷新后按偏好进入。恢复默认不更改权限、安全或生产配置。这两个预留功能仍是生产占位，不把样板字段反向定义为生产合同。
- **品牌与店铺批量。** 品牌档案和授权使用不同 XLSX 模式；先预检，再逐行提交，错误行可携原始行号及原因回导。授权按品牌与覆盖范围的 canonical 关系保存，US/CA 同简称可能跨站点；直接维护时预览受影响站点/国家/小组。导出可写授权只选当前仍落在该范围的 SID；无当前覆盖的历史关系保留在本地 canonical 状态，不导出错误 SID。店铺归组另用 UTF-8 CSV，逐行预检后整批原子确认；已有业务引用不能随意转组。它不等于店铺信息 XLSX 回导。
- **验证与边界。** `utility-preview-data.test.mjs`、`brand-transfer-data.test.mjs`、`store-group-transfer.test.mjs`覆盖身份、版本、覆盖范围、文件表头与写入边界。实际 XLSX 工具在浏览器读取和下载，本地文件不上传；真实批次令牌、权限遮蔽、导入任务与跨系统事务不在样板内。

## 交付检查

完成后执行 fixture TypeScript、全部 fixture 规则测试、生产构建、`context:impact` 与 `verify:context`；浏览器核对新增入口、错误保留、详情至表单焦点返回、1440/1058/390/320px 下的可达性和无文档级横向溢出。已有 A/B 的浏览器证据复用，未变功能不重复跑整套后端。生产接入、真实授权及联网来源另作设计交接。

## 完成验证（2026-10-18）

fixture TypeScript 检查通过，全部 85 项本地规则测试通过，生产构建通过。新文档已接入任务上下文导航；`context:impact` 以本次文件范围核对，`verify:context` 的导航与工具回归通过。浏览器逐一点击 47 个侧栏叶子，均出现对应主标题和主区，记录见[导航核对](../.impeccable/review/purchase-tdesign/remaining-parent-navigation.json)。浏览器核对了部门错误保留与焦点、头像草稿取消/保存、物品错误焦点、Review 详情审批后焦点返回、活动详情编辑取消后焦点返回、品牌授权 US/CA 实际覆盖、品牌 XLSX 失败行修正回导、店铺归组 CSV 空批错误焦点及店铺资料回导；代表截图见[品牌重试](../.impeccable/review/purchase-tdesign/remaining-parent-brand-retry.png)和[头像资料](../.impeccable/review/purchase-tdesign/remaining-parent-avatar-profile.png)。320、390、1058、1440px 未观察到文档级横向溢出。收口时将个人待办表的最小宽度从长业务表规则中分离为 680px；1058px 截图中状态与操作完整可读，1280px 两列边界不重叠，320px 仍在表格内部滚动。见[待办表修复](../.impeccable/review/purchase-tdesign/final-workbench-1058.png)。浏览器错误日志保留此前热更新及已修复销售页异常的历史条目，不能据此宣称整个历史会话无错误。未运行全套后端测试，因为本次没有改生产后端；真实读屏、生产 API/权限、联网来源及持久化未验收。




## 2026-10-19 首页单页修正验收

首页恢复一个一级直达入口，删除个人待办、业务与团队队列、日历三个独立页面注册；三个内容区在首页完整展示。桌面、折叠侧栏及 390px 抽屉导航均可直达首页；页内定位、待办完成/恢复、日历按选中日期新建、普通新建不沿用日历日期、来源业务跳转已在浏览器核对。390px 未观察到文档级横向溢出。截图见 [首页](../.review/home-single-page-20261019/after.jpg) 和 [整页](../.review/home-single-page-20261019/after-full.jpg)。

类型检查和生产构建通过。默认并行测试首次因本机内存不足中断，使用 `node --test --test-concurrency=1` 对全部 22 个测试文件串行重跑，91 项通过、0 项失败。验证仅覆盖本地合成样板。
