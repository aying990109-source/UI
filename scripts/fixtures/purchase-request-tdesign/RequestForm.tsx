import { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Button, DatePicker, Dialog, Form, Input, InputNumber, Select, Tag, Textarea } from 'tdesign-react';
import { CloseIcon } from 'tdesign-icons-react';
import { products, type RequestRow } from './data';
import { createEvent } from './history';
import { transportMethods } from '../../../src/lib/purchase-transport';

const Item = Form.FormItem;
const options = (values: string[]) => values.map(value => ({ label: value, value }));
const initialData = { product: '', quantity: undefined, purchaseType: '国内采购', stockingType: 'FBA', site: 'US', stockPath: '发海外仓', transport: '普通海运', date: '2026-10-17', group: '运营一组', shop: '', asin: '', fnsku: '', msku: '', remark: '' };

export function RequestForm({ onClose, onCreate }: { onClose: () => void; onCreate: (row: RequestRow) => void }) {
  const [form] = Form.useForm();
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [error, setError] = useState('');
  const [names, setNames] = useState(products.map(product => product.name));
  const [productName, setProductName] = useState('');
  const [path, setPath] = useState('发海外仓');
  const product = products.find(item => item.name === productName);
  const close = () => dirty ? setDiscard(true) : onClose();

  // TDesign 1.x renders labels separately from native inputs; connect them for keyboard/AT users.
  const connectLabels = () => {
    document.querySelectorAll<HTMLElement>('#request-form .t-form__item').forEach((item, index) => {
      const label = item.querySelector('label');
      const input = item.querySelector('input, textarea');
      if (!label || !input) return;
      input.id = `sample-field-${index}`;
      label.htmlFor = input.id;
      input.setAttribute('aria-invalid', String(!!item.querySelector('.t-is-error')));
    });
  };
  useLayoutEffect(connectLabels);

  useEffect(() => {
    const background = document.getElementById('root');
    const parentDialog = document.querySelector<HTMLElement>('.request-dialog');
    if (background) background.inert = true;
    if (parentDialog) parentDialog.inert = discard;
    const focusable = (scope: Element) => [...scope.querySelectorAll<HTMLElement>('button, input, textarea, select, a[href], [tabindex]')]
      .filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && !element.closest('[inert]') && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const dialog = document.querySelector(discard ? '.discard-dialog' : '.request-dialog');
      if (!dialog) return;
      // Select and date-picker panels use portals; retain their native keyboard controls.
      const popups = discard ? [] : [...document.querySelectorAll('.t-popup')].flatMap(focusable);
      const elements = [...focusable(dialog), ...popups];
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) return;
      if (!elements.includes(document.activeElement as HTMLElement) ||
        (event.shiftKey && document.activeElement === first) ||
        (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => {
      document.removeEventListener('keydown', trap);
      if (background) background.inert = false;
      if (parentDialog) parentDialog.inert = false;
    };
  }, [discard]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return <>
    <Dialog visible header={<div className="form-heading"><span>新建采购申请</span>{dirty && <Tag size="small" variant="light">未保存</Tag>}</div>}
      width={860} placement="center" dialogClassName="request-dialog" closeOnOverlayClick={false}
      closeBtn={<Button variant="text" shape="square" icon={<CloseIcon />} aria-label="关闭新建采购申请" />}
      onClose={close} onOpened={() => { connectLabels(); const dialog = document.querySelector('.request-dialog'); dialog?.setAttribute('role', 'dialog'); dialog?.setAttribute('aria-modal', 'true'); dialog?.setAttribute('aria-label', '新建采购申请'); document.querySelector<HTMLInputElement>('#request-form input')?.focus(); }}
      footer={<div className="form-footer"><span>示例申请仅保存在当前页面</span><div><Button variant="outline" onClick={close}>取消</Button><Button theme="primary" onClick={() => form.submit()}>提交申请</Button></div></div>}>
      <div onKeyDown={event => { if (event.key === 'Enter' && event.target instanceof HTMLInputElement) event.preventDefault(); }}><Form id="request-form" form={form} initialData={initialData} labelAlign="top" labelWidth="100%" requiredMarkPosition="right"
        onValuesChange={() => { setDirty(true); setError(''); }}
        onSubmit={({ validateResult, firstError }) => {
          if (validateResult !== true) {
            setError(firstError || '请检查表单中的必填项。');
            requestAnimationFrame(() => document.querySelector<HTMLElement>('#request-form .t-is-error input')?.focus());
            return;
          }
          const values = form.getFieldsValue(true) as Omit<typeof initialData, 'quantity'> & { quantity: number };
          onCreate({ ...values, id: `CG-DEMO-${Date.now().toString().slice(-6)}`, productCode: product?.code || '待建档', color: product?.color || '—', carton: product?.carton ?? null, quantity: Number(values.quantity), applicant: '演示用户', status: '审批中', awaitingMyApproval: false, transport: values.stockPath === '国内备货' ? '不适用' : values.transport, timeline: [createEvent('提交申请', '演示用户', `申请采购 ${values.quantity} 件。`)] });
        }}>
        {error && <div role="alert"><Alert theme="error" message={`尚未提交：${error}`} className="form-error" /></div>}
        <section className="form-section" aria-labelledby="product-title">
          <h3 id="product-title">采购商品与数量</h3>
          <Item label="品名" name="product" rules={[{ required: true, message: '请选择或输入品名', trigger: 'blur' }]}>
            <Select filterable creatable clearable placeholder="搜索已有商品，或输入新品名称" options={options(names)}
              inputProps={{ name: 'product', maxlength: 300 }}
              onCreate={value => { const name = String(value).trim(); if (name && !names.includes(name)) setNames([...names, name]); }}
              onChange={value => { setProductName(String(value || '')); form.clearValidate(['quantity']); }} />
          </Item>
          <div className="form-grid quantity-grid">
            <Item label="需采购量" name="quantity" rules={[
              { required: true, message: '请填写需采购量', trigger: 'blur' },
              { validator: value => Number.isInteger(Number(value)) && Number(value) > 0 && Number(value) <= 2147483647, message: '请输入大于 0 的整数', trigger: 'blur' },
              { validator: value => !product?.carton || Number(value) % product.carton === 0, message: `需采购量应为 ${product?.carton} 的整数倍`, trigger: 'blur' },
            ]}>
              <InputNumber min={1} max={2147483647} decimalPlaces={0} placeholder="请输入数量" suffix="件" inputProps={{ name: 'quantity' }} />
            </Item>
            <div className="carton-reference"><span>参考装箱数</span><strong>{product?.carton ? `${product.carton} 件 / 箱` : '待采购确认'}</strong><small>{product?.carton ? '数量须为整箱倍数 · 样例产品依据' : '装箱数未确认时，可填写正整数'}</small></div>
          </div>
        </section>
        <section className="form-section" aria-labelledby="route-title">
          <h3 id="route-title">采购方式与去向</h3>
          <div className="form-grid three-columns">
            <Item label="采购类型" name="purchaseType"><Select options={options(['国内采购', '海外采购'])} inputProps={{ name: 'purchaseType' }} /></Item>
            <Item label="备货类型" name="stockingType"><Select options={options(['FBA', 'FBM'])} inputProps={{ name: 'stockingType' }} /></Item>
            <Item label="站点" name="site"><Select options={options(['US', 'CA'])} inputProps={{ name: 'site' }} /></Item>
            <Item label="货物路径" name="stockPath"><Select options={options(['发海外仓', '国内备货', '入FBA仓'])} onChange={value => setPath(String(value))} inputProps={{ name: 'stockPath' }} /></Item>
            {path === '国内备货' ? <Item label="运输方式"><Input value="不适用" readOnly aria-label="运输方式" /></Item> : <Item label="运输方式" name="transport"><Select options={options([...transportMethods])} inputProps={{ name: 'transport' }} /></Item>}
          </div>
        </section>
        <section className="form-section" aria-labelledby="warehouse-title">
          <h3 id="warehouse-title">直发入仓 <span>选填</span></h3>
          <div className="form-grid four-columns">
            {([['shop', 'ERP 店铺'], ['asin', 'ASIN'], ['fnsku', 'FNSKU'], ['msku', 'MSKU']] as const).map(([name, label]) => <Item key={name} label={label} name={name}><Input maxlength={300} placeholder="请输入" aria-label={label} /></Item>)}
          </div>
        </section>
        <section className="form-section" aria-labelledby="request-title">
          <h3 id="request-title">申请信息</h3>
          <div className="form-grid">
            <Item label="所属小组" name="group"><Select options={options(['运营一组', '运营二组'])} inputProps={{ name: 'group' }} /></Item>
            <Item label="申请日期" name="date" rules={[{ required: true, message: '请选择申请日期', trigger: 'blur' }]}><DatePicker allowInput inputProps={{ name: 'date' }} /></Item>
          </div>
          <Item label="备注" name="remark"><Textarea maxlength={2000} autosize={{ minRows: 2, maxRows: 4 }} placeholder="补充采购用途、交期要求等信息" aria-label="备注" /></Item>
        </section>
      </Form></div>
    </Dialog>
    <Dialog visible={discard} dialogClassName="discard-dialog" header="放弃未保存的申请？" body="已填写的内容将被清除。" confirmBtn="放弃填写" cancelBtn="继续填写" theme="warning" width={420} closeOnOverlayClick={false} closeBtn={false}
      onOpened={() => { const dialog = document.querySelector('.discard-dialog'); dialog?.setAttribute('role', 'alertdialog'); dialog?.setAttribute('aria-modal', 'true'); dialog?.setAttribute('aria-label', '放弃未保存的申请？'); dialog?.querySelector<HTMLButtonElement>('button')?.focus(); }}
      onClose={() => setDiscard(false)} onClosed={() => document.querySelector<HTMLButtonElement>('.form-footer button')?.focus()} onConfirm={onClose} />
  </>;
}
