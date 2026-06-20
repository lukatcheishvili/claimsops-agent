import fs from "node:fs";
import path from "node:path";

import ClaimsOpsApp from "@/components/ClaimsOpsApp";

function readProjectDoc(filename) {
  try {
    return fs.readFileSync(path.join(process.cwd(), "docs", filename), "utf8");
  } catch {
    return "Document not found.";
  }
}

export default function HomePage() {
  const promptPack = readProjectDoc("prompts_and_tools.md");
  const skillContract = readProjectDoc("agent_skill_contract.md");

  return <ClaimsOpsApp promptPack={promptPack} skillContract={skillContract} />;
}
