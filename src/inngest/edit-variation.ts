import { inngest } from "./client";
import { prisma } from "@/db";
import { editUICode } from "@/lib/ai";

export const editVariation = inngest.createFunction(
  { 
    id: "edit-variation",
    retries: 2,
    concurrency: {
      limit: 5,
    },
  },
  { event: "mockup/variation.edit.requested" },
  async ({ event, step }) => {
    const { versionId, mockupId, currentHtml, editPrompt, aiModel } = event.data;

    // Step 1: Generate edited version using AI
    const editResult = await step.run("edit-ui-code", async () => {
      const result = await editUICode({
        currentHtml,
        editPrompt,
        model: aiModel,
      });
      
      return result;
    });

    // Handle edit failure
    if (!editResult.success || !editResult.code) {
      return {
        success: false,
        versionId,
        mockupId,
        error: editResult.error || "Failed to generate edited code",
      };
    }

    // Step 2: Update the existing version with new code
    const updatedVersion = await step.run("update-version", async () => {
      // Get the version number first
      const versionData = await prisma.mockupVersion.findUnique({
        where: { id: versionId },
        select: { version: true },
      });

      // Update the version with new code
      const version = await prisma.mockupVersion.update({
        where: { id: versionId },
        data: {
          code: editResult.code!,
          prompt: editPrompt,
        },
      });

      // Also update the main mockup code if this is version 1
      if (versionData?.version === 1) {
        await prisma.mockup.update({
          where: { id: mockupId },
          data: { code: editResult.code! },
        });
      }

      return version;
    });

    return {
      success: true,
      versionId,
      mockupId,
      updatedVersionId: updatedVersion.id,
      tokensUsed: editResult.tokensUsed,
      message: "Variation edited successfully",
    };
  }
);
