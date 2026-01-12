import { inngest } from "./client";
import { prisma } from "@/db";
import { generateUIVariations } from "@/lib/ai";

export const generateMockup = inngest.createFunction(
  { 
    id: "generate-mockup",
    retries: 2,
    concurrency: {
      limit: 5,
    },
  },
  { event: "mockup/generation.requested" },
  async ({ event, step }) => {
    const { mockupId, prompt, deviceType, uiLibrary, aiModel } = event.data;

    // Step 1: Update mockup status to GENERATING
    await step.run("update-status-generating", async () => {
      await prisma.mockup.update({
        where: { id: mockupId },
        data: { status: "GENERATING" },
      });
    });

    // Step 2: Generate 3 UI variations using AI
    const generationResult = await step.run("generate-ui-variations", async () => {
      const result = await generateUIVariations({
        prompt,
        deviceType,
        uiLibrary,
        model: aiModel,
      });
      
      return result;
    });

    // Handle generation failure
    if (!generationResult.success || !generationResult.variations?.length) {
      await step.run("update-status-failed", async () => {
        await prisma.mockup.update({
          where: { id: mockupId },
          data: { 
            status: "FAILED",
            code: `// Generation failed: ${generationResult.error || "No variations generated"}`,
          },
        });
      });

      return {
        success: false,
        mockupId,
        error: generationResult.error || "No variations generated",
      };
    }

    // Step 3: Save all variations
    await step.run("save-variations", async () => {
      const variations = generationResult.variations!;
      
      // Use the first variation as the main mockup code
      await prisma.mockup.update({
        where: { id: mockupId },
        data: {
          code: variations[0].code,
          status: "COMPLETED",
        },
      });

      // Create MockupVersion entries for each variation
      const versionPromises = variations.map((variation, index) => 
        prisma.mockupVersion.create({
          data: {
            mockupId,
            version: index + 1,
            code: variation.code,
            prompt: index === 0 ? prompt : `${prompt} (${variation.label})`,
          },
        })
      );

      await Promise.all(versionPromises);
    });

    return {
      success: true,
      mockupId,
      variationsCount: generationResult.variations!.length,
      tokensUsed: generationResult.tokensUsed,
      message: `Generated ${generationResult.variations!.length} variations successfully`,
    };
  }
);
