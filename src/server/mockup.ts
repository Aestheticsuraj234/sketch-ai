import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { prisma } from "@/db";
import { inngest } from "@/inngest";
import { auth } from "@/lib/auth";

// Types matching Prisma enums
export type DeviceType = "DESKTOP" | "MOBILE" | "TABLET" | "BOTH";
export type UILibrary = "SHADCN" | "MATERIAL_UI" | "ANT_DESIGN" | "ACETERNITY";
export type MockupStatus = "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";

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
      const { prompt, deviceType, uiLibrary, projectName } = data;

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
        },
      });

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
