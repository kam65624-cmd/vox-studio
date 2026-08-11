import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding VOX Studio database...");

  // ─── Seed Workspace ───────────────────────────────────────────────────────
  const workspace = await prisma.workspace.upsert({
    where: { slug: "vixor" },
    update: {},
    create: {
      name: "VIXOR Studio",
      slug: "vixor",
    },
  });
  console.log("✓ Workspace:", workspace.slug);

  // ─── Seed Prof. Tradeo Character Asset ───────────────────────────────────
  const characterAsset = await prisma.asset.upsert({
    where: {
      workspaceId_slug_type: {
        workspaceId: workspace.id,
        slug: "prof-tradeo",
        type: "CHARACTER",
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      type: "CHARACTER",
      name: "Prof. Tradeo",
      slug: "prof-tradeo",
      description:
        "Smart, sarcastic, curious market-analysis host who loves analysis and coffee and learns from mistakes.",
      isCanonical: true,
      metadata: {
        visual:
          "Felt/puppet-like editorial character. White wild hair, large bushy eyebrows and moustache, expressive round eyes, orange/red nose.",
        wardrobe:
          "Dark green/teal blazer, mustard/caramel vest, white shirt, red bow tie, pocket square, chain/watch detail.",
        expressions: [
          "Happy",
          "Surprised",
          "Thinking",
          "Sarcastic",
          "Angry",
          "Shocked",
          "Hesitant",
          "Confident",
        ],
        personality: "Educational depth. Smart sarcasm. Rich visuals. Reliable information.",
        tone: "Laugh at the situation, never at the information.",
        palette: {
          PAPER: "#F2EDE2",
          INK_NAVY: "#111820",
          CHARACTER_ORANGE: "#F68B1E",
          VIXOR_RED: "#D94B3D",
          MUTED_YELLOW: "#D8AA45",
          DEEP_TEAL: "#0E5B56",
          WARM_BROWN: "#5B3A28",
        },
      },
    },
  });
  console.log("✓ Asset:", characterAsset.name, "(canonical)");

  // ─── Seed Prof. Tradeo Studio Asset ──────────────────────────────────────
  const studioAsset = await prisma.asset.upsert({
    where: {
      workspaceId_slug_type: {
        workspaceId: workspace.id,
        slug: "tradeo-editorial-study",
        type: "STUDIO",
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      type: "STUDIO",
      name: "Tradeo Editorial Study",
      slug: "tradeo-editorial-study",
      description: "Warm dark editorial study/podcast set.",
      isCanonical: true,
      metadata: {
        elements: [
          "wood desk",
          "black microphone",
          "black mug",
          "notebook",
          "papers",
          "pen",
          "books",
          "warm desk lamp",
          "shelves",
          "bronze bull",
          "globe/decor",
          "pinned charts",
          "world map",
          "question mark paper",
          "red-string board",
          "plant",
          "chart monitor",
        ],
        lighting: "Warm, dramatic editorial",
        mood: "Expert, credible, curious",
      },
    },
  });
  console.log("✓ Asset:", studioAsset.name, "(canonical)");

  // ─── Seed VOX Style Asset ─────────────────────────────────────────────────
  const voxStyleAsset = await prisma.asset.upsert({
    where: {
      workspaceId_slug_type: {
        workspaceId: workspace.id,
        slug: "vox-editorial-style",
        type: "STYLE",
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      type: "STYLE",
      name: "VOX Editorial Style",
      slug: "vox-editorial-style",
      description:
        "Paper/collage editorial world — VOX mixed-media language with paper grain, halftone, ink edges.",
      isCanonical: true,
      metadata: {
        palette: ["#F2EDE2", "#111820", "#D94B3D", "#D8AA45", "#0E5B56", "#5B3A28"],
        texture: "paper grain, halftone, ink edges, tape/stickers, rough tears, paper folds",
        graphicsLanguage: "charts, arrows, circles, archival imagery, editorial typography",
        accentColors: "red, mustard, teal — controlled use only",
        negativeRules: [
          "No generic motion graphics",
          "No rainbow colors",
          "No excessive glows",
          "No generic stock footage",
        ],
        transitionLanguage: [
          "Page Flip",
          "Chart Line",
          "Marker Circle",
          "Paper Tear",
          "Match Cut",
          "Zoom Into",
          "Push In/Out",
          "Whip Pan",
        ],
        cameraLanguage: ["Parallax", "Dynamic Angle", "Macro", "Follow Action"],
        sceneLanguage: [
          "Host Scene",
          "Transition",
          "VOX Explainer",
          "Mini Host",
          "Reaction Shot",
          "Loop Back",
        ],
      },
    },
  });
  console.log("✓ Asset:", voxStyleAsset.name, "(canonical)");

  // ─── Seed Production Recipe ───────────────────────────────────────────────
  const recipe = await prisma.productionRecipe.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Prof. Tradeo × VOX Editorial",
      characterId: characterAsset.id,
      studioId: studioAsset.id,
      styleId: voxStyleAsset.id,
      defaultTransitionLang: "Paper Tear",
      captionsEnabled: true,
      musicEnabled: false,
      sfxEnabled: false,
    },
  });
  console.log("✓ Production Recipe:", recipe.name);

  console.log("\n✅ Seed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
