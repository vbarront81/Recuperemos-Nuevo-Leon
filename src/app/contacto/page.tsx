import type {Metadata} from 'next';
import {PageHeader} from '@/components/shell';
import {ContactForm,ContactResult} from '@/components/contact-form';
export const metadata:Metadata={title:'Contacto',description:'Comparte tus dudas e ideas con Recuperemos Nuevo León.'};
export default async function Contact({searchParams}:{searchParams:Promise<{estado?:string}>}){const {estado}=await searchParams;return <div className="container page-content"><PageHeader eyebrow="HABLEMOS" title="Contacto" description="¿Tienes una pregunta, una noticia o una idea que compartir? Queremos escucharte."/><ContactResult state={estado}/><ContactForm/></div>}
