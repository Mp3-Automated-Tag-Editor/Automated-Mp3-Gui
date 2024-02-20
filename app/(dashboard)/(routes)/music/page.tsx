"use client";

import { Metadata } from "next"
import Image from "next/image"
import { PlusCircledIcon } from "@radix-ui/react-icons"

import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import { AlbumArtwork } from "./components/album-artwork"
import { Menu } from "./components/menu"
import { PodcastEmptyPlaceholder } from "./components/podcast-empty-placeholder"
import { Sidebar } from "./components/sidebar"
import { listenNowAlbums, madeForYouAlbums } from "./data/albums"
import { playlists } from "./data/playlists"
import { Music } from "lucide-react";
import { useState } from "react";
// import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
// import { ChatCompletionRequestMessage } from "openai";

// import { BotAvatar } from "@/components/bot-avatar";
import { Heading } from "@/components/heading";
// import { Input } from "@/components/ui/input";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { cn } from "@/lib/utils";
// import { Loader } from "@/components/loader";
// import { UserAvatar } from "@/components/user-avatar";
import { Empty } from "@/components/ui/empty";
// import { useProModal } from "@/hooks/use-pro-modal";


const MusicPlayer = () => {
  const router = useRouter();
  // const proModal = useProModal();
  // const [messages, setMessages] = useState<ChatCompletionRequestMessage[]>([]);

  // const form = useForm<z.infer<typeof formSchema>>({
  //   resolver: zodResolver(formSchema),
  //   defaultValues: {
  //     prompt: ""
  //   }
  // });

  // const isLoading = form.formState.isSubmitting;

  // const onSubmit = async (values: z.infer<typeof formSchema>) => {
  //   try {
  //     const userMessage: ChatCompletionRequestMessage = { role: "user", content: values.prompt };
  //     const newMessages = [...messages, userMessage];

  //     const response = await axios.post('/api/conversation', { messages: newMessages });
  //     setMessages((current) => [...current, userMessage, response.data]);

  //     form.reset();
  //   } catch (error: any) {
  //     if (error?.response?.status === 403) {
  //       proModal.onOpen();
  //     } else {
  //       toast.error("Something went wrong.");
  //     }
  //   } finally {
  //     router.refresh();
  //   }
  // }

  return (
    <div>

      <div className="px-4 lg:px-8">
        <div>
          <>
            <Heading
              title="Music Playstation"
              description="Our very own Music Player."
              icon={Music}
              iconColor="text-green-700"
              otherProps="mb-4"
            // bgColor="bg-violet-500/10"
            />
            <div className="md:hidden">
              <Image
                src="/examples/music-light.png"
                width={1280}
                height={1114}
                alt="Music"
                className="block dark:hidden"
              />
              <Image
                src="/examples/music-dark.png"
                width={1280}
                height={1114}
                alt="Music"
                className="hidden dark:block"
              />
            </div>
            <div className="hidden md:block">
              {/* <Menu /> */}

              <div className="border-t">
                <div className="bg-background">
                  <div className="grid lg:grid-cols-5">
                    <div className="col-span-3 lg:col-span-4 lg:border-r">
                      <div className="h-full px-4 py-6 lg:px-8">
                        <Tabs defaultValue="music" className="h-full space-y-6">
                          <div className="space-between flex items-center">
                            <TabsList>
                              <TabsTrigger value="music" className="relative">
                                Home
                              </TabsTrigger>
                              <TabsTrigger value="list">List</TabsTrigger>
                              <TabsTrigger value="player">Music Player</TabsTrigger>
                              <TabsTrigger value="live" disabled>
                                Live
                              </TabsTrigger>
                            </TabsList>
                            <div className="ml-auto mr-4">
                              <Button>
                                <PlusCircledIcon className="mr-2 h-4 w-4" />
                                Add music
                              </Button>
                            </div>
                          </div>
                          <TabsContent
                            value="music"
                            className="border-none p-0 outline-none"
                          >
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h2 className="text-2xl font-semibold tracking-tight">
                                  Listen Now
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                  Top picks for you. Updated daily.
                                </p>
                              </div>
                            </div>
                            <Separator className="my-4" />
                            <div className="relative">
                              <ScrollArea>
                                <div className="flex space-x-4 pb-4">
                                  {listenNowAlbums.map((album) => (
                                    <AlbumArtwork
                                      key={album.name}
                                      album={album}
                                      className="w-[250px]"
                                      aspectRatio="portrait"
                                      width={250}
                                      height={330}
                                    />
                                  ))}
                                </div>
                                <ScrollBar orientation="horizontal" />
                              </ScrollArea>
                            </div>
                            <div className="mt-6 space-y-1">
                              <h2 className="text-2xl font-semibold tracking-tight">
                                Made for You
                              </h2>
                              <p className="text-sm text-muted-foreground">
                                Your personal playlists. Updated daily.
                              </p>
                            </div>
                            <Separator className="my-4" />
                            <div className="relative">
                              <ScrollArea>
                                <div className="flex space-x-4 pb-4">
                                  {madeForYouAlbums.map((album) => (
                                    <AlbumArtwork
                                      key={album.name}
                                      album={album}
                                      className="w-[150px]"
                                      aspectRatio="square"
                                      width={150}
                                      height={150}
                                    />
                                  ))}
                                </div>
                                <ScrollBar orientation="horizontal" />
                              </ScrollArea>
                            </div>
                          </TabsContent>
                          <TabsContent
                            value="list"
                            className="h-full flex-col border-none p-0 data-[state=active]:flex"
                          >
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h2 className="text-2xl font-semibold tracking-tight">
                                  New Episodes
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                  Your favorite podcasts. Updated daily.
                                </p>
                              </div>
                            </div>
                            <Separator className="my-4" />
                            <PodcastEmptyPlaceholder />
                          </TabsContent>
                          <TabsContent
                            value="player"
                            className="h-full flex-col border-none p-0 data-[state=active]:flex"
                          >
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h2 className="text-2xl font-semibold tracking-tight">
                                  New Episodes
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                  Your favorite podcasts. Updated daily.
                                </p>
                              </div>
                            </div>
                            <Separator className="my-4" />
                            <PodcastEmptyPlaceholder />
                          </TabsContent>
                          <TabsContent
                            value="live"
                            className="h-full flex-col border-none p-0 data-[state=active]:flex"
                          >
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h2 className="text-2xl font-semibold tracking-tight">
                                  New Episodes
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                  Your favorite podcasts. Updated daily.
                                </p>
                              </div>
                            </div>
                            <Separator className="my-4" />
                            <PodcastEmptyPlaceholder />
                          </TabsContent>
                        </Tabs>
                      </div>
                    </div>
                    <Sidebar playlists={playlists} className="hidden lg:block" />

                  </div>
                </div>
              </div>
            </div>
          </>
        </div>
      </div>

    </div>
  );
}

export default MusicPlayer;