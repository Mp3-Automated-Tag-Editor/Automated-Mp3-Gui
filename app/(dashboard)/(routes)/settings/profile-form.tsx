"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import * as z from "zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "@/components/ui/use-toast"
import { Slider } from "@/components/ui/slider"
import { useContext, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { ConfigContext } from "@/components/context/ConfigContext"

const profileFormSchema = z.object({
  threads: z.number().int(),
  developerSettings: z.boolean(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

// This can come from your database or API.


export function ProfileForm() {
  const { configs, addConfig } = useContext(ConfigContext);

  const defaultValues: Partial<ProfileFormValues> = {
    threads: Number(configs.threads),
    developerSettings: Boolean(configs.developerSettings),
  }

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  })

  function onSubmit(data: ProfileFormValues) {
    data.threads = Number(value);
    addConfig(configs, {
      key: "threads",
      value: data.threads
    });
    addConfig(configs, {
      key: "developerSettings",
      value: data.developerSettings
    });
    
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  const [value, setValue] = useState<any>(defaultValues.threads);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        <FormField
          control={form.control}
          name="threads"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Threads - {value}</FormLabel>
              <Slider onValueChange={setValue} defaultValue={[value]} max={16} step={1} />

              <FormDescription>
                You can manage verified email addresses in your{" "}
                <Link href="/examples/forms">email settings</Link>.
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
