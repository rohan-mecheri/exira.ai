import { Hero } from "@/components/Hero";
import { Gap } from "@/components/Gap";
import { Pinned } from "@/components/Pinned";
import { ModuleMatrix } from "@/components/ModuleMatrix";
import { Report } from "@/components/Report";
import { WhereItFits } from "@/components/WhereItFits";
import { Cta } from "@/components/Cta";
import { Reveals } from "@/components/Reveals";

/* The section order is the argument — see docs/website-spec.md §2. */

export default function Home() {
  return (
    <main id="top">
      <Hero />
      <Gap />
      <Pinned />
      <ModuleMatrix />
      <Report />
      <WhereItFits />
      <Cta />
      <Reveals />
    </main>
  );
}
