import type {Metadata} from 'next';
import {PageHeader} from '@/components/shell';
import {ContactForm,ContactResult} from '@/components/contact-form';
export const metadata:Metadata={title:'Publicidad y colaboraciones'};
export default async function Advertising({searchParams}:{searchParams:Promise<{estado?:string}>}){const {estado}=await searchParams;return <div className="container page-content"><PageHeader eyebrow="CREZCAMOS JUNTOS" title="Publicidad y colaboraciones" description="Si representas una marca, organización o proyecto y te interesa colaborar, cuéntanos tu propuesta."/><ContactResult state={estado}/><ContactForm kind="advertising"/></div>}
