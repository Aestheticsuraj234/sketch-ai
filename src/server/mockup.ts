import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { prisma } from "@/db";
import { inngest } from "@/inngest";
import { auth } from "@/lib/auth";
import { canUserGenerate, incrementCreditsUsed } from "./credits";


export type DeviceType = "DESKTOP" | "MOBILE" | "TABLET" | "BOTH";
export type UILibrary = "SHADCN" | "MATERIAL_UI" | "ANT_DESIGN" | "ACETERNITY";
export type MockupStatus = "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";
export type AIModel = "sketch-mini" | "sketch-pro";


export const MockupStatus = {
  PENDING: "PENDING" as const,
  GENERATING: "GENERATING" as const,
  COMPLETED: "COMPLETED" as const,
  FAILED: "FAILED" as const,
};

export type MockupWithProject = {
  id: string;
  name: string;
  prompt: string;
  deviceType: DeviceType;
  uiLibrary: UILibrary;
  status: MockupStatus;
  createdAt: Date;
  updatedAt: Date;
  project: {
    id: string;
    name: string;
  };
};

type CreateMockupInput = {
  prompt: string;
  deviceType: DeviceType;
  uiLibrary: UILibrary;
  aiModel: AIModel;
  projectName?: string;
};

type CreateMockupResult = {
  success: boolean;
  mockupId?: string;
  projectId?: string;
  error?: string;
};

export const createMockup = createServerFn({ method: "POST" })
  .inputValidator((data: CreateMockupInput) => data)
  .handler(async ({ data }): Promise<CreateMockupResult> => {
    try {
      // Get current user session
      const headers = getRequestHeaders();
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) {
        return {
          success: false,
          error: "Unauthorized. Please sign in to create mockups.",
        };
      }

      const userId = session.user.id;

      // Check if user can generate (rate limiting)
      const { canGenerate, reason } = await canUserGenerate();
      if (!canGenerate) {
        return {
          success: false,
          error: reason || "You've reached your generation limit. Please upgrade to Pro for unlimited generations.",
        };
      }

      const { prompt, deviceType, uiLibrary, aiModel, projectName } = data;

      // Create a new project for this mockup
      const project = await prisma.project.create({
        data: {
          name: projectName || `Project ${new Date().toLocaleDateString()}`,
          description: prompt.slice(0, 200),
          userId,
        },
      });

      // Create the mockup with PENDING status
      const mockup = await prisma.mockup.create({
        data: {
          name: `Mockup - ${prompt.slice(0, 50)}...`,
          prompt,
          code: "", // Will be filled by Inngest job
          deviceType,
          uiLibrary,
          status: "PENDING",
          projectId: project.id,
        },
      });

      // Trigger Inngest background job for AI generation
      await inngest.send({
        name: "mockup/generation.requested",
        data: {
          mockupId: mockup.id,
          projectId: project.id,
          userId,
          prompt,
          deviceType,
          uiLibrary,
          aiModel,
        },
      });

      // Increment credits used for free users
      await incrementCreditsUsed();

      return {
        success: true,
        mockupId: mockup.id,
        projectId: project.id,
      };
    } catch (error) {
      console.error("Error creating mockup:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create mockup",
      };
    }
  });

// Get all mockups for the current user
export const getUserMockups = createServerFn({ method: "GET" }).handler(
  async (): Promise<MockupWithProject[]> => {
    try {
      const headers = getRequestHeaders();
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) {
        return [];
      }

      const mockups = await prisma.mockup.findMany({
        where: {
          project: {
            userId: session.user.id,
          },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return mockups as MockupWithProject[];
    } catch (error) {
      console.error("Error fetching mockups:", error);
      return [];
    }
  }
);

// Type for single mockup with code
export type MockupWithCode = {
  id: string;
  name: string;
  prompt: string;
  code: string;
  deviceType: DeviceType;
  uiLibrary: UILibrary;
  status: MockupStatus;
  createdAt: Date;
  updatedAt: Date;
};

// Type for variation
export type MockupVariation = {
  id: string;
  version: number;
  code: string;
  prompt: string;
  createdAt: Date;
};

// Type for mockup with variations
export type MockupWithVariations = MockupWithCode & {
  variations: MockupVariation[];
};

// Get a single mockup by ID
export const getMockupById = createServerFn({ method: "GET" })
  .inputValidator((data: string) => data)
  .handler(async ({ data: mockupId }): Promise<MockupWithCode | null> => {
    try {
      const headers = getRequestHeaders();
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) {
        return null;
      }

      const mockup = await prisma.mockup.findFirst({
        where: {
          id: mockupId,
          project: {
            userId: session.user.id,
          },
        },
      });

      return mockup as MockupWithCode | null;
    } catch (error) {
      console.error("Error fetching mockup:", error);
      return null;
    }
  });

// Get a single mockup with all its variations
export const getMockupWithVariations = createServerFn({ method: "GET" })
  .inputValidator((data: string) => data)
  .handler(async ({ data: mockupId }): Promise<MockupWithVariations | null> => {
    try {
      const headers = getRequestHeaders();
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) {
        return null;
      }

      const mockup = await prisma.mockup.findFirst({
        where: {
          id: mockupId,
          project: {
            userId: session.user.id,
          },
        },
        include: {
          versions: {
            orderBy: {
              version: "asc",
            },
            select: {
              id: true,
              version: true,
              code: true,
              prompt: true,
              createdAt: true,
            },
          },
        },
      });

      if (!mockup) {
        return null;
      }

      return {
        ...mockup,
        variations: mockup.versions,
      } as MockupWithVariations;
    } catch (error) {
      console.error("Error fetching mockup with variations:", error);
      return null;
    }
  });

// Edit variation input type
type EditVariationInput = {
  versionId: string;
  mockupId: string;
  editPrompt: string;
  aiModel: AIModel;
};

type EditVariationResult = {
  success: boolean;
  error?: string;
};

// Trigger AI edit for a variation
export const editVariation = createServerFn({ method: "POST" })
  .inputValidator((data: EditVariationInput) => data)
  .handler(async ({ data }): Promise<EditVariationResult> => {
    try {
      const headers = getRequestHeaders();
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) {
        return {
          success: false,
          error: "Unauthorized. Please sign in.",
        };
      }

      // Check if user can generate (rate limiting)
      const { canGenerate, reason } = await canUserGenerate();
      if (!canGenerate) {
        return {
          success: false,
          error: reason || "You've reached your generation limit. Please upgrade to Pro for unlimited generations.",
        };
      }

      const { versionId, mockupId, editPrompt, aiModel } = data;

      // Verify the user owns this mockup
      const mockup = await prisma.mockup.findFirst({
        where: {
          id: mockupId,
          project: {
            userId: session.user.id,
          },
        },
      });

      if (!mockup) {
        return {
          success: false,
          error: "Mockup not found or unauthorized.",
        };
      }

      // Get the current version's code
      const version = await prisma.mockupVersion.findUnique({
        where: { id: versionId },
        select: { code: true },
      });

      if (!version) {
        return {
          success: false,
          error: "Version not found.",
        };
      }

      // Trigger Inngest background job for AI edit
      await inngest.send({
        name: "mockup/variation.edit.requested",
        data: {
          versionId,
          mockupId,
          currentHtml: version.code,
          editPrompt,
          aiModel,
        },
      });

      // Increment credits used for free users
      await incrementCreditsUsed();

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error triggering variation edit:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to trigger edit",
      };
    }
  });
