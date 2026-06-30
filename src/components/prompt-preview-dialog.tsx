import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { getModelLabel } from "@/lib/models";
import { parsePromptTags } from "@/lib/prompt-tags";
import { cn } from "@/lib/utils";

export type GalleryPrompt = {
  id: number;
  title: string;
  prompt: string;
  negative_prompt: string | null;
  model: string;
  tags: string | null;
  images: { id: number; url: string; sort_order: number | null }[];
};

type PromptPreviewDialogProps = {
  prompt: GalleryPrompt;
  onClose: () => void;
};

function PromptField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </h3>
      <p className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm leading-relaxed whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
}

export function PromptPreviewDialog({
  prompt,
  onClose,
}: PromptPreviewDialogProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [prompt.id]);

  const images = prompt.images;
  const hasMultipleImages = images.length > 1;
  const tags = parsePromptTags(prompt.tags);

  const goToIndex = (index: number) => {
    setActiveIndex(index);
  };

  const showPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((index) => (index > 0 ? index - 1 : images.length - 1));
  };

  const showNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((index) => (index < images.length - 1 ? index + 1 : 0));
  };

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="h-[min(90vh,42rem)] max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogTitle className="sr-only">{prompt.title}</DialogTitle>

        <div className="grid h-full grid-rows-[minmax(0,1fr)_minmax(0,1fr)] md:grid-cols-2 md:grid-rows-1">
          <div className="relative flex h-full min-h-0 flex-col bg-muted">
            <div className="relative min-h-0 flex-1 p-4">
              {images.length > 0 ? (
                <div className="pointer-events-none relative size-full">
                  {images.map((image, index) => (
                    <img
                      key={image.id}
                      src={image.url}
                      alt={index === activeIndex ? prompt.title : ""}
                      aria-hidden={index !== activeIndex}
                      className={cn(
                        "absolute inset-0 size-full object-contain transition-opacity duration-200",
                        index === activeIndex ? "opacity-100" : "opacity-0",
                      )}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImageIcon className="size-10" />
                  <span className="text-sm">暂无参考图</span>
                </div>
              )}

              {hasMultipleImages && (
                <>
                  <button
                    type="button"
                    aria-label="上一张"
                    className="absolute top-1/2 left-3 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg border border-border/60 bg-background/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
                    onClick={showPrev}
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="下一张"
                    className="absolute top-1/2 right-3 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg border border-border/60 bg-background/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
                    onClick={showNext}
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </>
              )}
            </div>

            {hasMultipleImages && (
              <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-border/60 p-3">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToIndex(index);
                    }}
                    className={cn(
                      "size-14 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                      index === activeIndex
                        ? "border-primary"
                        : "border-transparent opacity-70 hover:opacity-100",
                    )}
                  >
                    <img
                      src={image.url}
                      alt=""
                      className="size-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex h-full min-h-0 flex-col overflow-y-auto p-6">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold tracking-tight">
                {prompt.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{getModelLabel(prompt.model)}</Badge>
                {tags?.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator className="my-5" />

            <div className="space-y-5">
              <PromptField label="正向 Prompt" value={prompt.prompt} />
              {prompt.negative_prompt && (
                <PromptField
                  label="负向 Prompt"
                  value={prompt.negative_prompt}
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}