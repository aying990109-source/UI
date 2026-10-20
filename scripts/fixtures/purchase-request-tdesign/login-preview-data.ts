export const demoCredentials = { username: 'demo.admin', password: 'demo12345' };

export function validatePreviewLogin(username: string, password: string) {
  if (!username.trim()) return { field: 'username' as const, message: '请输入账号。' };
  if (!password) return { field: 'password' as const, message: '请输入密码。' };
  if (username.trim() !== demoCredentials.username || password !== demoCredentials.password) {
    return { field: 'credentials' as const, message: '账号或密码不正确，请重试。' };
  }
  return null;
}
