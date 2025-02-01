"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { useContext } from "react";
import { ConfigContext } from "@/components/context/ConfigContext";
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator";

const classifierOptions = [
  { name: "spotify", label: "Spotify", description: "Toggle Spotify Classifier", icon: "../SettingsLogo/spotify.png", disabled: false },
  { name: "palm", label: "Google Palm", description: "Toggle Google Palm API Classifier", icon: "../SettingsLogo/gemini.png", disabled: false },
  { name: "ytmusic", label: "YouTube Music", description: "Toggle YTMusic Classifier", icon: "../SettingsLogo/youtube.png", disabled: false },
  { name: "itunes", label: "iTunes", description: "Toggle iTunes Classifier", icon: "../SettingsLogo/itunes.png", disabled: false },
  { name: "genius", label: "Genius", description: "Toggle Genius Classifier", icon: "../SettingsLogo/genius.png", disabled: false },
  { name: "groq", label: "Groq API", description: "Toggle Groq API Classifier", icon: "../SettingsLogo/groq.png", disabled: false },
  { name: "deepseekR1", label: "Deepseek R1", description: "Toggle Deepseek R1 Classifier", icon: "../SettingsLogo/deepseek.png", disabled: true },
  { name: "amazonMusic", label: "Amazon Music", description: "Toggle Amazon Music Classifier", icon: "../SettingsLogo/amazon-music.png", disabled: true },
  { name: "appleMusic", label: "Apple Music", description: "Toggle Apple Music Classifier", icon: "../SettingsLogo/apple-music2.png", disabled: true },
  { name: "theAudioDb", label: "TheAudioDb", description: "Toggle TheAudioDb Classifier", icon: "../SettingsLogo/audiodb.png", disabled: true },
  { name: "deezer", label: "Deezer", description: "Toggle Deezer Classifier", icon: "../SettingsLogo/deezer.png", disabled: true },
  { name: "musicBrainz", label: "MusicBrainz", description: "Toggle MusicBrainz Classifier", icon: "../SettingsLogo/musicbrainz.png", disabled: true },
  { name: "echonest", label: "EchoNest", description: "Toggle EchoNest Classifier", icon: "../SettingsLogo/echonest.png", disabled: true },
  { name: "pandora", label: "Pandora", description: "Toggle Pandora Classifier", icon: "../SettingsLogo/pandora.png", disabled: true },
  { name: "soundCloud", label: "SoundCloud", description: "Toggle SoundCloud Classifier", icon: "../SettingsLogo/soundcloud.png", disabled: true },
  { name: "tidal", label: "Tidal", description: "Toggle Tidal Classifier", icon: "../SettingsLogo/tidal.png", disabled: true },
  { name: "napster", label: "Napster", description: "Toggle Napster Classifier", icon: "../SettingsLogo/napster.png", disabled: true },
  { name: "qobuz", label: "Qobuz", description: "Toggle Qobuz Classifier", icon: "../SettingsLogo/qobuz.png", disabled: true },
  { name: "qqMusic", label: "QQ Music", description: "Toggle QQ Music Classifier", icon: "../SettingsLogo/qq.png", disabled: true },
  { name: "yandexMusic", label: "Yandex Music", description: "Toggle Yandex Music Classifier", icon: "../SettingsLogo/yandex.png", disabled: true },
  { name: "vkMusic", label: "VK Music", description: "Toggle VK Music Classifier", icon: "../SettingsLogo/vkmusic.png", disabled: true },
  { name: "anghami", label: "Anghami", description: "Toggle Anghami Classifier", icon: "../SettingsLogo/Anghami.png", disabled: true },
  { name: "zvuk", label: "Zvuk", description: "Toggle Zvuk Classifier", icon: "../SettingsLogo/zvuk.png", disabled: true },
  { name: "gaana", label: "Gaana", description: "Toggle Gaana Classifier", icon: "../SettingsLogo/gaana.png", disabled: true },
  { name: "jiosaavn", label: "JioSaavn", description: "Toggle JioSaavn Classifier", icon: "../SettingsLogo/jio.png", disabled: true },
  { name: "resso", label: "Resso", description: "Toggle Resso Classifier", icon: "../SettingsLogo/resso.png", disabled: true },
  { name: "boomplay", label: "Boomplay", description: "Toggle Boomplay Classifier", icon: "../SettingsLogo/boomplay.png", disabled: true },
  { name: "wikipedia", label: "Wikipedia", description: "Toggle Wikipedia Classifier", icon: "../SettingsLogo/wikipedia.png", disabled: true },
  { name: "googleSearch", label: "Google Search", description: "Toggle Google Search Classifier", icon: "../SettingsLogo/google.png", disabled: true },
];

const displayFormSchema = z.object(
  Object.fromEntries([
    ["useCache", z.boolean()],
    ...classifierOptions.map(({ name }) => [name, z.boolean()]),
  ])
);

type DisplayFormValues = z.infer<typeof displayFormSchema>;

export function DisplayForm() {
  const { configs, addConfig } = useContext(ConfigContext);

  const defaultValues: Partial<DisplayFormValues> = Object.fromEntries(
    [["useCache", Boolean(configs.useCache)], ...classifierOptions.map(({ name }) => [name, Boolean(configs[name])])]
  );

  const form = useForm<DisplayFormValues>({
    resolver: zodResolver(displayFormSchema),
    defaultValues,
    mode: "onChange",
  });

  function onSubmit(data: DisplayFormValues) {
    Object.entries(data).forEach(([key, value]) => addConfig(configs, { key, value }));
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormItem>
          <div className="mt-4 space-y-2">
            <FormField
              control={form.control}
              name="useCache"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Cache</FormLabel>
                    <FormDescription>Toggle to utilize cache to reduce repeated calls.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <Separator />
          <div className="mt-4 space-y-2">
            <FormLabel className="text-base">Classifier Controllers</FormLabel>
            <FormDescription className="mb-4">
              Select the Classifier Mechanisms that you would like to incorporate into your scrapes. (Min 1 required)
            </FormDescription>
            {classifierOptions.map(({ name, label, description, icon, disabled }) => (
              <FormField
                key={name}              
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center space-x-3">
                      <img src={icon} alt={`${label} logo`} className="w-10 h-10" />
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{label}</FormLabel>
                        <FormDescription>{description}</FormDescription>
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} disabled={disabled} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </FormItem>
        <Separator />
        <Button type="submit">Update Classifiers</Button>
      </form>
    </Form>
  );
}
