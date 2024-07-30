"use client"

import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { Row } from "@tanstack/react-table"
import Image from 'next/image'

import { Button } from "@/components/ui/button"
import Phone from "@/components/Phone/Phone"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import { Song, songSchema } from "../data/schema"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  table: any
}

export function DataTableRowActions<TData>({
  row,
  table
}: DataTableRowActionsProps<TData>) {
  const songDetails = songSchema.parse(row.original)
  const [formData, setFormData] = useState<Song>(songDetails);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isDialogSystem, setIsDialogSystem] = useState(false)
  const [openImageDialog, setOpenImageDialog] = useState(false)
  const base64string = 'data:image/png;base64,' + formData.imageSrc
  const { toast } = useToast()

  const handleChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const updateSong = async (e: any) => {
    //Update Song Request
    e.preventDefault()
    console.log("Update Song Request: " + formData)
    const val = await table.options.meta.handleSongUpdate(formData.file, formData)
    console.log(formData)

    console.log(val)
    if (val[0] == false) {
      toast({
        title: "Save Failed",
        description: "Reason: " + val[1],
      })
      return
    }

    toast({
      title: "Save Successful",
      description: `Successfully Updated Song ${formData.id} - ${formData.file}`,
    })
    return
  }

  const updateImage = () => {

  }

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
        <SheetContent className="overflow-auto p-4">
          <Tabs defaultValue="edit">
            <TabsList>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="view">View</TabsTrigger>
              <TabsTrigger value="others">Options</TabsTrigger>
            </TabsList>
            <TabsContent value="edit" className="rounded-md border p-4">
              <SheetHeader>
                <SheetTitle>
                  Edit Song Metadata
                </SheetTitle>
                <SheetDescription>
                  Make changes to song metadata manually.
                  <form onSubmit={updateSong}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                          Title
                        </Label>
                        <Input id="name" value={formData.title} onChange={handleChange} name="title" className="col-span-3" /> {/*onChange={(e) => handleChange(e)} />*/}
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="artist" className="text-right">
                          Artist
                        </Label>
                        <Input id="username" name="artist" value={formData.artist} onChange={handleChange} className="col-span-3" /> {/*onChange={(e) => handleChange(e)} />*/}
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="album" className="text-right">
                          Album
                        </Label>
                        <Input id="username" name="album" value={formData.album} onChange={handleChange} className="col-span-3" /> {/*onChange={(e) => handleChange(e)} />*/}
                      </div>
                      <Collapsible>
                        <CollapsibleTrigger onClick={() => setIsOpen(!isOpen)}>Other Craetor fields {isOpen ? "▼" : "⛛"}</CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="album" className="text-right">
                                Album Artist
                              </Label>
                              <Input id="username" name="album" value={formData.albumArtist} onChange={handleChange} className="col-span-3" /> {/*onChange={(e) => handleChange(e)} />*/}
                            </div>
                          </div>
                        </CollapsibleContent>
                        <CollapsibleContent>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="album" className="text-right">
                              Composer
                            </Label>
                            <Input id="username" name="album" value={formData.composer} onChange={handleChange} className="col-span-3" /> {/*onChange={(e) => handleChange(e)} />*/}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="year" className="text-right">
                          Year
                        </Label>
                        <Input id="username" name="year" value={formData.year} onChange={handleChange} className="col-span-3" /> {/*onChange={(e) => handleChange(e)} />*/}
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="album" className="text-right">
                          Track
                        </Label>
                        <Input id="username" name="track" value={formData.track} onChange={handleChange} className="col-span-3" /> {/*onChange={(e) => handleChange(e)} />*/}
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="genre" className="text-right">
                          Disc No.
                        </Label>
                        <Input id="username" name="discno" value={formData.discno} onChange={handleChange} className="col-span-3" /> {/*onChange={(e) => handleChange(e)} />*/}
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="genre" className="text-right">
                          Genre
                        </Label>
                        <Input id="username" name="genre" value={formData.genre} onChange={handleChange} className="col-span-3" /> {/*onChange={(e) => handleChange(e)} />*/}
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="genre" className="text-right">
                          Comments
                        </Label>
                        <Textarea id="username" name="comments" value={formData.comments} onChange={handleChange} className="col-span-3" /> {/*onChange={(e) => handleChange(e)} />*/}
                      </div>
                      <Image
                        // src={formData.imageSrc ? base64string : "/public/def-album-art.png"}
                        src={`/def-album-art.png`}
                        width={300}
                        height={300}
                        alt="Picture of the author"
                        className="border border-black image-blur"
                        onClick={() => setOpenImageDialog(!openImageDialog)}
                      />
                      <Dialog open={openImageDialog} onOpenChange={setOpenImageDialog}>
                        <DialogContent className="sm:max-w-[475px]">
                          <DialogHeader>
                            <DialogTitle>Choose Album Art</DialogTitle>
                            <DialogDescription>
                              Either add an image url from the web, or choose an image file from your system.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">

                            <div className="grid gap-2">
                              <Label htmlFor="url">Image URL</Label>
                              <Input disabled={isDialogSystem} id="url" />
                            </div>
                            <center>(or)</center>
                            <div className="grid gap-2">
                              <Label htmlFor="system">Choose From System</Label>
                              <Input disabled={!isDialogSystem} className="cursor-pointer" id="system" type="file" />
                            </div>
                          </div>
                          <DialogFooter className="sm:justify-between">
                            {/* <Button type="button" variant="secondary">Close</Button> */}
                            <div className="flex items-center space-x-2">
                              <Switch id="mode-switch" checked={isDialogSystem} onCheckedChange={setIsDialogSystem} />
                              <Label htmlFor="mode-switch">{isDialogSystem ? "Image" : "URI"}</Label>
                            </div>
                            <Button type="submit">Save</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <SheetClose asChild>
                        <Button type="submit" >Save changes</Button>
                      </SheetClose>
                    </div>
                  </form>
                </SheetDescription>

              </SheetHeader>
            </TabsContent>

            <TabsContent value="view" className="rounded-md border p-4">
              <SheetHeader>
                <SheetTitle>
                  View Song
                </SheetTitle>
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
  )
}
