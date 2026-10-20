import { useEffect, useState } from 'react';
import { MoonIcon, SunnyIcon } from 'tdesign-icons-react';
import { Button, Select, Tooltip } from 'tdesign-react';
import type { InterfacePreferences } from './utility-preview-data';

const options = [{ value: 'system', label: '跟随系统' }, { value: 'light', label: '浅色' }, { value: 'dark', label: '深色' }];

export function ThemeSelector({ value, onChange }: { value: InterfacePreferences['theme']; onChange: (theme: InterfacePreferences['theme']) => void }) {
  return <label className="theme-selector"><span className="sr-only">界面主题</span><Select size="small" value={value} options={options} onChange={next => onChange(next as InterfacePreferences['theme'])} /></label>;
}

export function ThemeToggle({ value, onChange }: { value: InterfacePreferences['theme']; onChange: (theme: InterfacePreferences['theme']) => void }) {
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return;
    const update = () => setSystemDark(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const active = value === 'system' ? systemDark ? 'dark' : 'light' : value;
  return <div className="theme-toggle" role="group" aria-label="界面主题">
    {(['light', 'dark'] as const).map(theme => {
      const label = theme === 'light' ? '浅色' : '深色';
      const selected = active === theme;
      const description = selected && value === 'system' ? `${label}模式（当前跟随系统）` : selected ? `${label}模式（当前已启用）` : `切换到${label}模式`;
      return <Tooltip key={theme} content={description}><Button type="button" variant="text" shape="square" className={`theme-toggle-button theme-toggle-${theme}${selected ? ' is-active' : ''}`} icon={theme === 'light' ? <SunnyIcon /> : <MoonIcon />} aria-label={description} aria-pressed={selected} onClick={() => onChange(theme)} /></Tooltip>;
    })}
  </div>;
}
