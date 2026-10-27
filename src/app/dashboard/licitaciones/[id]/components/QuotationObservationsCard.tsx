"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, MessageSquareText, Save, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { showSnackbar } from "@/components/ui/snackbar";

import { handleActionError } from "@/lib/error-handler";
import { uploadProductImage } from "@/lib/firebase";
import { ObservationImage, Quotation, cotizacionesService } from "@/services/cotizaciones.service";
import { productsService } from "@/services/products.service";

/** The PDF shows up to this many images under the observations. */
const MAX_IMAGES = 12;

interface ProductPhoto {
  url: string;
  caption: string;
}

interface QuotationObservationsCardProps {
  quotation: Quotation;
}

/**
 * Observations of the quotation plus product images that go under them in the PDF.
 * Images are picked from the photos of the quoted products, or uploaded.
 */
export function QuotationObservationsCard({ quotation }: QuotationObservationsCardProps) {
  const [observations, setObservations] = useState(quotation.observations ?? "");
  const [images, setImages] = useState<ObservationImage[]>(quotation.observationImages ?? []);
  const [saved, setSaved] = useState({ observations: quotation.observations ?? "", images: quotation.observationImages ?? [] });
  const [isSaving, setIsSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [photos, setPhotos] = useState<ProductPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const isDirty = observations.trim() !== saved.observations.trim() || JSON.stringify(images) !== JSON.stringify(saved.images);

  // Photos of the products in this quotation, loaded when the picker opens
  useEffect(() => {
    if (!pickerOpen) return;
    let cancelled = false;
    setPhotosLoading(true);
    const productIds = [...new Set(quotation.items.map((item) => item.productId).filter((id): id is number => Boolean(id)))];
    Promise.all(productIds.map((id) => productsService.getById(id).catch(() => null)))
      .then((products) => {
        if (cancelled) return;
        setPhotos(
          products.flatMap((product) =>
            product
              ? (product.images ?? []).map((url) => ({ url, caption: [product.name, product.code?.trim()].filter(Boolean).join(" ") }))
              : [],
          ),
        );
      })
      .finally(() => !cancelled && setPhotosLoading(false));
    return () => {
      cancelled = true;
    };
  }, [pickerOpen, quotation.items]);

  const openPicker = () => {
    setSelected([]);
    setPickerOpen(true);
  };

  const addSelected = () => {
    const toAdd = photos.filter((photo) => selected.includes(photo.url) && !images.some((image) => image.url === photo.url));
    setImages((prev) => [...prev, ...toAdd.map((photo) => ({ url: photo.url, caption: photo.caption }))].slice(0, MAX_IMAGES));
    setPickerOpen(false);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const urls = await Promise.all([...files].slice(0, MAX_IMAGES - images.length).map((file) => uploadProductImage(file)));
      setImages((prev) => [...prev, ...urls.map((url) => ({ url, caption: "" }))]);
    } catch (error) {
      handleActionError(error, "No se pudo subir la imagen");
    } finally {
      setIsUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const cleanImages = images.map((image) => ({ url: image.url, caption: image.caption?.trim() || null }));
      await cotizacionesService.update(quotation.id, { observations: observations.trim(), observationImages: cleanImages });
      setSaved({ observations: observations.trim(), images: cleanImages });
      setImages(cleanImages);
      showSnackbar("Observaciones guardadas. Ya salen en el PDF.", "success");
    } catch (error) {
      handleActionError(error, "No se pudieron guardar las observaciones");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="gap-1">
        <CardTitle className="flex items-center gap-2 text-base text-brand-navy">
          <MessageSquareText className="h-4 w-4" /> Observaciones
        </CardTitle>
        <CardDescription>
          Texto e imágenes que salen al final del PDF de la cotización. Las imágenes mantienen su proporción y su nitidez.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          rows={3}
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder="Observaciones generales de la cotización"
        />

        {images.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image, index) => (
              <div key={image.url} className="space-y-2 rounded-xl border p-2">
                <div className="relative flex h-40 items-center justify-center rounded-lg bg-[radial-gradient(circle_at_50%_40%,#fff_0,#F1F5FA_70%)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt={image.caption || `Imagen ${index + 1}`} className="max-h-[92%] max-w-[92%] object-contain" />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="absolute right-1.5 top-1.5 h-7 w-7 rounded-full bg-white"
                    onClick={() => setImages((prev) => prev.filter((item) => item.url !== image.url))}
                    aria-label="Quitar imagen"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Input
                  value={image.caption ?? ""}
                  onChange={(e) =>
                    setImages((prev) => prev.map((item) => (item.url === image.url ? { ...item, caption: e.target.value } : item)))
                  }
                  placeholder="Texto debajo de la imagen (opcional)"
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={openPicker} disabled={images.length >= MAX_IMAGES}>
            <ImagePlus className="mr-2 h-4 w-4" /> Agregar imágenes de productos
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInput.current?.click()}
            disabled={isUploading || images.length >= MAX_IMAGES}
          >
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Subir otra imagen
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button type="button" className="ml-auto" onClick={handleSave} disabled={!isDirty || isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Formatos PNG o JPG, hasta {MAX_IMAGES} imágenes. Guardá antes de descargar el PDF.
        </p>
      </CardContent>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Imágenes de los productos cotizados</DialogTitle>
            <DialogDescription>Elegí las fotos que querés mostrar en el PDF.</DialogDescription>
          </DialogHeader>
          {photosLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando fotos…
            </div>
          ) : photos.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Los productos de esta cotización no tienen fotos cargadas. Podés subir una imagen.
            </p>
          ) : (
            <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
              {photos.map((photo) => {
                const already = images.some((image) => image.url === photo.url);
                const isSelected = selected.includes(photo.url);
                return (
                  <button
                    key={photo.url}
                    type="button"
                    disabled={already}
                    onClick={() =>
                      setSelected((prev) => (isSelected ? prev.filter((url) => url !== photo.url) : [...prev, photo.url]))
                    }
                    className={`relative space-y-1 rounded-xl border-2 p-2 text-left transition-all ${
                      isSelected ? "border-brand-blue ring-2 ring-brand-blue/20" : "border-border hover:border-brand-blue/40"
                    } ${already ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <div className="flex h-32 items-center justify-center rounded-lg bg-[radial-gradient(circle_at_50%_40%,#fff_0,#F1F5FA_70%)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt={photo.caption} className="max-h-[92%] max-w-[92%] object-contain" />
                    </div>
                    <div className="line-clamp-2 text-xs font-semibold text-brand-navy">{photo.caption}</div>
                    {(isSelected || already) && (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue text-white">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPickerOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={addSelected} disabled={selected.length === 0}>
              Agregar {selected.length > 0 ? `(${selected.length})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
