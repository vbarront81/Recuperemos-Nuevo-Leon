import {notFound} from 'next/navigation';
import {AdminEditor} from '@/components/admin-editor';
import {requireRole} from '@/lib/auth';
import type {Content} from '@/lib/data';
export default async function Page({params}:{params:Promise<{id:string}>}){const {s,profile}=await requireRole('admin','editor','colaborador');const {data}=await s.from('articles').select('*').eq('id',(await params).id).maybeSingle();if(!data)notFound();return <AdminEditor role={profile.role} record={data as Content}/>}
