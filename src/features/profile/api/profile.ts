import apiClient from '@/shared/api/client';
import type { User } from '@/entities/account/model/types';
type BackendProfile={id:string;name:string;email:string;phone?:string;line?:string;facebook?:string;avatarUrl?:string;role:string;sellerStatus?:string};
const map=(v:BackendProfile):User=>({id:v.id,name:v.name,email:v.email,phone:v.phone,line:v.line,facebook:v.facebook,avatarUrl:v.avatarUrl,role:v.role==='ADMIN'?'ADMIN':'USER',isSeller:v.role==='SELLER'||v.sellerStatus==='APPROVED',...(v.sellerStatus?{sellerStatus:v.sellerStatus}:{})});
type SellerVerificationResponse={sellerStatus?:string};
export const profileApi = {
  getAvatar: async () => (await apiClient.get<Blob>('/users/profile/avatar', { responseType: 'blob' })).data,
  get: async () => map((await apiClient.get<BackendProfile>('/users/profile')).data),
  update: async (data: Partial<User> & { line?: string; facebook?: string }) =>
    map((await apiClient.put<BackendProfile>('/users/profile', data)).data),
  uploadAvatar: async (file: File) => {
    const data = new FormData();
    data.append('image', file);
    return map((await apiClient.post<BackendProfile>('/users/profile/avatar', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data);
  },
  verifySeller: async (data: { shopName: string; shopDescription?: string; phone?: string; line?: string; facebook?: string }) =>
    (await apiClient.post<SellerVerificationResponse>('/sellers/verify', data)).data,
};
