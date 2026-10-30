"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { handleActionError } from "@/lib/error-handler";

export interface PdfRequest {
  title: string;
  fileName: string;
  load: () => Promise<Blob>;
}

interface PdfPreviewDialogProps {
  request: PdfRequest | null;
  onClose: () => void;
}

/** Shows a PDF from the API inside the app, with print and download. */
export function PdfPreviewDialog({ request, onClose }: PdfPreviewDialogProps) {
  const [url, setUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!request) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    setUrl(null);
    request
      .load()
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((error) => {
        if (cancelled) return;
        handleActionError(error, "No se pudo generar el PDF");
        onClose();
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // onClose is a fresh closure each render; only a new request reloads the PDF
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  const download = () => {
    if (!url || !request) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = request.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const print = () => {
    const frame = iframeRef.current?.contentWindow;
    if (frame) {
      frame.focus();
      frame.print();
    } else if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-5xl h-[92vh] flex flex-col gap-3">
        <DialogHeader className="flex-row items-center justify-between gap-3 space-y-0 pr-8">
          <div className="min-w-0">
            <DialogTitle className="truncate">{request?.title}</DialogTitle>
            <DialogDescription>Vista previa del PDF</DialogDescription>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onClick={download} disabled={!url}>
              <Download className="mr-2 h-4 w-4" /> Descargar
            </Button>
            <Button onClick={print} disabled={!url}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 rounded-md border bg-muted/40">
          {url ? (
            <iframe ref={iframeRef} src={url} title={request?.title} className="h-full w-full rounded-md" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando PDF...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
