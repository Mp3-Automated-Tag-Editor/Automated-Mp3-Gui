"use client";

// import * as z from "zod";
// import axios from "axios";
import { Pencil, Play } from "lucide-react";
// import { useForm } from "react-hook-form";
import { useState } from "react";
// import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
// import { ChatCompletionRequestMessage } from "openai";

// import { BotAvatar } from "@/components/bot-avatar";
import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { cn } from "@/lib/utils";
// import { Loader } from "@/components/loader";
// import { UserAvatar } from "@/components/user-avatar";
import { Empty } from "@/components/ui/empty";
// import { useProModal } from "@/hooks/use-pro-modal";


const Start = () => {
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
      <Heading
        title="Edit"
        description="Manually edit Music Metadata (In case our classifiers can&apos;t figure out your song)."
        icon={Pencil}
        iconColor="text-orange-700"
        otherProps="mb-8"
      // bgColor="bg-violet-500/10"
      />
      <div className="px-4 lg:px-8">
        <div>
          <div className="rounded-lg 
                border 
                w-full 
                p-4 
                px-3 
                md:px-6 
                focus-within:shadow-sm">
            <h5 className="text-l font-bold">Some Points to Note:</h5>
            <p className="text-sm py-4">
              <ol>
                <li>1. Make sure to select a directory which contains Mp3 files only.</li>
                <li>2. Mp3 files that contain incomplete Metadata will also be searched and indexed.</li>
                <li>3. To download indexed database, kindly turn on Developer Settings in <b>Settings</b>, as this is turned off by default.</li>
                <li>4. Make sure to configure the application, including number of threads to be used to hasten the indexing process.</li>
                <li>5. Remember, the trial allows <b>100 Deep Searches</b> only, kindly buy more credits to index more songs.</li>
              </ol>
            </p>
            <div className="grid
                grid-cols-12
                gap-2 py-2">
              <Button className="col-span-12 lg:col-span-3 w-full" type="submit" size="icon">
                Select Directory
              </Button>
              
              <Button className="col-span-12 lg:col-span-3 w-full" type="submit" size="icon">
                Settings
              </Button>

              <Button className="col-span-12 lg:col-span-3 w-full" type="submit" size="icon">
                Start
              </Button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Start;

