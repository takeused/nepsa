import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'NEPSA · R&D 과제 포트폴리오',description:'2013 KEIT NEPSA 기반 R&D 과제 평가, 등급 및 우선순위 시뮬레이션'};
// 첫 페인트 전에 테마를 결정해 흰 화면 깜빡임을 막는다. 저장된 선택이 없으면 OS 설정을 따른다.
const themeScript=`try{var t=localStorage.getItem('nepsa-theme');if(t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.classList.add('dark')}catch(e){}`;
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ko" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeScript}}/></head><body>{children}</body></html>;}
