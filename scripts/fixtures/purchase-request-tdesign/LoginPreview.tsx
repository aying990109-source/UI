import { useEffect, useRef, useState } from 'react';
import { Button, Input, Tooltip } from 'tdesign-react';
import type { InputRef } from 'tdesign-react';
import { BrowseIcon, BrowseOffIcon, ErrorCircleIcon, LockOnIcon, UserIcon } from 'tdesign-icons-react';
import { demoCredentials, validatePreviewLogin } from './login-preview-data';
import './login-preview.css';
import { ThemeToggle } from './ThemeSelector';
import type { InterfacePreferences } from './utility-preview-data';

export function LoginPreview({ onLogin, onBrowse, theme, onThemeChange }: { onLogin: () => void; onBrowse: () => void; theme: InterfacePreferences['theme']; onThemeChange: (theme: InterfacePreferences['theme']) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [error, setError] = useState<ReturnType<typeof validatePreviewLogin>>(null);
  const usernameInput = useRef<InputRef>(null);
  const passwordInput = useRef<InputRef>(null);
  useEffect(() => {
    for (const [field, ref] of [['username', usernameInput], ['password', passwordInput]] as const) {
      const input = ref.current?.inputElement;
      if (!input) continue;
      input.id = `preview-login-${field}`;
      input.setAttribute('aria-invalid', String(error?.field === field || error?.field === 'credentials'));
      if (error) input.setAttribute('aria-describedby', 'preview-login-feedback');
      else input.removeAttribute('aria-describedby');
    }
  }, [error]);
  const submit = () => {
    const failure = validatePreviewLogin(username, password);
    setError(failure);
    if (failure) {
      (failure.field === 'password' ? passwordInput : usernameInput).current?.focus();
      return;
    }
    setPassword('');
    onLogin();
  };

  return <main className="preview-login" aria-labelledby="preview-login-title">
    <header className="preview-login-brand"><img src={`${import.meta.env.BASE_URL}workbench-mark.svg`} width="36" height="26" alt="XD" /><span>企业运营工作台</span><ThemeToggle value={theme} onChange={onThemeChange} /></header>
    <div className="preview-login-center">
      <section className="preview-login-form-area">
        <h1 id="preview-login-title">登录到<br />企业运营工作台</h1>
        <p className="preview-login-description">使用分配的企业账号登录</p>
        <form noValidate onSubmit={event => { event.preventDefault(); submit(); }}>
          <div className="preview-login-field">
            <label htmlFor="preview-login-username">账号</label>
            <Input ref={usernameInput} name="username" value={username} onChange={setUsername} autocomplete="username" autofocus prefixIcon={<UserIcon />} placeholder="请输入账号" status={error?.field === 'username' || error?.field === 'credentials' ? 'error' : undefined} />
          </div>
          <div className="preview-login-field">
            <label htmlFor="preview-login-password">密码</label>
            <Input ref={passwordInput} name="password" type={visible ? 'text' : 'password'} value={password} onChange={setPassword} autocomplete="off" prefixIcon={<LockOnIcon />} placeholder="请输入密码" status={error?.field === 'password' || error?.field === 'credentials' ? 'error' : undefined} suffixIcon={<></>} suffix={<Tooltip content={visible ? '隐藏密码' : '显示密码'}><Button type="button" variant="text" shape="square" className="preview-login-visibility" aria-label={visible ? '隐藏密码' : '显示密码'} aria-pressed={visible} icon={visible ? <BrowseIcon /> : <BrowseOffIcon />} onClick={() => setVisible(value => !value)} /></Tooltip>} />
          </div>
          <div className="preview-login-feedback" id="preview-login-feedback" role="alert" aria-atomic="true">{error ? <><ErrorCircleIcon aria-hidden="true" /><span>{error.message}</span></> : <span className="preview-login-help">忘记密码请联系管理员。</span>}</div>
          <Button theme="primary" type="submit" block size="large" className="preview-login-submit">登录</Button>
        </form>
        <div className="preview-login-links"><Button variant="text" theme="primary" onClick={() => setHelpOpen(value => !value)} aria-expanded={helpOpen} aria-controls="preview-login-help-content">登录遇到问题？</Button><Button variant="text" onClick={onBrowse}>浏览工作台样板</Button></div>
        {helpOpen && <div id="preview-login-help-content" className="preview-login-help-content"><strong>账号与密码帮助</strong><p>正式账号由管理员开通。忘记密码或账号不可用时，请联系管理员处理。</p>
          <aside className="preview-login-demo" aria-label="演示账号">
          <div className="preview-login-demo-heading"><strong>体验此样板</strong><Button variant="text" theme="primary" onClick={() => { setUsername(demoCredentials.username); setPassword(demoCredentials.password); setError(null); passwordInput.current?.focus(); }}>填入演示账号</Button></div>
          <p>账号 <span>{demoCredentials.username}</span><span className="preview-login-demo-separator">·</span>密码 <span>{demoCredentials.password}</span></p>
          <small>仅本地演示，请勿使用真实账号或密码。</small>
          </aside>
        </div>}
      </section>
    </div>
    <footer className="preview-login-footer"><span>企业运营工作台</span><span>交互样板 · 请勿输入真实账号或密码</span></footer>
  </main>;
}
