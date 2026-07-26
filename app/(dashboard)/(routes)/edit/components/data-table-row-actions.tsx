"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import Phone from "@/components/Phone/Phone";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Song, songSchema } from "../data/schema";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import type { PendingSuggestion } from "../lib/pending-suggestions";
import { invoke, convertFileSrc } from "@tauri-apps/api/tauri";
import { DEFAULT_COVER, SONG_STATUS, TAURI_COMMANDS } from "@/constants";
import {
  coverDataUrl,
  isCoverFilePath,
} from "@/components/context/PlayerContext/music-utils";
import {
  fetchFullCover,
  invalidateFullCover,
} from "@/components/context/PlayerContext/use-full-cover";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  table: any;
}

function suggestionField(
  pending: PendingSuggestion | undefined,
  name: string
): string {
  if (!pending) return "";
  const value = pending[name as keyof PendingSuggestion];
  if (value === undefined || value === null) return "";
  return String(value);
}

/** Resize/compress cover art so Tauri IPC can carry it reliably. */
async function blobToCompressedJpegBase64(
  blob: Blob,
  maxEdge = 1000,
  quality = 0.85
): Promise<string> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const b64 = dataUrl.split(",")[1];
  if (!b64) throw new Error("Failed to encode image");
  return b64;
}

function coverPreviewSrc(src: string) {
  if (!src || src === "has_cover") return DEFAULT_COVER;
  if (src.startsWith("data:")) return src;
  if (isCoverFilePath(src)) {
    try {
      return convertFileSrc(src);
    } catch {
      return DEFAULT_COVER;
    }
  }
  if (src.startsWith("iVBOR")) return `data:image/png;base64,${src}`;
  if (src.startsWith("R0lGOD")) return `data:image/gif;base64,${src}`;
  // Heuristic: long base64 without path separators
  if (src.length > 64 && !src.includes("/") && !src.includes("\\")) {
    return coverDataUrl(src);
  }
  return DEFAULT_COVER;
}

