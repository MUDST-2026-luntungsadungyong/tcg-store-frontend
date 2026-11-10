import { describe, expect, it, vi } from 'vitest';
const { get, put, post, del } = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), post: vi.fn(), del: vi.fn() }));
vi.mock('@/shared/api/client',()=>({default:{get,put,post,delete:del}}));
import { profileApi } from './profile';
describe('profileApi',()=>{it('maps approved backend users to seller capability',async()=>{get.mockResolvedValue({data:{id:'1',name:'A',email:'a@b.com',role:'USER',sellerStatus:'APPROVED'}});await expect(profileApi.get()).resolves.toMatchObject({role:'USER',isSeller:true,sellerStatus:'APPROVED'});expect(get).toHaveBeenCalledWith('/users/profile');});it('retains pending seller applications',async()=>{get.mockResolvedValue({data:{id:'1',name:'A',email:'a@b.com',role:'USER',sellerStatus:'PENDING'}});await expect(profileApi.get()).resolves.toMatchObject({isSeller:false,sellerStatus:'PENDING'});});});

 it('sends avatar as multipart and maps the saved user',async()=>{
  post.mockResolvedValue({data:{id:'1',name:'A',email:'a@b.com',role:'USER',avatarUrl:'https://cdn.example/avatar.png'}});
  const file=new File(['image'],'photo.png',{type:'image/png'});
  await expect(profileApi.uploadAvatar(file)).resolves.toMatchObject({avatarUrl:'https://cdn.example/avatar.png'});
  const [url,body,config]=post.mock.calls.at(-1)!;
  expect(url).toBe('/users/profile/avatar');
  expect(body.get('image')).toBe(file);
  expect(config.headers['Content-Type']).toBe('multipart/form-data');
 });

it('removes the avatar and maps the returned profile', async () => {
  del.mockResolvedValue({ data: { id: '1', name: 'A', email: 'a@b.com', role: 'USER', avatarUrl: null } });
  await expect(profileApi.removeAvatar()).resolves.toMatchObject({ id: '1', avatarUrl: null });
  expect(del).toHaveBeenCalledWith('/users/profile/avatar');
});
