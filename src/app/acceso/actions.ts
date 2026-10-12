'use server';
import {redirect} from 'next/navigation';
import {configured,db} from '@/lib/supabase';
export async function login(form:FormData){const email=String(form.get('email')||'').trim(),password=String(form.get('password')||'');if(!configured())redirect('/acceso?setup=1');if(!email||!password)redirect('/acceso?error=1');const s=await db();const {error}=await s.auth.signInWithPassword({email,password});if(error)redirect('/acceso?error=1');redirect('/admin');}
export async function logout(){if(configured()){const s=await db();await s.auth.signOut();}redirect('/');}
