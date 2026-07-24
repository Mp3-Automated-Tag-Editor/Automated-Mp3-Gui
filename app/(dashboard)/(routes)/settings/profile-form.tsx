"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { open } from "@tauri-apps/api/dialog"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "@/components/ui/use-toast"
import { Slider } from "@/components/ui/slider"
import { useContext, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { ConfigContext } from "@/components/context/ConfigContext"
import { usePlayer } from "@/components/context/PlayerContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CONFIG_KEYS, SCRAPE_MODE, type ScrapeMode } from "@/constants"

const profileFormSchema = z.object({
  threads: z.number().int(),
  developerSettings: z.boolean(),
  scrapeMode: z.enum([SCRAPE_MODE.review, SCRAPE_MODE.apply]),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm() {
  const { configs, addConfig } = useContext(ConfigContext);
  const { loadFolder } = usePlayer();

  const defaultValues: Partial<ProfileFormValues> = {
    threads: Number(configs[CONFIG_KEYS.threads]) || 1,
    developerSettings: Boolean(configs[CONFIG_KEYS.developerSettings]),
    scrapeMode: (configs[CONFIG_KEYS.scrapeMode] === SCRAPE_MODE.apply
      ? SCRAPE_MODE.apply
      : SCRAPE_MODE.review) as ScrapeMode,
  }

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  })

  const [value, setValue] = useState<number[]>([
    Number(defaultValues.threads) || 1,
  ]);
  const [libraryPath, setLibraryPath] = useState<string>(
    String(configs[CONFIG_KEYS.libraryPath] || "")
  );

  async function changeLibraryFolder() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select music library folder",
      });
      if (!selected || Array.isArray(selected)) return;
      setLibraryPath(selected);
      await addConfig(configs, { key: CONFIG_KEYS.libraryPath, value: selected });
      await loadFolder(selected);
      toast({
        title: "Library folder updated",
        description: selected,
      });
    } catch (e: unknown) {
      toast({
        title: "Could not update folder",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  }

  function onSubmit(data: ProfileFormValues) {
    data.threads = Number(value[0] ?? 1);
    addConfig(configs, {
      key: CONFIG_KEYS.threads,
      value: data.threads
    });
    addConfig(configs, {
      key: CONFIG_KEYS.developerSettings,
      value: data.developerSettings
    });
    addConfig(configs, {
      key: CONFIG_KEYS.scrapeMode,
      value: data.scrapeMode,
    });
    if (libraryPath) {
      addConfig(configs, { key: CONFIG_KEYS.libraryPath, value: libraryPath });
    }

    toast({
      title: "Settings saved",
      description: "General settings have been updated.",
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-3 rounded-lg border p-4">
          <div>
            <h3 className="text-base font-medium">Library folder</h3>
            <p className="text-sm text-muted-foreground">
              Shared by Edit, Music Playstation, and Statistics.
            </p>
          </div>
          <p className="break-all rounded-md bg-muted px-3 py-2 text-sm">
            {libraryPath || "No folder selected"}
          </p>
          <Button type="button" variant="outline" onClick={changeLibraryFolder}>
            Change folder
          </Button>
        </div>

        <FormField
          control={form.control}
          name="threads"
          render={() => (
            <FormItem>
              <FormLabel>Number of Threads — {value[0]}</FormLabel>
              <Slider
                onValueChange={setValue}
                defaultValue={value}
                max={16}
                step={1}
                min={1}
              />
              <FormDescription>
                Worker threads used when scraping metadata from Edit.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scrapeMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default scrape mode</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={SCRAPE_MODE.review}>
                    Review — save suggestions for approval
                  </SelectItem>
                  <SelectItem value={SCRAPE_MODE.apply}>
                    Apply — write tags immediately
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Can also be toggled from the Edit toolbar scrape menu.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <h3 className="mb-4 text-lg font-medium">General Settings</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="developerSettings"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Developer Settings
                    </FormLabel>
                    <FormDescription>
                      Turn on Developer Settings.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button type="submit">Update Settings</Button>
      </form>
    </Form>
  )
}
