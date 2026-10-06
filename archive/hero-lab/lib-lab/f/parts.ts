import { MODULES } from "@/lib/modules";

/* What each part of the die is called when it is clicked. Station names
   follow the eleven modules, in order. */

export const MODULE_NAMES = MODULES.map((m) => m.name);

export type PartKey = "sealed" | "seal" | "modules" | "station" | "code" | "finding";

export const PART_TEXT: Record<PartKey, { title: string; body: string }> = {
  sealed: { title: "Sealed environment", body: "Your code is read inside. Nobody can see in." },
  seal: { title: "Attestation seal", body: "Proof the environment stayed sealed." },
  modules: { title: "Eleven modules", body: "Each one checks the code, and each other." },
  station: { title: "Module", body: "One of eleven checks." },
  code: { title: "Your codebase", body: "Read in place. It never leaves." },
  finding: { title: "Finding", body: "The only thing that comes out." },
};
