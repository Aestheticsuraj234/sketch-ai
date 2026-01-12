import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { prisma } from "@/db";
import { auth } from "@/lib/auth";
import { polarClient } from "@/lib/auth";

// Directly update user to Pro after successful checkout
export const activateProSubscription = createServerFn({ method: "POST" })
  .handler(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log("Activating Pro subscription...");
      const headers = getRequestHeaders();
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) {
        console.error("Activation failed: Not authenticated");
        return {
          success: false,
          error: "Not authenticated",
        };
      }

      const userId = session.user.id;
      console.log(`Checking user ${userId} for Polar customer ID`);

      // Get user to check if they have a Polar customer ID
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          polarCustomerId: true,
        },
      });

      console.log(`User ${userId} Polar Customer ID: ${user?.polarCustomerId}`);

      // If user has a Polar customer ID, they likely just completed checkout
      // Update them to Pro directly
      if (user?.polarCustomerId) {
        console.log(`Updating user ${userId} to Pro (has Customer ID)`);
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "pro",
            subscriptionStatus: "active",
          },
        });
        console.log(`User ${userId} updated to Pro`);

        return { success: true };
      }

      // If no customer ID, they might not have completed checkout yet
      // But we'll still update to pro (edge case handling)
      console.log(`Updating user ${userId} to Pro (WARNING: No Customer ID)`);
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: "pro",
          subscriptionStatus: "active",
        },
      });
      console.log(`User ${userId} updated to Pro (Fallback)`);

      return { success: true };
    } catch (error) {
      console.error("Error activating Pro subscription:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

// Sync subscription status from Polar (isomorphic server function)
export const syncSubscriptionStatus = createServerFn({ method: "POST" })
  .inputValidator((userId: string) => userId)
  .handler(
    async ({ data: userId }): Promise<{
      success: boolean;
      plan: string;
      subscriptionStatus: string | null
    }> => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            polarCustomerId: true,
            subscriptionId: true,
            plan: true,
            subscriptionStatus: true,
          },
        });

        if (!user || !user.polarCustomerId) {
          return {
            success: true,
            plan: user?.plan || "free",
            subscriptionStatus: user?.subscriptionStatus || null,
          };
        }

        try {
          const subscriptions: any = await polarClient.subscriptions.list({
            customerId: user.polarCustomerId,
          });

          const activeSubscription = subscriptions.items?.find(
            (sub: any) => sub.status === "active" || sub.status === "trialing"
          );

          if (activeSubscription) {
            const newStatus = activeSubscription.status;
            const isActive = newStatus === "active" || newStatus === "trialing";

            await prisma.user.update({
              where: { id: userId },
              data: {
                plan: isActive ? "pro" : "free",
                subscriptionStatus: newStatus,
                subscriptionId: activeSubscription.id,
              },
            });

            return {
              success: true,
              plan: isActive ? "pro" : "free",
              subscriptionStatus: newStatus,
            };
          } else {
            await prisma.user.update({
              where: { id: userId },
              data: {
                plan: "free",
                subscriptionStatus: null,
                subscriptionId: null,
              },
            });

            return {
              success: true,
              plan: "free",
              subscriptionStatus: null,
            };
          }
        } catch (polarError) {
          console.error("Error fetching from Polar API:", polarError);
          return {
            success: true,
            plan: user.plan,
            subscriptionStatus: user.subscriptionStatus,
          };
        }
      } catch (error) {
        console.error("Error syncing subscription status:", error);
        return {
          success: false,
          plan: "free",
          subscriptionStatus: null,
        };
      }
    }
  );