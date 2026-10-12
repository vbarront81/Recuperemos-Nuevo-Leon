import { redirect } from 'next/navigation';
import { db, configured } from './supabase';
import type { Role } from './permissions';
export type Profile = {id:string;name:string;email:string;role:Role;active:boolean};
export async function requireStaff() {
  if(!configured()) redirect('/acceso?setup=1');
  const s=await db();
  const {data:{user}}=await s.auth.getUser();
  if(!user) redirect('/acceso');
  const {data:profile,error}=await s.from('profiles').select('id,name,email,role,active').eq('id',user.id).single();
  if(error || !profile || !profile.active || profile.role === 'visitante') redirect('/acceso?denied=1');
  return {s,user,profile:profile as Profile};
}
export async function requireRole(...roles:Role[]) {
  const ctx=await requireStaff();
  if(!roles.includes(ctx.profile.role)) redirect('/admin?denied=1');
  return ctx;
}
