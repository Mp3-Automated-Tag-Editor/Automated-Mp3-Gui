"use client"

import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { Row } from "@tanstack/react-table"
import Image from 'next/image'

import { Button } from "@/components/ui/button"
import Phone from "@/components/Phone/Phone"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

import { songSchema } from "../data/schema"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}



export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const songDetails = songSchema.parse(row.original)
  const [openSideBar, setOpenSideBar] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const base64string = 'data:image/png;base64,'+songDetails.imageSrc
  // var image = new Image();
  // image.src = 'data:image/png;base64,'+songDetails.imageSrc;
  // const content = 

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

                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="title" className="text-right">
                        Title
                      </Label>
                      <Input id="name" value={songDetails.title} name="title" className="col-span-3" /> {/*onChange={(e) => handleChange(e)} />*/}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="artist" className="text-right">
                        Artist
                      </Label>
                      <Input id="username" name="artist" value={songDetails.artist} className="col-span-3" /> {/*onChange={(e) => handleChange(e)} />*/}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="album" className="text-right">
                        Album
                      </Label>
                      <Input id="username" name="album" value={songDetails.album} className="col-span-3" /> {/*onChange={(e) => handleChange(e)} />*/}
                    </div>
                    <Collapsible>
                      <CollapsibleTrigger onClick={() => setIsOpen(!isOpen)}>Other Craetor fields {isOpen ? "▼" : "⛛"}</CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="album" className="text-right">
                              Album Artist
                            </Label>
                            <Input id="username" name="album" value={songDetails.albumArtist} className="col-span-3" /> {/*onChange={(e) => handleChange(e)} />*/}
                          </div>
                        </div>
                      </CollapsibleContent>
                      <CollapsibleContent>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="album" className="text-right">
                            Composer
                          </Label>
                          <Input id="username" name="album" value={songDetails.composer} className="col-span-3" /> {/*onChange={(e) => handleChange(e)} />*/}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="year" className="text-right">
                        Year
                      </Label>
                      <Input id="username" name="year" value={songDetails.year} className="col-span-3" /> {/*onChange={(e) => handleChange(e)} />*/}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="album" className="text-right">
                        Track
                      </Label>
                      <Input id="username" name="track" value={songDetails.track} className="col-span-3" /> {/*onChange={(e) => handleChange(e)} />*/}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="genre" className="text-right">
                        Disc No.
                      </Label>
                      <Input id="username" name="discno" value={songDetails.discno} className="col-span-3" /> {/*onChange={(e) => handleChange(e)} />*/}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="genre" className="text-right">
                        Genre
                      </Label>
                      <Input id="username" name="genre" value={songDetails.genre} className="col-span-3" /> {/*onChange={(e) => handleChange(e)} />*/}
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="genre" className="text-right">
                        Comments
                      </Label>
                      <Textarea id="username" name="comments" value={songDetails.comments} className="col-span-3" /> {/*onChange={(e) => handleChange(e)} />*/}
                    </div>
                    <Image
                      src={base64string}
                      width={300}
                      height={300}
                      alt="Picture of the author"
                      className="border border-black"
                    />
                    <Button type="submit">Save changes</Button>

                  </div>

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
