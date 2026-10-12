import type {Metadata} from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {PageHeader} from '@/components/shell';
import {settings} from '@/lib/data';
export const metadata:Metadata={title:'Quiénes somos',description:'Conoce el portal de noticias Recuperemos Nuevo León.'};
export const dynamic='force-dynamic';
export default async function About(){const cfg=await settings();return <div className="container page-content"><PageHeader eyebrow="EL PROYECTO" title="Quiénes somos" description="Información actual y temas que importan a Nuevo León y México."/><div className="info-grid"><div><span className="eyebrow">RECUPEREMOS NUEVO LEÓN</span><h2>INFORMACIÓN<br/>QUE IMPORTA.</h2><p>{cfg.about_text||'Recuperemos Nuevo León es un portal digital de noticias con secciones de información local, nacional, política, espectáculos y tendencias virales.'}</p><p>Buscamos ofrecer un espacio claro y accesible para consultar las noticias y seguir los temas de actualidad.</p><Link className="button button-dark" href="/contacto">CONTÁCTANOS ↗</Link></div><div className="info-panel"><Image src="/brand/logo.jpg" alt="Logotipo oficial de Recuperemos Nuevo León" width={640} height={640}/></div></div></div>}
