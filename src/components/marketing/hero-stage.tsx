"use client";

import { useState, type ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { HeroHeadline } from "@/components/marketing/hero-headline";
import { HeroPhoneShowcase, type HeroPhone } from "@/components/marketing/hero-phone-showcase";

/**
 * Keeps the headline's product word and the phone on stage in step: when the
 * carousel moves (autoplay, swipe, arrows or dots), the word follows it.
 */
export function HeroStage({
  phones,
  headlineClassName,
  stageDecor,
}: {
  phones: readonly HeroPhone[];
  headlineClassName: string;
  stageDecor: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  const word = phones[active]?.word ?? "Website";

  return (
    <>
      <Container size="lg" className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <HeroHeadline word={word} animate={hasMoved} className={headlineClassName} />
        </div>
      </Container>

      <Container size="xl" className="relative mt-8 sm:mt-10">
        {stageDecor}
        <HeroPhoneShowcase
          phones={phones}
          onActiveChange={(index) => {
            setActive(index);
            setHasMoved(true);
          }}
        />
      </Container>
    </>
  );
}
