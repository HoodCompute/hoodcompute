import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { BuiltForHowYouWork } from "@/components/BuiltForHowYouWork";
import { StackingCards } from "@/components/StackingCards";
import { IndustryGrid } from "@/components/IndustryGrid";
import { StatsCarousel } from "@/components/StatsCarousel";
import { NextStepsCta } from "@/components/NextStepsCta";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="grid-wrapper">
        <Hero />
        <BuiltForHowYouWork />
        <StackingCards />
        <IndustryGrid />
        <StatsCarousel />
        <NextStepsCta />
      </main>
      <Footer />
    </>
  );
}
