import "./globals.css";

export const metadata = {
  title: "ClaimsOps Agent",
  description: "Agentic AI MVP for insurance claims operations"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
