import { describe, expect, it, vi } from 'vitest';
const { get, put, post } = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), post: vi.fn() }));
vi.mock('@/shared/api/client',()=>({default:{get,put,post}}));
import { profileApi } from './profile';
describe('profileApi',()=>{it('maps verified backend users to seller capability',async()=>{get.mockResolvedValue({data:{id:'1',name:'A',email:'a@b.com',role:'USER',sellerStatus:'VERIFIED'}});await expect(profileApi.get()).resolves.toMatchObject({role:'USER',isSeller:true});expect(get).toHaveBeenCalledWith('/users/profile');});});
