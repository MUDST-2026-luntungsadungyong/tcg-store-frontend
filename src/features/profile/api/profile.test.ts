import { describe, expect, it, vi } from 'vitest';
const { get, put, post } = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), post: vi.fn() }));
vi.mock('@/shared/api/client',()=>({default:{get,put,post}}));
import { profileApi } from './profile';
describe('profileApi',()=>{it('maps approved backend users to seller capability',async()=>{get.mockResolvedValue({data:{id:'1',name:'A',email:'a@b.com',role:'USER',sellerStatus:'APPROVED'}});await expect(profileApi.get()).resolves.toMatchObject({role:'USER',isSeller:true,sellerStatus:'APPROVED'});expect(get).toHaveBeenCalledWith('/users/profile');});it('retains pending seller applications',async()=>{get.mockResolvedValue({data:{id:'1',name:'A',email:'a@b.com',role:'USER',sellerStatus:'PENDING'}});await expect(profileApi.get()).resolves.toMatchObject({isSeller:false,sellerStatus:'PENDING'});});});
