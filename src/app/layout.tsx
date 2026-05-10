import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "TaskFlow — Team Task Manager",
  description: "Manage projects, assign tasks and track progress with your team.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#181b25",
                color: "#f0f2f8",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "10px",
                fontSize: "14px",
              },
              success: { iconTheme: { primary: "#22c55e", secondary: "#181b25" } },
              error: { iconTheme: { primary: "#ef4444", secondary: "#181b25" } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
