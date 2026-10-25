export function getStoredAccessToken(): string | null {
  return sessionStorage.getItem('token') ?? localStorage.getItem('token');
}

export function clearStoredAuth() {
  for (const storage of [sessionStorage, localStorage]) {
    storage.removeItem('token');
    storage.removeItem('tcg_auth_storage');
  }
}
