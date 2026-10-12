import type {Metadata} from 'next';
import './globals.css';
import {Header,Footer} from '@/components/shell';
export const metadata:Metadata={metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000'),title:{default:'Recuperemos Nuevo León | Portal de noticias',template:'%s | Recuperemos Nuevo León'},description:'Noticias locales, nacionales, política, espectáculos y tendencias virales.',openGraph:{locale:'es_MX',type:'website',siteName:'Recuperemos Nuevo León',images:[{url:'/brand/banner-nuevo-leon.jpg',width:1600,height:588,alt:'Recuperemos Nuevo León'}]}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es" data-scroll-behavior="smooth"><body><a className="skip" href="#contenido">Saltar al contenido</a><Header/><main id="contenido">{children}</main><Footer/></body></html>}
