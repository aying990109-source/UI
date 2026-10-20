export const supportPages = { loginPreview: '登录页', personalProfile: '个人资料', helpDocuments: '帮助文档', businessAssistant: '业务助手' };
export type HelpArticle = { id: string; title: string; category: string; premise: string; steps: string[]; result: string; caution: string };
export const helpArticles: HelpArticle[] = [
  { id: 'purchase', title: '发起采购申请', category: '采购', premise: '确认品名、数量、采购方式与目标站点。', steps: ['在运营流程中打开采购申请并选择新建。', '填写采购商品、数量和去向，核对必填项后提交。', '在详情时间线中确认受理状态。'], result: '申请进入本地样板的审批视图。', caution: '示例提交不生成正式采购单。' },
  { id: 'replenishment', title: '处理补货任务', category: '补货', premise: '先区分补货申请与补货处理；只有对应阶段允许执行后续动作。', steps: ['从补货处理列表筛选任务。', '打开详情检查仓库、标签及前序凭据。', '按当前阶段完成锁仓、标签、发货或退回。'], result: '详情时间线保留本地动作和版本。', caution: '退回与取消的合法性取决于当前状态。' },
  { id: 'store', title: '核对店铺资料与品牌授权', category: '店铺', premise: '店铺资料和归组是不同维护对象；品牌关系按覆盖范围核对。', steps: ['在店铺信息查看 SID 与资料版本。', '核对负责人、账号状态及品牌授权。', '批量回导前先预检，再查看逐行结果。'], result: '本地记录更新后，品牌与店铺视图同步展示。', caution: '文件预检通过不等于已写入生产。' },
  { id: 'sales', title: '阅读销售目标进度', category: '数据', premise: '先确认销售来源、币种、汇率和目标月份。', steps: ['在销售数据查看月份与来源状态。', '在目标管理查看版本及累计进度。', '对未到月份和来源失败的行查看说明，不把缺失当作零。'], result: '可区分已确认金额与未确认来源。', caution: '不同币种未经核算不能直接相加。' },
];
export type AssistantAnswer = { answer: string; source: string; articleId?: string };
export function answerSupportQuestion(question: string): AssistantAnswer {
  const value = question.trim();
  if (!value) throw new Error('请输入问题。');
  const article = /采购/.test(value) ? helpArticles[0] : /补货/.test(value) ? helpArticles[1] : /店铺|授权|品牌/.test(value) ? helpArticles[2] : /销售|目标|汇率/.test(value) ? helpArticles[3] : undefined;
  if (!article) return { answer: '本地示例没有足够依据回答这个问题。请打开帮助文档或到相应业务详情核对。', source: '本地示例边界' };
  return { answer: `${article.premise} ${article.steps.join(' ')} ${article.caution}`, source: `帮助文档 · ${article.title}`, articleId: article.id };
}
