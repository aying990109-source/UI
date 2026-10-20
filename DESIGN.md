---
version: "alpha"
name: "Enterprise Operations Workbench"
description: "A clear, restrained operations surface for request, approval, purchasing, and fulfillment work."
colors:
  dispatch-blue: "#2f6fca"
  dispatch-blue-strong: "#2458a8"
  dispatch-blue-soft: "#edf4ff"
  dispatch-blue-wash: "#f8fbff"
  cool-paper: "#f3f3f3"
  work-surface: "#ffffff"
  quiet-surface: "#f3f3f3"
  soft-surface: "#fafafa"
  deep-ink-blue: "#262626"
  secondary-ink: "#595959"
  muted-ink: "#737373"
  rule: "#e7e7e7"
  rule-strong: "#d9d9d9"
  success: "#147856"
  success-soft: "#e5f6ee"
  warning: "#a95c13"
  warning-soft: "#fff1dc"
  danger: "#bd3f4d"
  danger-soft: "#fdecef"
  info: "#23527d"
  info-soft: "#e7f0fa"
typography:
  # All text, including identifiers and previews, uses TDesign's --td-font-family.
  display:
    fontFamily: 'var(--td-font-family)'
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "0px"
  headline:
    fontFamily: 'var(--td-font-family)'
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0px"
  title:
    fontFamily: 'var(--td-font-family)'
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "0px"
  body:
    fontFamily: 'var(--td-font-family)'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0px"
  data:
    fontFamily: 'var(--td-font-family)'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "0px"
  label:
    fontFamily: 'var(--td-font-family)'
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "0px"
  mono:
    fontFamily: 'var(--td-font-family)'
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "0px"
rounded:
  sm: "3px"
  md: "4px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
motion:
  instant: "80ms"
  fast: "120ms"
  base: "180ms"
  deliberate: "240ms"
  easeOut: "cubic-bezier(0.2, 0, 0, 1)"
components:
  button-primary:
    backgroundColor: "{colors.dispatch-blue}"
    textColor: "{colors.work-surface}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "38px"
  button-primary-hover:
    backgroundColor: "{colors.dispatch-blue-strong}"
    textColor: "{colors.work-surface}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "38px"
  button-secondary:
    backgroundColor: "{colors.work-surface}"
    textColor: "{colors.deep-ink-blue}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "38px"
  input-default:
    backgroundColor: "{colors.work-surface}"
    textColor: "{colors.deep-ink-blue}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 11px"
    height: "38px"
  navigation-active:
    backgroundColor: "{colors.work-surface}"
    textColor: "{colors.dispatch-blue-strong}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "42px"
  tab-active:
    backgroundColor: "{colors.dispatch-blue-soft}"
    textColor: "{colors.dispatch-blue-strong}"
    typography: "{typography.title}"
    rounded: "0px"
    padding: "0 18px"
    height: "42px"
  status-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "24px"
  surface:
    backgroundColor: "{colors.work-surface}"
    textColor: "{colors.deep-ink-blue}"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Design System: Enterprise Operations Workbench

## 当前规范优先级（2026-09-24）

本文件记录企业运营工作台已确认并持续使用的视觉与交互基准。`CONTEXT.md` 决定业务用语，具体业务设计文档决定字段、权限和状态规则；二者不因视觉规范而改变。`docs/archive/frontend-interface-design-spec.md` 是早期提案，其标题尺度、侧栏宽度和移动抽屉等未实施设想不覆盖本文件及当前生产组件。遇到差异，先核对现有组件和页面行为，再按本文件的 TDesign 方向作局部修正。

通用按钮、字段、表格、弹窗与反馈分别复用 `src/styles.css` 中的 `--accent`、`--ink`、`--muted-strong`、`--line`、`--surface` 及其语义色；TDesign 表格表头与原生表格共用 `--muted-strong`。弹窗关闭、草稿与 busy 状态以共享 `Modal`、`ModalCloseButton` 和 `ConfirmDialog` 为准。新页面不以单独覆盖规则重新定义这些契约。

## Icon Family — TDesign

2026-09-27 用户确认全项目统一使用 TDesign 官方 React 图标。应用组件直接按需导入 `tdesign-icons-react`，日期和分页使用 TDesign 控件默认图标。保留官方图形轮廓与 `currentColor`，不以 CSS 强改路径或线宽。

