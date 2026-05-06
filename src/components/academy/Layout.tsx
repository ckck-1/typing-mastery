import { ReactNode } from "react";
import { Nav } from "./Nav";
import { Footer } from "./Footer";

export const Layout = ({ children, withFooter = true }: { children: ReactNode; withFooter?: boolean }) => (
  <div className="min-h-screen flex flex-col">
    <Nav />
    <main className="flex-1">{children}</main>
    {withFooter && <Footer />}
  </div>
);
