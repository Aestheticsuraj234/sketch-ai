import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Canvas, type Variation } from "@/components/canvas";
import { getMockupWithVariations } from "@/server/mockup";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/playground/$playgroundId")({
  component: PlaygroundPage,
});

function PlaygroundPage() {
  const { playgroundId } = Route.useParams();
  const queryClient = useQueryClient();

  const {
    data: mockup,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["mockup", playgroundId],
    queryFn: () => getMockupWithVariations({ data: playgroundId }),
    refetchInterval: (query) => {
      // Auto-refetch every 2s while generating
      const status = query.state.data?.status;
      if (status === "PENDING" || status === "GENERATING") {
        return 2000;
      }
      return false;
    },
  });

  
  const handleEditComplete = () => {
   
    const pollInterval = setInterval(async () => {
      await queryClient.invalidateQueries({ queryKey: ["mockup", playgroundId] });
    }, 2000);

  
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 30000);
  };

  // Loading state - initial load
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-sm">Loading mockup...</p>
      </div>
    );
  }

  // Error state
  if (error || !mockup) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load mockup</h2>
        <p className="text-muted-foreground text-sm mb-4">
          {error?.message || "Mockup not found or you don't have access"}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }


  if (mockup.status === "PENDING" || mockup.status === "GENERATING") {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
        <div className="relative mb-6">
          {/* Animated rings */}
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div
            className={cn(
              "relative h-16 w-16 rounded-full border-4 border-muted",
              "flex items-center justify-center"
            )}
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-2">
          {mockup.status === "PENDING"
            ? "Preparing your mockup..."
            : "Generating variations..."}
        </h2>

        <p className="text-muted-foreground text-sm text-center max-w-md mb-4">
          {mockup.status === "PENDING"
            ? "Your mockup is queued and will start generating shortly."
            : "AI is creating 3 unique variations based on your prompt. This usually takes 15-30 seconds."}
        </p>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              mockup.status === "PENDING"
                ? "bg-amber-500 animate-pulse"
                : "bg-green-500"
            )}
          />
          <span>
            {mockup.status === "PENDING" ? "Queued" : "Generating"}
          </span>
          {isRefetching && (
            <Loader2 className="h-3 w-3 animate-spin ml-2" />
          )}
        </div>

        {/* Prompt preview */}
        <div className="mt-8 max-w-lg w-full px-4">
          <div className="bg-muted/50 rounded-lg p-4 border">
            <p className="text-xs text-muted-foreground mb-1">Prompt</p>
            <p className="text-sm line-clamp-3">{mockup.prompt}</p>
          </div>
        </div>
      </div>
    );
  }

  // Failed state
  if (mockup.status === "FAILED") {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Generation Failed</h2>
        <p className="text-muted-foreground text-sm text-center max-w-md mb-4">
          Something went wrong while generating your mockup. This could be due
          to high demand or an issue with the AI service.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>

        {/* Error details */}
        {mockup.code && mockup.code.startsWith("//") && (
          <div className="mt-6 max-w-lg w-full px-4">
            <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20">
              <p className="text-xs text-destructive mb-1">Error Details</p>
              <code className="text-xs text-destructive/80">
                {mockup.code.replace("// Generation failed: ", "")}
              </code>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Completed state - convert variations to Canvas format
  const canvasVariations: Variation[] =
    mockup.variations?.length > 0
      ? mockup.variations.map((v) => ({
        id: v.id,
        code: v.code,
        label: `V${v.version}`,
        version: v.version,
      }))
      : [
        {
          id: "default",
          code: mockup.code,
          label: "V1",
          version: 1,
        },
      ];

  return (
    <Canvas
      title={mockup.name || `Mockup ${playgroundId}`}
      mockupId={mockup.id}
      deviceType={mockup.deviceType}
      variations={canvasVariations}
      onEditComplete={handleEditComplete}
    />
  );
}
