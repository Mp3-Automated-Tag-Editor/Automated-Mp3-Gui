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
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { Song, songSchema } from "../data/schema";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DialogClose } from "@radix-ui/react-dialog";
import { useSessionContext } from "@/components/context/SessionContext/SessionContext";
interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  table: any;
}

export function DataTableRowActions<TData>({
  row,
  table,
}: DataTableRowActionsProps<TData>) {
  const songDetails = songSchema.parse(row.original);
  const sessionData = useSessionContext();
  const [formData, setFormData] = useState<Song>(songDetails);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isDialogSystem, setIsDialogSystem] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [imageData, setImageData] = useState<string>(formData.imageSrc);
  const base64string = "data:image/png;base64," + imageData;
  const { toast } = useToast();

  const sessionSongData: Song = sessionData.sessionData.find(
    (s: { path: string }) => s.path === String(formData.path)
  );

  const handleChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;

    console.log("Test: " + name + " " + value);

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

  console.log(formData);

  const handleImageChange = async (event: { target: { value: any } }) => {
    const url = event.target.value;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImageData(reader.result.split(",")[1]);
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Error fetching image:", error);
    }
  };

  const handleFileChange = (event: { target: { files: any } }) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImageData(reader.result.split(",")[1]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const updateSong = async (e: any) => {
    //Update Song Request
    e.preventDefault();
    console.log("Update Song Request: " + formData);
    const val = await table.options.meta.handleSongUpdate(
      formData.file,
      formData
    );
    console.log(formData);

    console.log(val);
    if (val[0] == false) {
      toast({
        title: "Save Failed",
        description: "Reason: " + val[1],
      });
      return;
    }

    toast({
      title: "Save Successful",
      description: `Successfully Updated Song #${formData.id} - ${formData.file}`,
    });
    return;
  };

  const updateImage = () => {
    setFormData({
      ...formData,
      imageSrc: imageData,
    });
  };

  return (
    <>
      <Sheet>
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
            sessionData.sessionName != ""
              ? "overflow-y-auto p-4 min-w-[780px]"
              : "overflow-y-auto p-4 min-w-[400px]"
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
                  {sessionData.sessionName != ""
                    ? "Make changes to song metadata with scraper data. Click on the buttons nearby to place the suggested data in the text fields, feel free to further edit it."
                    : "Make changes to song metadata manually."}
                  <form onSubmit={updateSong}>
                    <div className="grid gap-4 py-4">
                      {[
                        { label: "Title", name: "title", type: "string" },
                        { label: "Artist", name: "artist", type: "string" },
                        { label: "Album", name: "album", type: "string" },
                        { label: "Album Artist", name: "albumArtist", type: "string" },
                        { label: "Composer", name: "composer", type: "string" },
                        { label: "Year", name: "year", type: "number" },
                        { label: "Track", name: "track", type: "number" },
                        { label: "Disc No.", name: "discno", type: "number" },
                        { label: "Genre", name: "genre", type: "string" },
                        { label: "Comments", name: "comments", type: "string" },
                      ].map(({ label, name, type }) => (
                        <MetadataRow
                          key={name}
                          label={label}
                          name={name}
                          value={formData[name as keyof Song]}
                          sessionExists={sessionData.sessionName != ""}
                          sessionValue={
                            sessionSongData
                              ? String(sessionSongData[name as keyof Song])
                              : ""
                          }
                          type={type}
                          onChange={handleChange}
                        />
                      ))}                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="session" className="text-right">
                          Session
                        </Label>
                        <Input
                          id="username"
                          name="session"
                          disabled
                          value={formData.sessionName}
                          onChange={handleChange}
                          className="col-span-3"
                        />{" "}
                      </div>
                      <div className={sessionData.sessionName != "" ? "grid grid-cols-2 place-items-center gap-4" : "place-items-center gap-4"}>
                        <Image
                          // src={formData.imageSrc ? base64string : "/public/def-album-art.png"}
                          src={
                            formData.imageSrc
                              ? `data:image/png;base64,${formData.imageSrc}`
                              : `/def-album-art.png`
                          }
                          width={300}
                          height={300}
                          alt="Picture of the author"
                          className="border border-black image-blur"
                          onClick={() => setOpenImageDialog(!openImageDialog)}
                        />
                        {
                          sessionData.sessionName != "" ? <Image
                          // src={formData.imageSrc ? base64string : "/public/def-album-art.png"}
                          src={
                            sessionSongData && sessionSongData.imageSrc
                              ? `data:image/png;base64,${sessionSongData.imageSrc}`
                              : `/def-album-art.png`
                          }
                          width={300}
                          height={300}
                          alt="Picture of the author"
                          className="border border-black image-blur"
                          onClick={() => setOpenImageDialog(!openImageDialog)}
                        /> : null
                        }                      
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
                                  imageData
                                    ? base64string
                                    : `/def-album-art.png`
                                }
                                width={250}
                                height={250}
                                alt="Album Art Preview"
                                className="border border-black"
                              />
                            </div>
                          </div>
                          <DialogFooter className="sm:justify-between">
                            {/* <Button type="button" variant="secondary">Close</Button> */}
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
                            <DialogClose>
                              <Button type="submit" onClick={updateImage}>
                                Save
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <SheetClose asChild>
                        <Button type="submit">Save changes</Button>
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
              <>
                {/* <DropdownMenuItem>Make a copy</DropdownMenuItem>
                <DropdownMenuItem>Favorite</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span className="text-red-500">Delete
                  </span>
                  <DropdownMenuShortcut><span className="text-red-500">⌘⌫
                  </span></DropdownMenuShortcut>
                </DropdownMenuItem> */}
              </>
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
  sessionExists: boolean;
  sessionValue: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type: string;
}

const MetadataRow = ({
  label,
  name,
  value,
  sessionExists,
  sessionValue,
  onChange,
  type,
}: MetadataRowProps) => {
  const [isVisible, setIsVisible] = useState(sessionExists);

  const handleSessionValueClick = () => {
    // Simulate an input change event with the session value
    const event = {
      target: {
        name: name,
        value: sessionValue
      },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(event);
    setIsVisible(false);
  };

  return (
    <div className={isVisible ? "grid grid-cols-8 items-center gap-4" : "grid grid-cols-4 items-center gap-4"}>
      <Label htmlFor={name} className="text-right col-span-1">
        {label}
      </Label>
      <Input
        type={type == "string" ? "text" : "number"} 
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="col-span-3" // Expands on hide
      />
      {isVisible ? (
        <span className="col-span-4 flex space-x-1">
          <Button
            variant="outline"
            className="flex-grow"
            disabled={!sessionValue}
            onClick={handleSessionValueClick}
          >
            {sessionValue ? sessionValue : "Could Not Retrieve Data :("}
          </Button>
          <Button
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
