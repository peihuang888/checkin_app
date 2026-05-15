const STORAGE_KEY_CODE = '__global_organization_code';
const STORAGE_KEY_NAME = '__global_organization_name';

export function getStoredOrganization(): { code: string | null; name: string | null } {
  const code = localStorage.getItem(STORAGE_KEY_CODE);
  const name = localStorage.getItem(STORAGE_KEY_NAME);
  return { code, name };
}

export function getStoredNickname(orgCode: string): string {
  return localStorage.getItem(`__global_user_nickname_${orgCode}`) || '';
}

export function setStoredNickname(orgCode: string, nickname: string): void {
  localStorage.setItem(`__global_user_nickname_${orgCode}`, nickname);
}
