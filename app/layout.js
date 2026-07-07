import "./globals.css";

export const metadata = {
  title: "BiD Finance Monitor Dashboard",
  description: "Realtime collections ledger and operational expenditures tracking.",
  icons: {
    icon: "/bid.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}