- 一级导航使用 18px；按钮与表格行操作通常使用 16px；空状态保留 40px（紧凑状态 28px）。图标尺寸调整不得缩小既有点击目标。
- 使用 currentColor 继承现有中性、选中、禁用及危险色；保留动作文字、aria-label、焦点、权限与确认流程。状态标签继续使用纯文字，不附加装饰图标。
- 查询用 SearchIcon，中间数据用 DataBaseIcon，采购用 CartIcon，补货用 CartAddIcon，出货用 VehicleIcon。批量迁移的旧名称默认映射见 `docs/icon-proposal/tdesign-implemented-mapping.json`；具体用途可选更贴切的图标。旧局部别名只用于降低迁移改动，图形来源均为 TDesign。
- 撤回、退回、恢复自动用 RollbackIcon；刷新数据用 RefreshIcon。浏览器原生控件标识与品牌图片不属于应用图库。
- 本次迁移范围与验证见 `docs/icon-proposal/tdesign-migration-2026-09-27.md`。2026-09-17 的 Reicon 决策和实施记录保留于旧提案，供历史追溯。

## Overview

**Creative North Star: "清晰调度台"**

企业运营工作台是一张持续运转的调度台，而不是用于展示品牌姿态的陈列页。界面以中性浅灰画布和白色工作区承载长时间工作，以深灰文字保证信息稳定，以调度蓝标记当前焦点、选中状态和下一步主操作。用户应当先看见任务、状态和异常，再看见装饰。

系统服务于高频、数据密集、需要跨角色交接的操作。视觉语言因此保持稳健、清晰、克制：结构依靠网格、间距、细分割线和有限的色彩建立；控件紧凑但不拥挤；反馈及时但不喧闹。Apple 式设计原则只用于增强即时响应、空间一致性和可预测性，不用于复制消费级设备外观。

**Key Characteristics:**

- 中性浅灰画布、白色工作区与清晰的深灰业务信息
- 蓝色只标记行动、焦点和当前状态
- 紧凑、稳定、可扫描的数据表格与表单
- 细边框为主、轻阴影为辅的层级表达
- 动效短促、可打断，并尊重减少动态效果设置

## Approved Visual Direction: TDesign Reference

