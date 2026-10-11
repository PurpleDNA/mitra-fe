import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Problem } from "@/components/landing/Problem";
import { Functions } from "@/components/landing/Functions";
import { ThreeChecks } from "@/components/landing/ThreeChecks";
import { ClearFirst } from "@/components/landing/ClearFirst";
import { Closing } from "@/components/landing/Closing";

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Functions />
        <ThreeChecks />
        <ClearFirst />
        <Closing />
      </main>
    </>
  );
}
