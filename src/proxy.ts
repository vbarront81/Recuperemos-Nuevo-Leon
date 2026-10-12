import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
export async function proxy(request:NextRequest) {
  if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return NextResponse.next({request});
  let response=NextResponse.next({request});
  const supabase=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{
    cookies:{
      getAll(){return request.cookies.getAll();},
      setAll(values){values.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});values.forEach(({name,value,options})=>response.cookies.set(name,value,options));}
    }
  });
  await supabase.auth.getClaims();
  return response;
}
export const config={matcher:['/((?!api/health(?:/|$)|_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)']};
