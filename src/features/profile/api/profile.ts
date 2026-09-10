import apiClient from '@/shared/api/client';
import type { User } from '@/entities/account/model/types';
type BackendProfile={id:string;name:string;email:string;phone?:string;line?:string;facebook?:string;avatarUrl?:string;role:string;sellerStatus?:string};
const map=(v:BackendProfile):User=>({id:v.id,name:v.name,email:v.email,phone:v.phone,line:v.line,facebook:v.facebook,avatarUrl:v.avatarUrl,role:v.role==='SELLER'||v.sellerStatus==='VERIFIED'?'SELLER':'BUYER'});
export const profileApi={get:async()=>map((await apiClient.get<BackendProfile>('/users/profile')).data),update:async(data:Partial<User>&{line?:string;facebook?:string})=>map((await apiClient.put<BackendProfile>('/users/profile',data)).data),verifySeller:async(data:{shopName:string;shopDescription?:string;phone?:string;line?:string;facebook?:string})=>(await apiClient.post('/sellers/verify',data)).data};
