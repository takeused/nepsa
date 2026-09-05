import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'NEPSA · R&D 과제 포트폴리오',description:'2013 KEIT NEPSA 기반 R&D 과제 평가, 등급 및 우선순위 시뮬레이션'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ko"><body>{children}</body></html>;}
