import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { prisma } from "@/db";
import { auth } from "@/lib/auth";


// Constants
export const FREE_TIER_CREDITS = 5;
export const CREDITS_RESET_INTERVAL_DAYS = 30;

export type UserCreditsInfo = {
  plan: string;
  creditsUsed: number;
  creditsRemaining: number;
  creditsTotal: number;
  isUnlimited: boolean;
  canGenerate: boolean;
  resetDate: Date | null;
  subscriptionStatus: string | null;
};

// Check if credits should be reset (monthly reset)
function shouldResetCredits(resetAt: Date): boolean {
  const now = new Date();
  const diffTime = now.getTime() - resetAt.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= CREDITS_RESET_INTERVAL_DAYS;
}

// Get user credits information
export const getUserCredits = createServerFn({ method: "GET" }).handler(
  async (): Promise<UserCreditsInfo | null> => {
    try {
      const headers = getRequestHeaders();
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          plan: true,
          creditsUsed: true,
          creditsResetAt: true,
          subscriptionStatus: true,
          polarCustomerId: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return null;
      }


      const resetAt = new Date(user.creditsResetAt);
      if (user.plan === "free" && shouldResetCredits(resetAt)) {
        // Reset credits
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            creditsUsed: 0,
            creditsResetAt: new Date(),
          },
        });
        user.creditsUsed = 0;
      }

      const isPro = user.plan === "pro";
      const isUnlimited = isPro;
      const creditsTotal = isPro ? Infinity : FREE_TIER_CREDITS;
      const creditsRemaining = isPro
        ? Infinity
        : Math.max(0, FREE_TIER_CREDITS - user.creditsUsed);
      const canGenerate = isPro || user.creditsUsed < FREE_TIER_CREDITS;

      // Calculate next reset date for free users
      const nextResetDate = new Date(resetAt);
      nextResetDate.setDate(
        nextResetDate.getDate() + CREDITS_RESET_INTERVAL_DAYS
      );

      return {
        plan: user.plan,
        creditsUsed: user.creditsUsed,
        creditsRemaining: creditsRemaining === Infinity ? -1 : creditsRemaining,
        creditsTotal: creditsTotal === Infinity ? -1 : creditsTotal,
        isUnlimited,
        canGenerate,
        resetDate: isPro ? null : nextResetDate,
        subscriptionStatus: user.subscriptionStatus,
      };
    } catch (error) {
      console.error("Error fetching user credits:", error);
      return null;
    }
  }
);

// Check if user can generate (isomorphic server function)
export const canUserGenerate = createServerFn({ method: "POST" })
  .handler(
    async (): Promise<{ canGenerate: boolean; reason?: string }> => {
      try {
        const headers = getRequestHeaders();
        const session = await auth.api.getSession({ headers });

        if (!session?.user?.id) {
          return { canGenerate: false, reason: "User ID not found" };
        }
        const userId = session.user.id;

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            plan: true,
            creditsUsed: true,
            creditsResetAt: true,
          },
        });

        if (!user) {
          return { canGenerate: false, reason: "User not found" };
        }

        // Pro users have unlimited generations
        if (user.plan === "pro") {
          return { canGenerate: true };
        }

        // Check if credits should be reset
        const resetAt = new Date(user.creditsResetAt);
        if (shouldResetCredits(resetAt)) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              creditsUsed: 0,
              creditsResetAt: new Date(),
            },
          });
          return { canGenerate: true };
        }

        // Check credits for free users
        if (user.creditsUsed >= FREE_TIER_CREDITS) {
          return {
            canGenerate: false,
            reason: `You've used all ${FREE_TIER_CREDITS} free generations this month. Upgrade to Pro for unlimited generations!`,
          };
        }

        return { canGenerate: true };
      } catch (error) {
        console.error("Error checking user generation eligibility:", error);
        return { canGenerate: false, reason: "Error checking credits" };
      }
    }
  );

// Increment user credits (isomorphic server function)
export const incrementCreditsUsed = createServerFn({ method: "POST" })
  .handler(async (): Promise<void> => {
    try {
      const headers = getRequestHeaders();
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) {
        console.error("Error incrementing credits: User ID not found");
        return;
      }
      const userId = session.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true },
      });

      // Only increment for free users
      if (user?.plan === "free") {
        await prisma.user.update({
          where: { id: userId },
          data: {
            creditsUsed: { increment: 1 },
          },
        });
      }
    } catch (error) {
      console.error("Error incrementing credits:", error);
    }
  });