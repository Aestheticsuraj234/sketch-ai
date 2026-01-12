import { EventSchemas } from "inngest";

// Demo event (can be removed later)
type DemoEventSent = {
  name: "demo/event.sent";
  data: {
    message: string;
  };
};

// Mockup generation event
type MockupGenerationRequested = {
  name: "mockup/generation.requested";
  data: {
    mockupId: string;
    projectId: string;
    userId: string;
    prompt: string;
    deviceType: "DESKTOP" | "MOBILE" | "TABLET" | "BOTH";
    uiLibrary: "SHADCN" | "MATERIAL_UI" | "ANT_DESIGN" | "ACETERNITY";
  };
};

export const schemas = new EventSchemas().fromUnion<
  DemoEventSent | MockupGenerationRequested
>();