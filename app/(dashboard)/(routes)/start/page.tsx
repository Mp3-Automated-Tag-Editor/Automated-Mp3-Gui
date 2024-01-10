"use client";

import { Play } from "lucide-react";
import { open } from '@tauri-apps/api/dialog'

import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
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
import { Progress } from "@/components/ui/progress"
import { invoke } from '@tauri-apps/api/tauri'
import { useEffect, useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Dialog from "@/components/dialog";
import Alert from "@/components/alert";
import { listen, emit, type UnlistenFn } from "@tauri-apps/api/event";
import { array, boolean, z } from "zod";
import Loading from "@/components/loading";
import "../../../globals.css"
import { Store } from "tauri-plugin-store-api";
import { SongItem } from "@/components/terminal-items";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const store = new Store(".settings.dat");

interface WindowEmit {
  state: boolean,
  numPaths: number
}

const Start = () => {
  const [directory, setDirectory] = useState<any>();
  const [numFiles, setNumFiles] = useState<number>(0);
  const [error, setError] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<{ title: string, data: string }>({
    title: "",
    data: ""
  })
  const [loading, setLoading] = useState<{ state: boolean, msg: string }>({ state: false, msg: "" });
  const [displayConsole, setDisplayConsole] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [settingsData, setSettingsData] = useState<any>({});
  const [components, setComponents] = useState<any>([]);

  const [dataID, setDataID] = useState<any>(new Set());
  function addDataID (dataID: any) {
    setDataID((previousState: any) => new Set([...previousState, dataID]))
  }
  function removeDataID (x: any) {
    setDataID(dataID.delete(x));
  }


  const [counter, setCounter] = useState<number>(0);

  const consoleRef = useRef(null);

  // let unListen: UnlistenFn;

  useEffect(() => {
    async function listenDbInitialization() {
      async function loadData() {
        store.load();
        await store.load();
        const data = await store.get('settings');
        setSettingsData(data);
      }
      loadData();

      let unListen2: UnlistenFn = await listen('db_init_paths', (event) => {
        setNumFiles(z.number().parse(event.payload));
      });
    }

    listenDbInitialization();
  }, [numFiles])

  interface WindowEmit {
    id: number,
    state: boolean,
    data: string
  }

  useEffect(() => {
    async function listenProgressDetails() {
      let unListen2: UnlistenFn = await listen('progress_start', (event) => {
        const data: WindowEmit = JSON.parse(JSON.stringify(event.payload));
        if (!dataID.has(data.id)) {
          dataID.addDataID(data.id);
          const newData: WindowEmit = { id: data.id, state: data.state, data: data.data }
          setComponents((prevComponents: any) => [...prevComponents, newData]);
        }
      });

      let unListen: UnlistenFn = await listen('progress_end', (event) => {
        const data: WindowEmit = JSON.parse(JSON.stringify(event.payload));
        if (dataID.has(data.id)) {
          dataID.delete(data.id);
          const updatedData: WindowEmit = { id: data.id, state: data.state, data: data.data }
          setProgress(progress + 1);
          setComponents((prevComponents: any) => [...prevComponents, updatedData]);
        }

      });

    }

    listenProgressDetails();

    return () => {
      console.log(components);
      console.log(dataID);
    }
    // ScrollDown();
  }, [components]);

  const ScrollDown = (ref: any) => {
    window.scrollTo({
      top: ref.offsetTop,
      left: 0,
      behavior: "smooth",
    });
  };

  async function startSearch() {
    if (!directory) {
      setErrorDetails({
        title: "No Selected Directory",
        data: "Kindly select a directory that contains music files to be scraped."
      })
      setError(true);
      return;
    } else {
      setErrorDetails({
        title: "",
        data: ""
      })
      setError(false);

      setLoading({ state: true, msg: "Loading your Database..." });
      const val: number = await invoke('initialize_db', { path_var: directory });
      setNumFiles(val);
      setLoading({ state: false, msg: "" });

      setDisplayConsole(!displayConsole);
      setProgress(0);
      setTimeout(() => {
        ScrollDown(consoleRef.current);
      }, 2000);
      const elapsedTime = await invoke('start_scrape_process');
      console.log(elapsedTime);
    };
  }

  async function checkIfDirectoryContainsMusic(selectedPath: any) {
    var msg = await invoke('check_directory', { var: selectedPath })
      .then((message) => {
        return message;
      })
      .catch((error) => console.error(error));
    return msg;
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
          data: ""
        })
      } else return;

      if (await checkIfDirectoryContainsMusic(selectedPath) === false) {
        setErrorDetails({
          title: "Invalid Directory!",
          data: "This directory cannot be selected as there are no Mp3 files present. Kindly choose the directory that has the files required to be scraped."
        })
        setError(true);
        setDirectory("");
        return;
      } else return;

    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div>
      {loading.state ? <Loading msg={loading.msg} /> :
        <>
          <Heading
            title={displayConsole ? "Start Search" : "Searching..."}
            description={displayConsole ? "Our most advanced Vector based AI-indexing model for music metadata." : "Getting your music ready for you!"}
            icon={Play}
            iconColor="text-violet-500"
            otherProps="mb-8"
          // bgColor="bg-violet-500/10"
          />
          <div className={cn("px-4 my-4 lg:px-8", !displayConsole ? "hidden" : "visible")}>

            {error === true ? (
              <>
                <Dialog msg={errorDetails.data} title={errorDetails.title} variant="destructive" type={true} />
                <Alert initial={error} msg={errorDetails.data} header={errorDetails.title} func={setError} />
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
                    <Button className="col-span-12 lg:col-span-3 w-full" type="submit" size="icon">
                      Settings
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Edit profile</SheetTitle>
                      <SheetDescription>
                        Make changes to your profile here. Click save when you&apos;re done.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Name
                        </Label>
                        <Input id="name" value="Pedro Duarte" className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">
                          Username
                        </Label>
                        <Input id="username" value="@peduarte" className="col-span-3" />
                      </div>
                    </div>
                    <SheetFooter>
                      <SheetClose asChild>
                        <Button type="submit">Save changes</Button>
                      </SheetClose>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>



                <Button onClick={() => { startSearch() }} className="col-span-12 lg:col-span-3 w-full" type="submit" size="icon">
                  Start
                </Button>
              </div>
            </div>
          </div>
          <div ref={consoleRef} id="section-1" className={cn("px-4 mt-10 lg:px-8", displayConsole ? "hidden" : "visible")}>
            <div className="rounded-lg 
                border 
                w-full 
                p-4 
                px-3 
                md:px-6 
                focus-within:shadow-sm
            ">
              <Progress indicatorColor="bg-black" value={progress * 100 / numFiles} className="w-full" />
              {/*Make a loading component that renders each time, and push to array only after confirmation is sent from backend*/}
              <div className="fakeScreen overflow-y-scroll">
                <p className="line1">$ Mp3-Automated-Tag-Editor v1.3.0<span className="cursor1">_</span></p>
                <p className="line2">Welcome to the Automated Mp3 Tag Editor. Initializing Scraper</p>
                <p className="line3">[&gt;] Chosen Directory: {directory}</p>
                <p className="line3">[&gt;] Number of Threads: {settingsData.threads}</p>
                <p className="line2">Initialization Complete, Listening for events...</p>
                <Separator className="my-2" />
                {
                  components.map((obj: WindowEmit) => {
                    <SongItem key={obj.id} percentage={0} status={obj.state} id={obj.id} path="D:\Music\Latest Songs-Incomplete\5 Seconds of Summer - Amnesia.mp3" />
                  })
                }
                <p className="line4">&gt;<span className="cursor4">_</span></p>
                <div id="snap"></div>
              </div>
            </div>
          </div>
        </>
      }

    </div>
  );
}

export default Start;

