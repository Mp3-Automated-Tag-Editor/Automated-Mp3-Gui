"use client";

import { Play } from "lucide-react";
import { open } from '@tauri-apps/api/dialog'

import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { invoke } from '@tauri-apps/api/tauri'
import { useState, useContext } from "react";
import { Dialog } from "@/components/dialog";
import Loading from "@/components/loading";
import "../../../globals.css"
import { useRouter } from "next/navigation";
import { DisplayForm } from "../settings/dev/display-form";
import { ConfigContext } from "@/components/context/ConfigContext"

const Start = () => {
  const [directory, setDirectory] = useState<any>();
  const [loading, setLoading] = useState<{ state: boolean, msg: string }>({ state: false, msg: "" });
  const [error, setError] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<{ title: string, data: string, type: number }>({ title: "", data: "", type: 0 })
  const { configs, addConfig } = useContext(ConfigContext);
  const router = useRouter();

  async function startSearch() {
    if (!directory) {
      setErrorDetails({
        title: "No Selected Directory",
        data: "Kindly select a directory that contains music files to be scraped.",
        type: 0
      })
      setError(true);
      return;
    }

    setLoading({ state: true, msg: "Loading your Database..." });
    const val: number = await invoke('initialize_db', { path_var: directory });
    router.push(`/terminal?directory=${directory}&files=${val}`)
  }

  async function selectDirectory() {
    try {
      const selectedPath = await open({
        title: "Select Music Library",
        directory: true,
        multiple: false,
        defaultPath: 'Downloads',
      });
      if (selectedPath) {
        setDirectory(selectedPath);
        setError(false);
        setErrorDetails({
          title: "",
          data: "",
          type: 0
        })
      } else return;

      if (await checkIfDirectoryContainsMusic(selectedPath) === false) {
        setErrorDetails({
          title: "Invalid Directory!",
          data: "This directory cannot be selected as there are no Mp3 files present. Kindly choose the directory that has the files required to be scraped.",
          type: 1
        })
        setError(true);
        setDirectory("");
        return;
      } else return;

    } catch (error) {
      console.log(error);
    }
  }

  async function checkIfDirectoryContainsMusic(selectedPath: any) {
    var msg = await invoke('check_directory', { var: selectedPath })
      .then((message) => {
        console.log(msg)
        return message;
      })
      .catch((error) => console.error(error));
    return msg;
  }

  return (
    <div>
      {loading.state ? <Loading msg={loading.msg} /> :
        <>
          <Heading
            title="Start Search"
            description="Our most advanced Vector based AI-indexing model for music metadata."
            icon={Play}
            iconColor="text-violet-500"
            otherProps="mb-8"
          // bgColor="bg-violet-500/10"
          />


          <div className="px-4 lg:px-8">
            <div>
              {error === true ? (
                <>
                  <Dialog msg={errorDetails.data} title={errorDetails.title} variant="destructive" type={true} />
                  {/* <Alert initial={error} msg={errorDetails.data} header={errorDetails.title} func={setError} type={errorDetails.type} />  goBackFunc={goBack} retryFunc={retry} /> */}
                </>
              ) : (
                directory === "" || directory === undefined || directory === null ? null : <Dialog msg={directory} title="Selected Directory" variant="none" type={false} />
              )
              }
              <div className="rounded-lg 
                border 
                w-full 
                p-4 
                px-3 
                md:px-6 
                focus-within:shadow-sm
              ">
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
                <div className="text-sm pb-2">Happy Searching!</div>

                <div className="grid
                grid-cols-12
                gap-2 py-2">
                  <Button onClick={selectDirectory} className="col-span-12 lg:col-span-3 w-full" type="submit" size="icon">
                    Select Directory
                  </Button>

                  <Sheet>
                    <SheetTrigger asChild>
                      <Button disabled={!configs.developerSettings} className="col-span-12 lg:col-span-3 w-full" type="submit" size="icon">
                        Developer Settings
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="overflow-y-auto p-4 min-w-[500px]">
                      <SheetHeader>
                        <SheetTitle>Edit Developer Settings</SheetTitle>
                        <SheetDescription>
                          Make changes to the scraper profile here:
                        </SheetDescription>
                      </SheetHeader>
                      <div>
                        <DisplayForm />
                      </div>
                      <SheetFooter>
                        {/* <SheetClose asChild>
                          <Button type="submit">Save changes</Button>
                        </SheetClose> */}
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>

                  <Button onClick={() => { startSearch() }} className="col-span-12 lg:col-span-3 w-full" type="submit" size="icon">
                    Start
                  </Button>


                </div>
              </div>
            </div>
          </div>
        </>
      }
    </div >
  );
}

export default Start;

