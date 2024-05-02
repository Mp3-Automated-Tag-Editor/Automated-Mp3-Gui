"use client";

import { Play } from "lucide-react";
import { message, open } from '@tauri-apps/api/dialog'

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
import { array, boolean, number, z } from "zod";
import Loading from "@/components/loading";
import "../../../globals.css"
import { Store } from "tauri-plugin-store-api";
import { CheckItem, ErrorItem, SongItem } from "@/components/terminal-items";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const store = new Store(".settings.dat");

const Start = () => {
  const [directory, setDirectory] = useState<any>();
  const [numFiles, setNumFiles] = useState<number>(0);
  const [error, setError] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<{ title: string, data: string }>({ title: "", data: "" })
  const [loading, setLoading] = useState<{ state: boolean, msg: string }>({ state: false, msg: "" });
  const [displayConsole, setDisplayConsole] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [settingsData, setSettingsData] = useState<any>({});
  const [serverHealth, setServerHealth] = useState<ServerHealth>({ message: "Unable to Connect to the Server. Please Try again later.", status: 404 });
  const [initializeSuccess, setInitializeSuccess] = useState<boolean>(false);

  //Terminus 
  const [checks, setChecks] = useState<Map<Number, Initialization>>(new Map());
  const [hashmap, setHashmap] = useState<Map<Number, WindowEmit>>(new Map());

  const consoleRef = useRef(null);

  useEffect(() => {
    async function listenProgressDetails() {
      let unListen1: UnlistenFn = await listen('progress_start', (event) => {
        const progressData: WindowEmit = JSON.parse(JSON.stringify(event.payload));
        hashmap.set(progressData.id, progressData);
        setHashmap(new Map(hashmap));
      });
    }

    async function confirmProgressDetails() {
      let unListen2: UnlistenFn = await listen('progress_end', (event) => {
        const progressData: WindowEmit = JSON.parse(JSON.stringify(event.payload));
        hashmap.set(progressData.id, progressData);
        setHashmap(new Map(hashmap));
        setProgress(hashmap.size);
      });
    }

    async function listenErrorDetails() {
      let unListen3: UnlistenFn = await listen('error_env', (event) => {
        const error: WindowEmit = JSON.parse(JSON.stringify(event.payload)) as WindowEmit;
        console.log(error.errorMessage)
        console.log(event.payload)

        error.isError = true;
        hashmap.set(error.id, error);
        setHashmap(new Map(hashmap));
        setProgress(hashmap.size);
      });
    }

    listenErrorDetails();
    listenProgressDetails();
    confirmProgressDetails();
  }, []);

  // Example: Updating the Map

  // Effect to log the Map values whenever it changes
  // useEffect(() => {
  //   console.log('Map values:', hashmap);
  // }, [hashmap]);

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
    data: string,

    isError: boolean,
    errorCode: number,
    errorMessage: string
  }

  interface Initialization {
    id: number,
    lineType: number,
    message: string,
    messageOptional: string,
    result: boolean
  }

  interface NetworkDetails {
    ifConnected: boolean,
    latency: number,
    speed: number
  }

  interface ServerHealth {
    status: number,
    message: string
  }

  const ScrollDown = (ref: any) => {
    window.scrollTo({
      top: ref.offsetTop,
      left: 0,
      behavior: "smooth",
    });
  };

  async function getServerHealth() {
    try {
      var msg = await invoke('get_server_health') as ServerHealth
      if (msg.status == 200) {
        return(msg)
      } else {
        return({status: 404, message: "Unable to Connect to Server, exiting process."} as ServerHealth)
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function getNetworkDetails() {
    try {
      var msg = await invoke('get_network_data') as NetworkDetails
      console.log(msg)
      return msg;
    } catch (error) {
      console.log(error);
    }
  }

  function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function startSearch() {
    if (!directory) {
      setErrorDetails({
        title: "No Selected Directory",
        data: "Kindly select a directory that contains music files to be scraped."
      })
      setError(true);
      return;
    }
    else {
      setErrorDetails({
        title: "",
        data: ""
      })
      setError(false);

      /**
List of Checks:
- Search if directory (done before hand)
- Search for thread number
(These 2 will be added automatically)
- Network Details
  - If Network is Up
  - Network Latency
  - Speed
- Server Health

- Stopping Process (in case of failure) + Starting Process (in case all checks are passed)

On Stopping Process - Pop up with error + button at bottom of terminal to retry/go back

On Check for each, add it to the hashmap and force re-render of checks. 
If network check fails
 */

      setLoading({ state: true, msg: "Loading your Database..." });
      const val: number = await invoke('initialize_db', { path_var: directory });
      setNumFiles(val);
      setLoading({ state: false, msg: "" });

      setDisplayConsole(!displayConsole);
      setProgress(0);
      setTimeout(() => {
        ScrollDown(consoleRef.current);
      }, 2000);

      // Initial initialization, directory and threads
      var counter = 0;
      checks.set(counter, { id: counter, message: "Welcome to the Automated Mp3 Tag Editor.", lineType: 2, messageOptional: " Initializing Scraper...", result: true } as Initialization);
      setHashmap(new Map(hashmap));


      await sleep(3500)
      counter++
      checks.set(counter, { id: counter, message: "Chosen Directory: ", lineType: 3, messageOptional: directory, result: true } as Initialization);
      setHashmap(new Map(hashmap));

      await sleep(1000)
      counter++
      checks.set(counter, { id: counter, message: "Number of Threads: ", lineType: 3, messageOptional: settingsData.threads, result: true } as Initialization);
      setHashmap(new Map(hashmap));

      const networkDetails = await getNetworkDetails();
      const serverHealth = await getServerHealth();
      await sleep(1000)
      counter++
      if (!networkDetails?.ifConnected) {
        checks.set(counter, { id: counter, message: "Checking Network: ", lineType: 3, messageOptional: "Failed", result: false } as Initialization);
        setHashmap(new Map(hashmap));

        await sleep(1000)
        counter++
        checks.set(counter, { id: counter, message: "AutoMp3 Initialization Failed: ", lineType: 2, messageOptional: "Exiting", result: false } as Initialization);
        setHashmap(new Map(hashmap));

        setErrorDetails({
          title: "Error Code: " + serverHealth?.status,
          data: "" + serverHealth?.message
        })
        setError(true);
        return
      }
      checks.set(counter, { id: counter, message: "Checking Network: ", lineType: 3, messageOptional: "Connected", result: true } as Initialization);
      setHashmap(new Map(hashmap));

      await sleep(1000)
      counter++
      console.log(serverHealth)
      if (serverHealth?.status != 200) {
        checks.set(counter, { id: counter, message: "Server Health: ", lineType: 3, messageOptional: serverHealth?.message, result: false } as Initialization);
        setHashmap(new Map(hashmap));

        await sleep(1000)
        counter++
        checks.set(counter, { id: counter, message: "AutoMp3 Initialization Failed: ", lineType: 2, messageOptional: "Exiting", result: false } as Initialization);
        setHashmap(new Map(hashmap));

        setErrorDetails({
          title: "Error Code: " + serverHealth?.status,
          data: "" + serverHealth?.message
        })
        setError(true);
        return
      }
      checks.set(counter, { id: counter, message: "Server Health: ", lineType: 3, messageOptional: serverHealth.message, result: true } as Initialization);
      setHashmap(new Map(hashmap));

      await sleep(1000)
      counter++
      var latency = networkDetails?.latency as unknown as String
      checks.set(counter, { id: counter, message: "Server Latency:  ", lineType: 3, messageOptional: latency + " ms", result: true } as Initialization);
      setHashmap(new Map(hashmap));

      await sleep(1000)
      counter++
      checks.set(counter, { id: counter, message: "Initialization Complete, Listening for events... ", lineType: 2, messageOptional: "", result: true } as Initialization);
      setHashmap(new Map(hashmap));

      await sleep(1000)
      setInitializeSuccess(true)

      await sleep(3500)
      const elapsedTime = await invoke('start_scrape_process', { pathVar: directory });
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
              <div className="fakeScreen">

                <p className="line1">$ Mp3-Automated-Tag-Editor v1.3.0<span className="cursor1">_</span></p>


                {/* <p className="line2">Welcome to the Automated Mp3 Tag Editor. Initializing Scraper</p>
                <p className="line3">[&gt;] Chosen Directory: {directory}</p>
                <p className="line3">[&gt;] Number of Threads: {settingsData.threads}</p>
                <p className="line3">[&gt;] Checking Network: </p>
                <p className="line3">[&gt;] Network Speed: </p>
                <p className="line3">[&gt;] Network Latency: </p>
                <p className="line3">[&gt;] Server Health: {serverHealth?.message}</p>
                <p className="line2">Initialization Complete, Listening for events...</p> */}
                {
                  [...checks].map((entry) => {
                    let key = entry[0];
                    let value = entry[1];
                    return <CheckItem key={value.id} message={value.message} lineType={value.lineType} messageOptional={value.messageOptional} result={value.result} />
                  })
                }
                {initializeSuccess ? <Separator className="my-2" /> : null}
                {
                  [...hashmap].map((entry) => {
                    let key = entry[0];
                    let value = entry[1];
                    if (value.isError) return (
                      <ErrorItem key={value.id} message={value.errorMessage} code={value.errorCode} />
                    )
                    else return (
                      <SongItem key={value.id} percentage={0} status={value.state} id={value.id} path={value.data} />
                    )
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