export function DataTableRowActions<TData>({
  row,
  table,
}: DataTableRowActionsProps<TData>) {
  const songDetails = songSchema.parse(row.original);
  const pendingByPath =
    (table.options.meta?.pendingByPath as
      | Record<string, PendingSuggestion>
      | undefined) ?? {};
  const dismissPending = table.options.meta?.dismissPending as
    | ((path: string) => Promise<void>)
    | undefined;

  const pending = pendingByPath[songDetails.path];
  const hasPending = !!pending;

  const [formData, setFormData] = useState<Song>(songDetails);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isDialogSystem, setIsDialogSystem] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  /** Display cover: thumb first, then original (or user-picked). */
  const [displayCover, setDisplayCover] = useState<string>(
    songDetails.imageSrc
  );
  /** User-picked replacement only — never auto-filled from get_track_cover. */
  const [imageData, setImageData] = useState<string>("");
  const [coverDirty, setCoverDirty] = useState(false);
  /** Optional temp path from Rust URL download (preferred over base64). */
  const [pendingCoverPath, setPendingCoverPath] = useState<string | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setFormData(songDetails);
    setDisplayCover(songDetails.imageSrc);
    setImageData("");
    setCoverDirty(false);
    setPendingCoverPath(null);
  }, [
    songDetails.path,
    songDetails.title,
    songDetails.artist,
    songDetails.album,
    songDetails.imageSrc,
  ]);

  // Lazy-load original APIC when the edit sheet opens
  useEffect(() => {
    if (!sheetOpen || !songDetails.path) return;
    let cancelled = false;
    void fetchFullCover(songDetails.path).then((url) => {
      if (cancelled || coverDirty) return;
      if (url && url !== DEFAULT_COVER) {
        setDisplayCover(url);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [sheetOpen, songDetails.path, coverDirty]);

  const handleChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;

    if (name == "year" || name == "track" || name == "discno") {
      setFormData({
        ...formData,
        [name]: parseInt(value),
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageChange = async (event: {
    target: { value: string };
  }) => {
    const url = event.target.value.trim();
    if (!url) return;
    try {
      // Rust download avoids webview CORS failures
      const [tempPath, b64] = await invoke<[string, string]>(
        TAURI_COMMANDS.fetchAlbumArtUrl,
        { url }
      );
      setPendingCoverPath(tempPath);
      setImageData(b64);
      setDisplayCover(b64);
      setCoverDirty(true);
    } catch (error) {
      console.error("Error fetching image:", error);
      toast({
        title: "Could not load image URL",
        description: String(error),
      });
    }
  };

  const handleFileChange = async (event: {
    target: { files: FileList | null };
  }) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        const b64 = await blobToCompressedJpegBase64(files[0]);
        setPendingCoverPath(null);
        setImageData(b64);
        setDisplayCover(b64);
        setCoverDirty(true);
      } catch (error) {
        console.error("Error reading image:", error);
        toast({
          title: "Could not read image file",
          description: String(error),
        });
      }
    }
  };

  const updateImage = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (imageData) {
      setFormData((prev) => ({
        ...prev,
        imageSrc: imageData,
      }));
      setDisplayCover(imageData);
      setCoverDirty(true);
    }
    setOpenImageDialog(false);
  };

  const updateSong = async (e: any) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const coverPathAtSave = pendingCoverPath;
    try {
      // Never re-embed lazy-fetched original unless the user changed art
      const toSave: Song = {
        ...formData,
        imageSrc: coverDirty
          ? imageData || formData.imageSrc
          : "",
        status: SONG_STATUS.saved,
        sessionName: SONG_STATUS.saved,
      };

      const val = await table.options.meta.handleSongUpdate(
        toSave.path,
        toSave,
        coverPathAtSave
      );
      if (val[0] == false) {
        toast({
          title: "Save Failed",
          description: "Reason: " + val[1],
        });
        return;
      }

      invalidateFullCover(toSave.path);
      setFormData({
        ...formData,
        status: SONG_STATUS.saved,
        sessionName: SONG_STATUS.saved,
      });
      setPendingCoverPath(null);
      setCoverDirty(false);
      toast({
        title: "Save Successful",
        description: `Successfully Updated Song #${toSave.id} - ${toSave.file}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const acceptAllSuggestions = async () => {
    if (!pending) return;
    const merged: Song = {
      ...formData,
      title: pending.title || formData.title,
      artist: pending.artist || formData.artist,
      album: pending.album || formData.album,
      year: pending.year || formData.year,
      track: pending.track || formData.track,
      genre: pending.genre || formData.genre,
      comments: pending.comments || formData.comments,
      albumArtist: pending.albumArtist || formData.albumArtist,
      composer: pending.composer || formData.composer,
      discno: pending.discno || formData.discno,
      // Keep existing embedded art — don't send thumb path as base64
      imageSrc: "",
      status: SONG_STATUS.saved,
      sessionName: SONG_STATUS.saved,
    };
    setFormData({ ...merged, imageSrc: formData.imageSrc });
    const val = await table.options.meta.handleSongUpdate(merged.path, merged);
    if (val[0] == false) {
      toast({
        title: "Accept Failed",
        description: "Reason: " + val[1],
      });
      return;
    }
    toast({
      title: "Suggestions applied",
      description: `Saved scraped tags for ${merged.file}`,
    });
  };

  const dismissSuggestions = async () => {
    if (!pending || !dismissPending) return;
    await dismissPending(pending.path);
    toast({
      title: "Suggestions dismissed",
      description: `Cleared review for ${pending.file}`,
    });
  };

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          className={
            hasPending
              ? "w-full overflow-y-auto p-4 sm:max-w-[min(780px,100vw)]"
              : "w-full overflow-y-auto p-4 sm:max-w-[min(400px,100vw)]"
          }
        >
          <Tabs defaultValue="edit">
            <TabsList>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="view">View</TabsTrigger>
              <TabsTrigger value="others">Options</TabsTrigger>
            </TabsList>
            <TabsContent value="edit" className="rounded-md border p-4">
              <SheetHeader>
                <SheetTitle>Edit Song Metadata</SheetTitle>
                <SheetDescription>
                  {hasPending
                    ? "Review scraped suggestions beside each field. Click a suggestion to apply it, or accept/dismiss all."
                    : "Make changes to song metadata manually."}
                  {hasPending ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={acceptAllSuggestions}
                      >
                        Accept all
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={dismissSuggestions}
                      >
                        Dismiss
                      </Button>
                    </div>
                  ) : null}
                  <form onSubmit={updateSong}>
                    <div className="grid gap-4 py-4">
                      {[
                        { label: "Title", name: "title", type: "string" },
                        { label: "Artist", name: "artist", type: "string" },
                        { label: "Album", name: "album", type: "string" },
                        {
                          label: "Album Artist",
                          name: "albumArtist",
                          type: "string",
                        },
                        { label: "Composer", name: "composer", type: "string" },
                        { label: "Year", name: "year", type: "number" },
                        { label: "Track", name: "track", type: "number" },
                        { label: "Disc No.", name: "discno", type: "number" },
                        { label: "Genre", name: "genre", type: "string" },
                        { label: "Comments", name: "comments", type: "string" },
                      ].map(({ label, name, type }) => (
                        <MetadataRow
                          key={`${name}-${hasPending ? "p" : "n"}`}
                          label={label}
                          name={name}
                          value={formData[name as keyof Song]}
                          hasSuggestion={hasPending}
                          suggestionValue={suggestionField(pending, name)}
                          type={type}
                          onChange={handleChange}
                        />
                      ))}
                      <div className="place-items-center gap-4">
                        <Image
                          src={
                            displayCover
                              ? coverPreviewSrc(displayCover)
                              : DEFAULT_COVER
                          }
                          width={300}
                          height={300}
                          alt="Album art"
                          className="border border-black image-blur"
                          onClick={() => setOpenImageDialog(!openImageDialog)}
                        />
                      </div>
                      <Dialog
                        open={openImageDialog}
                        onOpenChange={setOpenImageDialog}
                      >
                        <DialogContent className="sm:max-w-[675px]">
                          <DialogHeader>
                            <DialogTitle>Choose Album Art</DialogTitle>
                            <DialogDescription>
                              Either add an image url from the web, or choose an
                              image file from your system.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="grid gap-2">
                              <div className="grid gap-2">
                                <Label htmlFor="url">Image URL</Label>
                                <Input
                                  onChange={handleImageChange}
                                  disabled={isDialogSystem}
                                  id="url"
                                />
                              </div>
                              <center>(or)</center>
                              <div className="grid gap-2">
                                <Label htmlFor="system">
                                  Choose From System
                                </Label>
                                <Input
                                  onChange={handleFileChange}
                                  accept="image/*"
                                  disabled={!isDialogSystem}
                                  className="cursor-pointer"
                                  id="system"
                                  type="file"
                                />
                              </div>
                            </div>
                            <div className="flex justify-center items-center">
                              <Image
                                src={
                                  imageData || displayCover
                                    ? coverPreviewSrc(imageData || displayCover)
                                    : DEFAULT_COVER
                                }
                                width={250}
                                height={250}
                                alt="Album Art Preview"
                                className="border border-black"
                              />
                            </div>
                          </div>
                          <DialogFooter className="sm:justify-between">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="mode-switch"
                                checked={isDialogSystem}
                                onCheckedChange={setIsDialogSystem}
                              />
                              <Label htmlFor="mode-switch">
                                {isDialogSystem ? "Image" : "URI"}
                              </Label>
                            </div>
                            <Button type="button" onClick={updateImage}>
                              Save
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <SheetClose asChild>
                        <Button type="submit" disabled={saving}>
                          {saving ? "Saving…" : "Save changes"}
                        </Button>
                      </SheetClose>
                    </div>
                  </form>
                </SheetDescription>
              </SheetHeader>
            </TabsContent>

            <TabsContent value="view" className="rounded-md border p-4">
              <SheetHeader>
                <SheetTitle>View Song</SheetTitle>
                <SheetDescription>
                  A Mobile View of your metadata.
                </SheetDescription>
              </SheetHeader>
              <Phone currentSong={songDetails} />
            </TabsContent>

            <TabsContent value="Others">
              <></>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  );
}

interface MetadataRowProps {
  label: string;
  name: string;
  value: string | number;
  hasSuggestion: boolean;
  suggestionValue: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type: string;
}

const MetadataRow = ({
  label,
  name,
  value,
  hasSuggestion,
  suggestionValue,
  onChange,
  type,
}: MetadataRowProps) => {
  const [isVisible, setIsVisible] = useState(hasSuggestion);

  useEffect(() => {
    setIsVisible(hasSuggestion);
  }, [hasSuggestion]);

  const handleSuggestionClick = () => {
    const event = {
      target: {
        name: name,
        value: suggestionValue,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(event);
    setIsVisible(false);
  };

  return (
    <div
      className={
        isVisible
          ? "grid grid-cols-8 items-center gap-4"
          : "grid grid-cols-4 items-center gap-4"
      }
    >
      <Label htmlFor={name} className="text-right col-span-1">
        {label}
      </Label>
      <Input
        type={type == "string" ? "text" : "number"}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="col-span-3"
      />
      {isVisible ? (
        <span className="col-span-4 flex space-x-1">
          <Button
            type="button"
            variant="outline"
            className="flex-grow"
            disabled={!suggestionValue && suggestionValue !== 0}
            onClick={handleSuggestionClick}
          >
            {suggestionValue || suggestionValue === 0
              ? suggestionValue
              : "Could Not Retrieve Data :("}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-shrink-0 text-red-500"
            onClick={() => setIsVisible(false)}
          >
            X
          </Button>
        </span>
      ) : null}
    </div>
  );
};
