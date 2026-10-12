'use server';
import {redirect} from 'next/navigation';
import {configured,privileged} from '@/lib/supabase';
import {messageSchema} from '@/lib/validation';
import {validateHuman} from '@/lib/turnstile';
export async function submitContact(form: FormData) {
  const kind = form.get('kind') === 'advertising' ? 'advertising' : 'contact';
  const target = kind === 'advertising' ? '/publicidad' : '/contacto';
  const raw = {
    name:form.get('name'),email:form.get('email'),subject:form.get('subject'),
    message:form.get('message'),consent:form.get('consent') === 'on',
    website:form.get('website') || '', kind
  };
  const valid = messageSchema.safeParse(raw);
  if (!valid.success) redirect(`${target}?estado=validacion`);
  if (!configured() || !process.env.SUPABASE_SECRET_KEY || !process.env.TURNSTILE_SECRET_KEY || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    redirect(`${target}?estado=configuracion`);
  }
  const token = String(form.get('cf-turnstile-response') || '');
  if (!await validateHuman(token)) redirect(`${target}?estado=verificacion`);
  // RLS deniega insert directo; solo este endpoint verificado usa service-role server-side.
  const {error} = await privileged().from('contact_messages').insert({
    name:valid.data.name, email:valid.data.email,subject:valid.data.subject,
    message:valid.data.message,kind:valid.data.kind
  });
  if (error) {
    console.error('Falló la inserción de contacto',error.code);
    redirect(`${target}?estado=error`);
  }
  redirect(`${target}?estado=enviado`);
}