本节记录用户确认的全系统视觉方向：**参考 TDesign Starter 的视觉风格，不照搬其页面结构或功能，不改变现有业务逻辑。** 参考入口为 [TDesign Starter 基础列表页](https://tdesign.tencent.com/starter/react/list/base)。当前视觉依据为用户提供的基础列表截图，包含导航、工具栏、选择数量、表格、状态标签与分页；尚未实际核对的弹窗、表单和动效不得描述为已验证的参考行为。

### Visual Scope

- 使用中性浅灰画布、白色连续工作区、轻边框和小圆角；减少大面积浅蓝底、重复外框、阴影和卡片嵌套。
- 表格以横向细分隔线为主，正文使用常规字重，表头清晰但不过度加粗；采购编号、日期和字段标签不再普遍使用重字重。
- 蓝色集中用于主操作、链接、焦点和当前选择；状态使用小面积语义浅色标签，不能用状态色铺满整行。
- 统一按钮、输入框、筛选栏、表单、弹窗和通知的视觉语言；保留现有控件含义与交互契约。危险动作仍需明确的危险语义及原有确认流程。
- 保留本项目高频业务需要的紧凑密度，不照搬参考列表的宽松列宽和留白，不以缩小字体或点击目标换取密度。
- 顶部令牌是本项目的目标值，不是从截图测得的 TDesign 官方参数；保留既有调度蓝作为行动色。旧令牌名称仅为兼容命名，不要求文字或背景继续呈蓝色。

### Change Boundary

- **已确认的工作台结构：** 顶部使用全宽全局导航栏，放置系统名称、侧栏折叠按钮和现有用户切换；左侧 TDesign 导航承载模块与功能入口。右侧同类主列表以 TDesign 面包屑替换原功能大标题，桌面主列表的新建、筛选、查询、清除与辅助操作同处一条吸顶工具栏；记录状态 Tab 留在列表内。面包屑反映获授权的实际路由，模块无独立概览时仅显示文字，当前项不可点击；不插入重复的模块大标题或说明。不得借此新增全局搜索、消息等功能。

- 可调整配色、字体、字重、间距、边框、圆角、对齐、视觉分组和不改变行为的状态反馈。
- 保留现有业务布局、模块入口、字段及数据含义、接口、计算规则、权限、审批流程、校验规则和提交时机。
- 保留筛选、排序、分页、勾选范围、展开方式、未保存保护、防重复提交及上下文恢复行为；不得借视觉改造改变这些规则。
- 不添加参考模板中本项目没有的全局搜索、消息、帮助等装饰性功能入口，也不整体搬入 Starter 或为外观统一而全量替换组件库。
- 若某项调整必须改变交互路径或业务行为，应单独说明并取得确认，不纳入本次纯视觉改造。

### Rollout and Acceptance

- 先以出货资料模块作为视觉样板，再提取公共样式，按模块推广；本次文档更新不代表页面已经完成迁移。
- 勾选信息和批量操作在既有工具栏预留区域内显示或隐藏，不能增加工具栏高度或推动表格；窄屏布局按固定断点重排，不因是否勾选而跳动。
- 悬停、焦点、选中与加载不得改变内边距、边框占位、列宽或相邻内容位置。展开区鼠标滑入滑出不得抖动。
- 验收同时核对视觉一致性与业务等价性：同样的数据、权限和操作必须得到与改造前一致的业务结果。
- 本节决定视觉迁移方向；其余交互、安全和可访问性规则继续有效，不能因模仿参考外观而削弱。

## Colors

色彩体系由调度蓝、中性浅灰、工作面白和深灰文字构成；语义色只承担成功、警告、危险和信息反馈，不参与装饰。

### Primary

- **调度蓝:** 用于每个任务区域唯一的主操作、当前导航、选中行、活动标签和键盘焦点。
- **深调度蓝:** 用于主操作悬停、文字链接和需要比普通蓝色更稳重的活动状态。
- **浅调度蓝:** 用于选中、活动和信息提示的低强度背景。

### Neutral

- **中性浅灰（cool-paper）:** 应用画布，与白色工作区形成轻量区分。
- **工作面白:** 表格、表单、导航活动项和主要操作容器的基础表面。
- **深灰（deep-ink-blue）:** 标题、正文和关键数值的默认前景色。
- **次级灰（secondary-ink）:** 字段标签、表头和高优先级辅助文字。
- **辅助灰（muted-ink）:** 说明、元数据和次级上下文。
- **规则线:** 表格单元格、容器和区域边界的主要结构颜色。

### Secondary

- **成功绿:** 仅表示完成、可用、到达和确认成功。
- **警告琥珀:** 仅表示待处理、部分完成或需要关注。
- **危险红:** 仅表示错误、拒绝、异常和破坏性操作。
- **信息蓝:** 用于中性过程信息，不与主操作争夺注意力。

### Named Rules

**The One Active Blue Rule.** 同一任务区域最多有一个实心蓝色主操作；其余操作使用白底、透明底或文字样式。

**The Semantic Color Rule.** 成功、警告和危险色必须表达真实业务状态，不能作为装饰色或模块识别色。

**The Neutral Canvas Rule.** 页面画布保持中性浅灰纯色，工作区使用白色；渐变和大面积蓝色不得作为页面背景或无意义的视觉填充。

## Typography

**Display Font:** 使用 TDesign 根变量 `--td-font-family`。

**Body Font:** 使用 TDesign 根变量 `--td-font-family`。

**Label/Identifier Font:** 同样使用 `--td-font-family`；单号、SKU、权限点、CSV/JSON 预览不另设等宽字体。实际显示字形由系统已安装字体决定。

**Character:** 字体系统中性、清晰、适合中英文混排。层级主要由字重、大小和间距共同建立，不依靠字间距或全大写制造强调。

### Hierarchy

- **Display:** 仅用于模块或页面主标题；一屏只有一个。
- **Headline:** 用于表面、弹窗和主要工作区标题。
- **Title:** 用于字段组、卡片标题、按钮和需要快速扫描的行内重点。
- **Body:** 用于正文和普通控件；说明文字控制在约 78 个字符宽度以内。
- **Data:** 用于表格正文和紧凑业务数据，在保持可读性的前提下提高扫描密度。
- **Label:** 用于表头、字段标签、状态和元数据；不得继续缩小来换取密度。
- **Mono:** 仅用于编码、权限点和稳定标识符，不作为视觉装饰。

### Named Rules

**The Dense, Never Tiny Rule.** 数据密度通过布局、分组和列设计获得，不通过低于既有标签字号的微型文字获得。

**The Zero Tracking Rule.** 工作界面的字间距保持为零；不使用全大写、宽字距或营销式眉题。

## Layout

全局采用全宽顶栏、左侧功能导航加右侧弹性工作区的结构。顶栏高 56px，桌面侧栏默认 220px；模块内功能从侧栏进入，不重复显示模块大标题。同类主列表的面包屑随页面滚动；桌面主列表的完整工具区单行吸顶，必要状态筛选保持独立，下面是数据区和任务操作区。内容使用紧凑的 16px 区块节奏和 24px 页面边距。

桌面优先支持扫描、比较和连续操作。表格可以横向滚动，但高频任务不得依赖超宽表格维持上下文；低频字段应进入详情区、抽屉或高级视图。1100px 以下侧栏收紧到 184px，680px 以下工作台转为单列，导航使用抽屉；滚动后的工作区保留当前功能菜单入口。表单和摘要适应窄屏。全局折叠按钮始终可用，收起侧栏后工作区占用剩余宽度。

间距以 4px 为基础节奏，常用层级为 8px、12px、16px 和 24px。固定格式组件必须拥有稳定高度或网格轨道，加载状态、数值变化和标签切换不能造成布局跳动。

**The Scan Before Scroll Rule.** 操作页面先让用户扫描当前任务和下一步动作，再要求滚动；跨面板比较比单纯增加纵向内容更重要。

**The One Workspace Rule.** 页面区段属于同一个连续工作区，不使用卡片套卡片制造虚假层级。

## Elevation & Depth

系统采用轻量分层。细边框和背景明度承担主要结构，阴影只用于独立表面、悬停反馈、模态层和需要脱离文档流的操作区。静态页面区段不得因为阴影而全部悬浮；同层级表面必须使用相同深度。

### Shadow Vocabulary

- **Control:** 极浅阴影，仅用于输入、按钮和紧凑选择器，使控件与工作面区分。
- **Soft:** 用于导航悬停、选中状态和轻量浮起反馈。
- **Surface:** 用于独立工作表面和需要明确边界的任务容器。
- **Modal:** 只用于弹窗、Toast 和覆盖层，必须配合明确遮罩。

### Named Rules

**The Border First Rule.** 先用一像素规则线表达结构；只有真实提升层级或状态变化时才增加阴影。

**The No Stacked Glass Rule.** 顶栏可以使用轻微背景模糊维持内容连续性，但不得叠放半透明表面，也不得将毛玻璃作为普通卡片材质。

## Shapes

标准容器、按钮、输入和图标按钮使用轻微圆角，形成稳定、工具化的轮廓。状态标签使用略小圆角；胶囊形只用于细指示线、滚动条或确有连续选择语义的元素。表格本体保持矩形，由外层容器统一裁切。

**The Small Radius Rule.** 主要交互控件默认使用 4px 圆角，状态标签使用 3px；确需独立边界的弹窗或工具容器不超过 8px，不使用超大圆角把企业工具变成消费级卡片集合。

## Components

### Buttons

- **Shape:** 紧凑矩形，统一控件高度和轻微圆角。
- **Primary:** 调度蓝底、白字，只表示当前任务最重要的提交或创建动作。
- **Secondary:** 工作面白底、规则线边框，用于筛选、导入、导出和辅助操作。
- **Text / Icon:** 文字按钮不带容器边框；图标按钮使用稳定方形点击区，并提供可访问名称或提示。
- **Hover / Focus:** 悬停提高蓝色对比或显露浅蓝底；焦点使用清晰外轮廓。按下只允许极短位移反馈，不使用弹跳。

### Chips

- **Style:** 状态标签使用语义浅底、深色文字和同色系细边框。
- **State:** 标签只描述状态，不承担主要操作。选中型控件必须同时通过背景、边框或指示线表达，不能只依赖颜色。

### Cards / Containers

- **Corner Style:** 轻微统一圆角。
- **Background:** 默认使用工作面白；静默背景只用于分组或只读区域。
- **Shadow Strategy:** 遵循轻量分层，不在嵌套区段重复阴影。
- **Border:** 一像素规则线是默认边界。
- **Internal Padding:** 标准表面使用 16px，紧凑辅助容器可使用 12px。
- **Operational Summary:** 只有“标签 + 数字”的同层级业务摘要使用带分隔线的行内定义列表，不拆成重复指标卡；卡片必须承载可独立操作或需要独立边界的对象。
- **Process Progress:** 同一流程内的步骤与当前统计使用连续轨道和分隔摘要，不为每个步骤或数字建立独立小卡片；批次、订单、商品组等可独立选择或操作的业务对象才保留边界。
- **Sequential Workbench:** 跨阶段流程页按“当前对象、当前任务、下一步、履约记录”组织；同类历史对象通过选择器或列表切换，不与当前对象并列成竞争性卡片。没有待处理对象时收起创建控件，直接呈现后续记录和可执行动作。
- **Read-only Registry:** 只展示范围、权限或能力说明且没有进入动作的项目使用共享规则线的平面清单；不得使用带阴影的入口卡片或“可进入”等暗示不存在交互的文案。

### Inputs / Fields

- **Style:** 工作面白、规则线边框、稳定控件高度；标签置于控件上方并靠近所属字段。
- **Focus:** 调度蓝焦点轮廓清楚显示键盘位置，不改变元素尺寸。
- **Error / Disabled:** 错误在字段附近使用危险色文字说明；只读和禁用状态使用静默表面，同时保持文本可读。

### Navigation

- **Collapsed Navigation:** 桌面折叠后保留 64px 模块图标栏，功能入口经可用键盘和指针打开的子菜单浮层选择；Esc 返回触发项。680px 及以下使用抽屉展示同一菜单数据，关闭后焦点返回菜单入口。展开、折叠与窄屏均遵守原有权限和禁用规则。

- **Style:** 侧栏使用图标与明确业务名称；活动项采用白底、深调度蓝文字和细蓝色位置指示。
- **Behavior:** 模块顺序来自配置；有功能子项的父项只展开，叶子链接导航，状态筛选保留在内容区。当前叶子由 URL 选中。禁用入口可见但必须说明不可用原因；不使用隐藏导航制造权限猜测。

### Data Tables

- **Shared List Surface:** 采购申请列表为全系统列表视觉基准。所有主要业务列表使用共享 `list-workspace` 样式：白色连续工作区，桌面 20px / 24px 内边距、窄屏 12px；工具栏控件高 34px；表头使用浅灰背景和常规字重，数据行使用横向细线、小面积状态标签和轻量操作按钮。筛选栏、表格和汇总共用工作区，不重复套外框。仅列宽、业务分组、展开内容及合法操作允许按业务变化，不得以模块专属选择器重新定义另一套基础列表外观；弹窗表单不纳入本次列表统一。

- **Frame:** 工具栏、表格和汇总属于同一个连续数据工作区；表格滚动容器是唯一外框，不为外层区段和汇总重复添加卡片边界。
- **Style:** 表头使用常规或中等字重和次级灰文字，避免整行重字重；默认只使用横向规则线分隔记录，只有确需纵向对齐的财务或矩阵数据才使用列线。
- **State:** 悬停使用中性浅灰，选中和编辑通过低强度背景与复选框、图标或边界共同区分；浅蓝只用于必要的活动状态，关键数值使用等宽数字特性。
- **Density:** 优先压缩重复信息和低频列，不通过缩小文字或点击目标压缩密度。
- **Composite Cells:** 当类型、时间或明细数只是在解释同一业务对象时，将其作为主值下方的次级信息，而不是为每项元数据建立独立列；只有需要跨记录独立排序或比较的字段才占一列。
- **Progressive Disclosure:** 默认列只保留跨记录比较和当前决策所需字段；完整标识、地址、备注、审批上下文等低频信息进入现有详情面板或行内展开区，并保持原有查看与编辑能力。
- **Expanded Rows:** 展开内容必须附着于父行，共用一层背景和边界；不得再包成带圆角、阴影或外圈留白的浮动卡片。展开区中的独立明细表可以保留自身表头与规则线。
- **State-driven Actions:** 状态机对象每行只直接显示当前合法的下一步动作；辅助、修正和破坏性操作进入行内展开区。已完成状态显示结果，不继续陈列生命周期中的历史动作。
- **Summary:** 计数和合计使用表格下方的紧凑行内文字，不创建全宽渐变摘要卡片；仅包含批量操作时才使用有边界的粘性操作条。

### Dialogs and Feedback

- **Style:** 模态任务使用明确遮罩和独立白色表面；Toast 靠近顶部工作区，不遮挡当前主操作。
- **Context Header:** 弹窗内的对象编码、品名和静态元数据使用无外框的信息头与分隔线，不在弹窗表面中再嵌套上下文卡片或元数据小卡片。
- **Timeline:** 连续流程事件使用单一时间轴、节点和行间规则线表达顺序，不将每个事件拆成独立卡片；只有事件本身可展开、选择或操作时才增加独立边界。
- **Results and Logs:** 批量生成结果和处理记录使用带分隔线的连续列表；导入错误等需要立即识别的反馈可以保留一层边界，但不得叠加阴影、渐变或逐条结果卡片。表单内的辅助说明使用提示线而不是完整容器。
- **Alerts:** 警告、错误和中性提醒可以保留一层语义色背景、边界和位置标记；不得使用渐变或阴影制造额外层级，静态提醒内容不得再嵌套卡片。
- **Loading / Empty:** 加载、无数据和权限受限状态留在其原本的数据工作区内，不另建悬浮卡片或大面积占位；加载状态使用可感知的 `status` 语义，错误同时说明问题和恢复方向。
- **Focus:** 打开模态框时将焦点移入弹窗并限制在其中；`Escape` 关闭后将焦点还给触发控件。仅图标按钮必须提供描述具体动作和对象的可访问名称。
- **Motion:** 反馈立即出现，短促过渡并可被新操作覆盖；减少动态效果时取消位移和弹簧，仅保留必要的颜色或透明度变化。

### Tabs

- **Semantics:** 页签组使用 `tablist` / `tab` 语义与游标式 `tabIndex`；只有当前页签进入常规 Tab 顺序。
- **Keyboard:** 左右方向键移动到相邻页签，`Home` / `End` 移动到首尾页签；禁用页签不得获得焦点或被激活。

## Interaction System

交互系统采用“状态驱动工作台”模型。每次交互都必须让用户明确当前对象、当前状态、合法下一步和操作结果；动效只负责解释状态变化，不承担装饰职责。

### Core Contract

- **Immediate Response:** 指针或键盘触发后必须在 100ms 内出现按下、加载、选中或焦点反馈，不能等待接口返回后才变化。
- **One Primary Action:** 每个连续任务区域最多有一个实心主操作；保存、确认、提交和完成根据当前状态切换，不并列争夺注意力。
- **State Visibility:** 默认、悬停、按下、焦点、选中、编辑、未保存、加载、成功、失败和禁用必须能被区分，且不能只依赖颜色。
- **Stable Context:** 保存、刷新和从详情返回后保留当前页签、筛选、排序、分页、展开对象与合理的滚动位置。
- **Safe Mutation:** 采购确认、物流状态、库存、停用和删除等高价值数据使用显式提交并等待服务端确认；只有可逆、低风险操作可以乐观更新。

### Pointer and Click

- **Hover:** 在 fast 时长内通过背景、边框或文字颜色表达可交互性，不改变元素尺寸。
- **Press:** 按下反馈使用最多 1px 的短位移；禁止缩放、弹跳、光晕爆发和导致相邻内容移动的效果。
- **Focus:** 键盘焦点使用统一调度蓝外轮廓，不能被悬停样式覆盖。
- **Pending:** 提交后触发控件立即进入加载态并阻止重复点击；标签改为“正在保存”“正在提交”等具体进行态，不使用模糊的“处理中”。
- **Disabled:** 禁用态降低强调但保持文字可读；业务原因不明显时通过邻近说明或 Tooltip 解释，不能让用户猜测。
- **Event Boundary:** 表格行可用于打开详情或编辑；行内复选框、按钮、链接和菜单必须阻止行级触发，避免一次点击执行两个动作。

### Motion and Disclosure

- **Timing:** 按下反馈使用 instant；悬停和焦点使用 fast；普通展开、收起和弹窗使用 base；复杂但必要的布局变化最多使用 deliberate。
- **Easing:** 位移和尺寸变化统一使用 easeOut；颜色和透明度可以使用标准 ease-out，禁止弹簧和不可打断动画。
- **Expansion:** 展开使用高度与透明度的短过渡，不使用缩放。编辑型同层级默认只打开一个；只读详情可以打开多个。
- **Anchoring:** 展开内容附着在触发对象下方；只有超出视口时才进行最小幅度滚动，收起后焦点返回触发控件且页面不能跳位。
- **Dirty Guard:** 当前对象有未保存修改时，切换对象、页签、收起或离开页面必须提示；确认放弃后清除草稿，取消则留在原处。
- **Reduced Motion:** `prefers-reduced-motion: reduce` 下取消位移与尺寸动画，只保留必要的即时颜色、边框和可见性变化。

### Dialogs and Overlays

- **Use Boundary:** 弹窗只用于确认、导入、短表单和必须保护焦点的任务；连续浏览、比较或多步骤任务使用页面、工作区或行内展开。禁止嵌套弹窗。
- **Opening:** 遮罩在 base 时长内淡入，弹窗最多从下方 8px 回到原位；禁止缩放弹出。打开后焦点进入第一个有效字段，若没有字段则进入标题或关闭按钮。
- **Closing:** 普通无修改弹窗支持 `Escape`；有草稿或高风险结果时，点击遮罩和 `Escape` 都必须经过放弃确认。关闭后焦点返回原触发控件。
- **Layout:** 标题区和操作区保持可见，内容区独立滚动；弹窗高度不得超出视口，底部内容和校验信息不能被裁切。
- **Actions:** 主操作置于操作区右侧且只有一个；取消或关闭为次操作，破坏性操作使用危险语义并说明对象与后果。

### Forms and Editing

- **Labels:** 标签位于字段上方并左对齐；必填、帮助、错误和单位信息靠近所属字段，不能依赖占位符代替标签。
- **Validation:** 普通校验在失焦或提交时触发，不在每次输入时制造噪声。提交失败后聚焦第一个错误字段；长表单同时提供错误摘要。
- **Persistence:** 提交失败必须保留全部输入。提交期间内容保持可读并防止重复修改；成功后明确说明保存对象和结果。
- **Save Model:** 高价值数据默认显式保存。存在修改时显示“未保存”；保存与确认是不同状态，修改后先保存，数据干净后才能确认。
- **Enter Key:** 单步骤、无歧义表单可用 `Enter` 提交；多行文本、复合编辑器和高风险表单不得因回车意外提交。
- **Control Choice:** 日期、数字、枚举、布尔和颜色分别使用日期控件、数值输入、选择器、开关或复选框以及色板，不把所有输入退化为文本框。

### Notifications and Results

- **Success:** 成功通知保持简短，默认 3–4 秒后关闭；必须说明完成了什么，不使用只有“成功”的空泛文案。
- **Information:** 普通信息默认约 4 秒关闭；警告停留更久并允许手动关闭；错误默认持续到用户关闭或问题解除。
- **Recovery:** 错误同时说明问题、影响和恢复动作。字段错误必须在字段附近显示，不能只发送 Toast。
- **Deduplication:** 同一任务的加载、成功或失败更新同一条通知；相同通知合并，避免连续堆叠。悬停通知时暂停自动关闭。
- **Placement:** Toast 靠近工作区顶部，不遮挡导航、当前主操作或弹窗操作区；使用 `aria-live`，错误使用更高优先级播报。
- **Batch Results:** 导入、导出和批处理提供成功数、跳过数、失败数及错误报告；局部失败不能伪装成整体成功。

### Tables and Selection

- **Row States:** 悬停、选中、编辑、异常和禁用行使用稳定且不同的背景、边框或图标组合；状态变化不能使列宽跳动。
- **Selection Mode:** 批量操作只在存在选择时出现，显示选择数量、作用范围和清除入口；切换筛选时不得悄悄把不可见记录继续纳入高风险批量操作。
- **Inline Editing:** 少量字段使用紧贴父行的行内编辑；复杂任务进入独立工作区。编辑器不得压缩主表关键列或制造页面级横向滚动。
- **Next Action:** 每行只直接展示当前合法的下一步和一个更多入口；历史动作、修正和破坏性操作进入展开区或菜单。
- **Search and Filters:** 本地筛选立即执行；远程搜索可使用约 250ms 防抖。清除筛选必须恢复可预测的默认范围并保留用户所在模块。
- **Refresh:** 刷新数据时保留现有表格骨架，不能先清空再闪现。自动刷新不得覆盖正在编辑的草稿。

### Navigation and Workspace Memory

- **Tabs:** 每个页签保留自己的筛选、分页、展开对象和滚动位置；返回页签后恢复原工作上下文。
- **Deep Entry:** 工作台待办和跨模块链接直接打开已定位、已筛选的目标对象，而不是只跳转到模块首页。
- **Back Navigation:** 从详情返回列表时恢复来源记录的位置和状态；浏览器前进、后退必须与界面可见状态一致。
- **Permissions:** 权限不足的入口可以可见，但必须解释不可用原因；权限变化后立即撤销不再合法的操作，不隐藏已产生的审计记录。

### Async, Conflict, and Recovery

- **Loading:** 预计超过 300ms 的区域操作显示局部加载或骨架；加载占位保持稳定尺寸，不能推动周围布局。
- **Long-running Tasks:** 超过数秒的任务显示阶段、进度或明确说明，并允许用户离开后继续；完成时更新原状态而不是制造重复结果。
- **Retry:** 网络失败和可恢复服务错误提供原地重试；重试不得重复创建采购单、物流单或库存变更。
- **Concurrency:** 版本冲突不能覆盖他人修改；保留本地输入，展示服务端新版本与冲突字段，并要求用户重新确认。
- **Empty and Restricted:** 空数据、首次使用和权限受限状态留在原工作区，说明原因及唯一合理下一步，不创建装饰性空卡片。

### Keyboard and Accessibility

- **Keyboard Path:** 所有主要任务必须能通过键盘完成，Tab 顺序与视觉顺序一致；菜单、展开区和弹窗关闭后焦点返回触发控件。
- **Targets:** 桌面点击目标不小于 32px；触屏主要目标不小于 44px。图标按钮必须有具体可访问名称和 Tooltip。
- **Semantics:** 状态、加载、错误和通知使用正确的 `status`、`alert`、`aria-live`、`aria-expanded` 与 `aria-selected` 语义。
- **Contrast:** 交互状态不能只依赖颜色；禁用、选中、错误和成功在浅色背景上保持可读对比。

### Interaction Acceptance

- 任一连续任务区域最多一个实心主操作，且状态文案与后端真实状态一致。
- 用户不会因切换、刷新、失败或关闭而静默丢失输入，也不能通过重复点击重复提交。
- 保存、返回和跨模块进入后保留必要上下文；页面、弹窗和展开区不存在内容裁切或页面级横向溢出。
- 桌面、窄屏、键盘、减少动态效果、空数据、加载、失败、权限受限、长文本和并发冲突均有明确行为。
- 新页面和改造页面必须按本节逐项验收；静态截图通过不能替代真实点击、键盘和异步状态验证。

## Do's and Don'ts

### Do:

- **Do** 让每个操作页面明确回答：当前任务是什么、状态如何、下一步在哪里。
- **Do** 将调度蓝留给焦点、选中状态和唯一主操作。
- **Do** 使用共享按钮、输入、表格、状态和模态模式，保持跨模块一致。
- **Do** 每个连续操作区只保留一个实心主按钮；新增、提交或完成当前任务优先，导入、导出和下载通常作为次操作。只有生成并下载本身就是任务完成动作时，才可作为主操作。
- **Do** 用分组、固定列、详情面板和任务摘要降低记忆负担。
- **Do** 为键盘焦点、错误、空状态、加载状态和减少动态效果提供完整表现。

### Don't:

- **Don't** 使用大面积毛玻璃、叠层透明卡片或模糊装饰背景。
- **Don't** 堆叠渐变、阴影、状态胶囊和摘要卡片，让所有区域同时抢夺注意力。
- **Don't** 使用夸张弹跳、不可打断动画或与业务动作无关的持续动效。
- **Don't** 把操作工作台设计成营销落地页、海报或宽松的展示型仪表盘。
- **Don't** 在业务界面暴露开发阶段、数据库实现、原始权限代码或尚未形成用户功能的技术边界说明。
- **Don't** 把页面局部实验、单一模块布局或一次性业务状态提升为全局设计规则。

## Alert 与操作反馈

- 使用 `src/components/Alert.tsx` 与 `alert.css`，纯文字、细边框、4px圆角；灰色中性、蓝色说明、绿色成功、琥珀需核对、红色失败。同义提醒跨页面使用相同语义，标题明确说明原因。
- 短暂成功复用 Toast，不插入列表布局；状态切换已明显可见时不通知。字段校验贴近输入框，整页无法加载使用错误空态。
- 业务警告、冲突及批量部分成功保留至用户处理或关闭；失败不能静默。错误仅在当前操作容器显示，弹窗与底层页面不重复。
- 不根据目标业务状态判断操作结果，撤回或驳回操作成功仍为成功。不得依据中文错误关键词猜测错误码或权限。
- 重新加载可能覆盖输入时需确认；重试不得绕过原有幂等、版本与权限保护。完整清单见 `docs/alert-feedback-design.md`。

## 全局状态标识

全局状态标识使用纯文字浅底标签，不使用图标。统一组件为 `src/components/StatusBadge.tsx`，语义色映射为 `src/lib/status-presentation.ts`；业务模块保留原有状态判断，只传入现有展示文案。灰色表示中性，琥珀表示待办，蓝色表示进行中，青色表示阶段达成，绿色表示成功或可用，红色表示拒绝或冲突。取消不等于驳回，到港不等于完成。标签常规高度24px、字号12px、圆角4px；数量和识别待确认说明放在主标签外。详情、列表、弹窗不得另设同义状态样式。完整清单参见 `docs/status-badge-design.md`。

## 列表选择

- 列表全选统一使用与 EAN 码池一致的原生 16px 表头复选框，不使用“全选 / 取消”文字按钮。
- 显示未选、半选、全选三种状态；无可选行时禁用。半选仅统计本列表可选范围，不能用跨页选择总数推断。
- 选择范围、跨筛选保留规则和批量操作权限由业务模块原有规则决定；样式统一不得改变它们。
- 图标式全选入口必须具备可访问名称与键盘焦点提示。

## 日期选择器

- 日期统一使用 TDesign 公共封装，禁止业务页新增原生日期输入框。
- 列表范围筛选使用单一入口：面板左侧快捷日期、右侧双月日历；不再外置快捷下拉框。
- 保留既有默认范围及日期计算口径；清空和“全部时间”均表示不限制日期。
- 点击快捷项立即应用；日历完成区间后应用。单日期选择仅更新草稿，不代替保存或提交。
- 日期传值使用本地日期字符串 `YYYY-MM-DD`，不通过 UTC 转换。区间支持键入单侧边界并回车应用。
- 控件默认 36px，表格内 32px；窄屏面板纵向排列并可滚动。
- 日历浮层不得被弹窗裁切；Esc 优先关闭日历，焦点回到日期输入。
