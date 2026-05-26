import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata = {
  title: 'CitySweat | GHG & LST Analysis Dashboard',
  description: 'ระบบวิเคราะห์ความสัมพันธ์ระหว่างก๊าซเรือนกระจกกับอุณหภูมิพื้นผิวในเขตเมือง กรุงเทพมหานคร',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${inter.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
