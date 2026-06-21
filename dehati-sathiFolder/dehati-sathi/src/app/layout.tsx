import type { Metadata } from "next";
import { SocketProvider } from "@/components/SocketProvider"; 
import "./globals.css";
import Provider from '@/Provider';
import StoreProvider from "@/redux/StoreProvider";
import InitUser from "@/InitUser";
import { Toaster } from 'sonner';
import Nav from "@/components/Nav";
import BottomNav from "@/components/BottomNav"; 
import { SidebarProvider } from "@/context/SidebarContext";
import { auth } from "@/auth"; 
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import OnboardingAssistant from "@/components/OnboardingAssistant";

export const metadata: Metadata = {
  title: "Dehati Sathi | Direct Farm To Home",
  description: "Direct Farm To Home",
  icons: {
    icon: '/icon.png?v=4',
    apple: '/icon.png?v=4',
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const session = await auth();
  const locale = await getLocale();
  const messages = await getMessages();

  // Construct a safe User Object
  const navUser = {
      name: session?.user?.name || "Guest",
      email: session?.user?.email || "",
      image: session?.user?.image || "", 
      role: (session?.user as any)?.role || "user", 
      _id: (session?.user as any)?.id || "",
      connectedHub: (session?.user as any)?.connectedHub || null,
  };

  return (
    <html lang={locale}>
      <body className="w-full min-h-screen bg-linear-to-b from-green-50 to-white">
        <Provider>
          <SocketProvider>
            <StoreProvider>
              <InitUser/>
              <SidebarProvider>
                <NextIntlClientProvider locale={locale} messages={messages}>
                <OnboardingAssistant />
                <div className="flex min-h-screen">
                  
                  {/* Desktop Sidebar (Left) */}
                  <Nav user={navUser as any} /> 

                  {/* Main Content (Center) */}
                  <main className="flex-1 w-full pb-20 md:pb-0 transition-all duration-300">
                    {children}
                  </main>

                  {/* Mobile Bottom Nav (Bottom) */}
                  <BottomNav user={navUser} />
                  
                </div>
                </NextIntlClientProvider>
              </SidebarProvider>
            </StoreProvider>
            
            {/* Global Toaster for notifications */}
            <Toaster position="top-center" richColors />

          </SocketProvider>
        </Provider>
      </body>
    </html>
  );
}
