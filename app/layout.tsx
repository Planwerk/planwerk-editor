import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import TerminalPanel from "@/components/TerminalPanel";
import { getNavTree } from "@/lib/docs";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_TITLE || "Planwerk Editor",
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Documentation for the planwerk-editor project",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navTree = getNavTree();
  // First item is the README — use its title for the header, exclude from sidebar
  const readmeItem = navTree[0];
  const sidebarTree = navTree.slice(1);

  return (
    <html lang="en">
      <body className="h-screen flex flex-col overflow-hidden bg-white antialiased dark:bg-gray-900 dark:text-gray-100">
        <Header title={readmeItem.title} />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar navTree={sidebarTree} />
          {children}
        </div>
        <TerminalPanel />
      </body>
    </html>
  );
}
