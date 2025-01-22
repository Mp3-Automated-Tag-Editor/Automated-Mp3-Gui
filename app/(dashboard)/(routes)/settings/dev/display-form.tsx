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
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { useContext } from "react";
import { ConfigContext } from "@/components/context/ConfigContext";
import { Switch } from "@/components/ui/switch"

const displayFormSchema = z.object({
  spotify: z.boolean(),
  palm: z.boolean(),
  ytmusic: z.boolean(),
  itunes: z.boolean(),
  genius: z.boolean(),
  groq: z.boolean(),
});

type DisplayFormValues = z.infer<typeof displayFormSchema>;

export function DisplayForm() {
  const { configs, addConfig } = useContext(ConfigContext);

  const defaultValues: Partial<DisplayFormValues> = {
    spotify: Boolean(configs.spotify),
    palm: Boolean(configs.palm),
    ytmusic: Boolean(configs.ytmusic),
    itunes: Boolean(configs.itunes),
    genius: Boolean(configs.genius),
    groq: Boolean(configs.groq),
  };

  const form = useForm<DisplayFormValues>({
    resolver: zodResolver(displayFormSchema),
    defaultValues,
    mode: "onChange",
  });

  function onSubmit(data: DisplayFormValues) {
    addConfig(configs, {
      key: "spotify",
      value: data.spotify,
    });
    addConfig(configs, {
      key: "palm",
      value: data.palm,
    });
    addConfig(configs, {
      key: "ytmusic",
      value: data.ytmusic,
    });
    addConfig(configs, {
      key: "itunes",
      value: data.itunes,
    });
    addConfig(configs, {
      key: "genius",
      value: data.genius,
    });
    addConfig(configs, {
      key: "groq",
      value: data.groq,
    });
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
          <FormLabel className="text-base">Classifier Controllers</FormLabel>
          <FormDescription>
            Select the Classifier Mechanims that you would like to incorporate
            into your scrapes. (Min 1 required)
          </FormDescription>
          <FormField
            control={form.control}
            name="spotify"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Spotify
                  </FormLabel>
                  <FormDescription>Toggle Spotify Classifier</FormDescription>
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
          <FormField
            control={form.control}
            name="palm"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Google Palm
                  </FormLabel>
                  <FormDescription>Toggle Google Palm API Classifier</FormDescription>
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
          <FormField
            control={form.control}
            name="ytmusic"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    YouTube Music
                  </FormLabel>
                  <FormDescription>Toggle YTMusic Classifier</FormDescription>
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
          <FormField
            control={form.control}
            name="itunes"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    ITunes
                  </FormLabel>
                  <FormDescription>Toggle ITunes classifier</FormDescription>
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
          <FormField
            control={form.control}
            name="genius"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Genius
                  </FormLabel>
                  <FormDescription>Toggle Genius Classifier</FormDescription>
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
          <FormField
            control={form.control}
            name="groq"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Groq API
                  </FormLabel>
                  <FormDescription>Toggle Groq API Classifier</FormDescription>
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
        </FormItem>
        <Button type="submit">Update Classifiers</Button>

      </form>
    </Form>
  );
}
