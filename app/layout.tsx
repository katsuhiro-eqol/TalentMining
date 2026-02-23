import type { Metadata } from "next";
import Header from "./components/headerbar"
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Talent Mining",
  description: "AIアシスタントとの対話の内容を解析して、技術ポートフォリオや課題解決の特徴と技術力などを言語化するサービス。開発者は山下克宏、運営は株式会社eQOL。",
  keywords:"AI,ChatGPT,Gemini,Claude,対話ログ、質問ログ、解析",
  icons: {
    icon: '/icons8-ai-48.png', 
  },
  openGraph: {
    title: 'Talent Mining',
    description: '普段からお世話になっているAIアシスタントとの対話内容から自分の強みや特徴を言語化するサービス',
    url: 'https://talent-mining.vercel.app/',
    images: ['/icons8-ai-48.png'],
  },
  alternates: {
    canonical: 'https://talent-mining.vercel.app/'
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <Header />
        {children}
      </body>
    </html>
  )
}