import { Avatar, Button, Card, Empty, Tag, Tooltip } from 'tdesign-react';
import { ChatIcon, ChevronRightIcon, EditIcon, HelpCircleIcon, HomeIcon } from 'tdesign-icons-react';
import './personal-profile.css';

export type Profile = { phone: string; email: string; seat: string; jobTitle: string; joinedAt: string; version: number };
export type AvatarDraft = { src: string; color: string; version: number };

const shortcuts = [
  { page: 'workbenchHome', label: '工作台', description: '查看待办与工作日历', icon: HomeIcon },
  { page: 'businessAssistant', label: '业务助手', description: '查找业务问题的解答', icon: ChatIcon },
  { page: 'helpDocuments', label: '帮助文档', description: '了解操作步骤与注意事项', icon: HelpCircleIcon },
];

export function PersonalProfilePage({ active, profile, avatar, signedIn, onEditProfile, onEditAvatar, onNavigate }: {
  active: boolean; profile: Profile; avatar: AvatarDraft; signedIn: boolean;
  onEditProfile: () => void; onEditAvatar: () => void; onNavigate: (page: string) => void;
}) {
  const fields = [
    ['手机号', profile.phone], ['邮箱', profile.email], ['工位', profile.seat], ['岗位', profile.jobTitle],
    ['入职日期', profile.joinedAt], ['账号', 'demo.admin'], ['姓名', '演示管理员'], ['登录状态', signedIn ? '演示会话中' : '浏览样板'],
  ];
  return <div hidden={!active}>
    <h1 className="sr-only">个人资料</h1>
    <div className="personal-profile-grid">
      <Card bordered={false} className="profile-card profile-welcome">
        <div className="profile-welcome-content"><h2>你好，演示管理员</h2><p>欢迎回到企业运营工作台</p></div>
      </Card>

      <Card bordered={false} className="profile-card profile-information" title={<h2>个人信息</h2>}
        actions={<Tooltip content="编辑个人资料"><Button shape="square" variant="text" icon={<EditIcon />} aria-label="编辑个人资料" onClick={onEditProfile} /></Tooltip>}>
        <dl className="profile-information-grid">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '未填写'}</dd></div>)}</dl>
        <p className="profile-note">当前展示为示例资料，修改仅在本次浏览中生效。</p>
      </Card>

      <Card bordered={false} className="profile-card profile-usage" title={<h2>助手用量</h2>} actions={<Tag variant="light">尚未接入</Tag>}>
        <div className="profile-usage-empty"><Empty title="暂无用量数据" description="当前样板未接入模型计量，真实用量将在接入后展示。"
          action={<Button variant="outline" onClick={() => onNavigate('businessAssistant')}>打开业务助手</Button>} /></div>
      </Card>

      <aside className="profile-sidebar" aria-label="账号与常用入口">
        <Card bordered={false} className="profile-card profile-identity">
          <div className="profile-identity-top">
            <Avatar size="90px" style={{ background: avatar.color, color: '#fff' }}>{avatar.src ? <img className="support-avatar-image" src={avatar.src} alt="演示管理员头像" /> : '演'}</Avatar>
            <Tooltip content="更换头像"><Button className="profile-avatar-action" shape="square" variant="text" icon={<EditIcon />} aria-label="更换头像" onClick={onEditAvatar} /></Tooltip>
          </div>
          <h2>演示管理员</h2>
          <p className="profile-account-name">demo.admin</p>
          <p className="profile-position">{profile.jobTitle || '岗位未填写'}<span aria-hidden="true"> · </span>{signedIn ? '演示会话中' : '浏览样板'}</p>
        </Card>
        <Card bordered={false} className="profile-card profile-shortcuts" title={<h2>常用入口</h2>}>
          <nav aria-label="个人资料常用入口">{shortcuts.map(item => <Button key={item.page} block variant="text" aria-label={`打开${item.label}`} onClick={() => onNavigate(item.page)}>
            <span className="profile-shortcut-icon"><item.icon /></span><span className="profile-shortcut-copy"><span>{item.label}</span><small>{item.description}</small></span><ChevronRightIcon className="profile-shortcut-arrow" />
          </Button>)}</nav>
        </Card>
      </aside>
    </div>
  </div>;
}
