"use client";

import { Play } from "lucide-react";
import { Heading } from "@/components/heading";
import { Progress } from "@/components/ui/progress";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState, useCallback, useRef } from "react";
import { listen, emit, type UnlistenFn } from "@tauri-apps/api/event";
import { array, boolean, number, z } from "zod";
import "../../../globals.css";
import { Store } from "tauri-plugin-store-api";
import {
  CheckItem,
  ResultItem,
  TerminalItem,
} from "@/components/terminal-items";
import { Separator } from "@/components/ui/separator";
import { GlobalHotKeys } from "react-hotkeys";
import useStateRef from "react-usestateref";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Initialization,
  NetworkDetails,
  Packet,
  Seperator,
  ServerHealth,
  Status,
  ScrapeResult,
} from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const store = new Store(".settings.dat");

const Terminal = () => {
  const [numFiles, setNumFiles, numFilesRef] = useStateRef<number>(0);
  const [error, setError] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<{
    title: string;
    data: string;
    type: number;
  }>({ title: "", data: "", type: 0 });
  const [loading, setLoading] = useState<{ state: boolean; msg: string }>({
    state: false,
    msg: "",
  });
  const [displayConsole, setDisplayConsole] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [settingsData, setSettingsData, settingsDataRef] = useStateRef<any>({});
  const [initializeSuccess, setInitializeSuccess, initializeSuccessRef] =
    useStateRef<boolean>(false);
  const [scrapeResult, setScrapeResult, scrapeResultRef] =
    useStateRef<boolean>(false);
  const [stopScrape, setStopScrape, ref] = useStateRef<boolean>(false);

  //Terminus
  const [checks, setChecks] = useState<Map<Number, Initialization>>(new Map());
  const [hashmap, setHashmap] = useState<Map<Number, Packet>>(new Map());
  const [results, setResults] = useState<ScrapeResult>();

  const [terminal, setTerminal] = useState<
    Map<Number, Initialization | Packet | Seperator>
  >(new Map());

  const consoleRef = useRef(null);
  const searchParams = useSearchParams();

  const directory = searchParams.get("directory");
  const numOfFiles = searchParams.get("files");

   const router = useRouter();

  useEffect(() => {
    startSearch(0);
  }, []);

  useEffect(() => {
    async function listenProgressDetails() {
      console.log("From progress: ", ref.current);
      if (!ref.current) {
        let unListen1: UnlistenFn = await listen("progress_start", (event) => {
          const progressData: Packet = JSON.parse(
            JSON.stringify(event.payload)
          );
          hashmap.set(progressData.id, progressData);
          setHashmap(new Map(hashmap));
        });
      } else {
        setStopScrape(false);
        return;
      }
    }

    async function confirmProgressDetails() {
      let unListen2: UnlistenFn = await listen("progress_end", (event) => {
        const progressData: Packet = JSON.parse(JSON.stringify(event.payload));
        hashmap.set(progressData.id, progressData);
        setHashmap(new Map(hashmap));
        setProgress(hashmap.size);
      });
    }

    async function listenErrorDetails() {
      if (!ref.current) {
        let unListen3: UnlistenFn = await listen("error_env", (event) => {
          const error: Packet = JSON.parse(
            JSON.stringify(event.payload)
          ) as Packet;
          console.log(event.payload);

          error.status = Status.FAILED;
          hashmap.set(error.id, error);
          setHashmap(new Map(hashmap));
          setProgress(hashmap.size);
        });
      } else {
        setStopScrape(false);
        return;
      }
    }

    async function listenScrapeResult() {
      let unListen4: UnlistenFn = await listen("scrape_result", (event) => {
        const resultData: ScrapeResult = JSON.parse(
          JSON.stringify(event.payload)
        );
        setScrapeResult(true);
        setResults(resultData);
        console.log(resultData);
      });
    }

    listenErrorDetails();
    listenProgressDetails();
    confirmProgressDetails();
    listenScrapeResult();
  }, []);

  useEffect(() => {
    async function listenDbInitialization() {
      async function loadData() {
        // store.load();
        await store.load();
        const data = await store.get("settings");
        setSettingsData(data);
      }
      loadData();

      let unListen2: UnlistenFn = await listen("db_init_paths", (event) => {
        setNumFiles(z.number().parse(event.payload));
      });
    }

    listenDbInitialization();
  }, [numFiles]);

  const handleChangeInScrape = useCallback(async () => {
    setStopScrape(true);
    await invoke("stop_scrape_process");
    goBack(2);
  }, []);

  const ScrollDown = (ref: any) => {
    window.scrollTo({
      top: ref.offsetTop,
      left: 0,
      behavior: "smooth",
    });
  };

  async function getServerHealth() {
    try {
      var msg = (await invoke("get_server_health")) as ServerHealth;
      if (msg.status == 200) {
        return msg;
      } else {
        return {
          status: 404,
          message: "Unable to Connect to Server, exiting process.",
        } as ServerHealth;
      }
    } catch (error) {
      console.log(error);
      return { status: 404, message: error } as ServerHealth;
    }
  }

  async function getNetworkDetails() {
    try {
      var msg = (await invoke("get_network_data")) as NetworkDetails;
      console.log(msg);
      return msg;
    } catch (error) {
      console.log(error);
    }
  }

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function goBack(type: number) {
    if (type == 1) {
      checks.set(123, {
        id: 123,
        message: "Retry? ",
        lineType: 3,
        messageOptional: "No",
        result: false,
      } as Initialization);
      setChecks(new Map(checks));
      await sleep(3500);
      checks.set(124, {
        id: 124,
        message: "Initialization Stopped, Exiting... ",
        lineType: 2,
        messageOptional: "",
        result: true,
      } as Initialization);
      setChecks(new Map(checks));
      await sleep(3500);

      checks.clear();
      setChecks(new Map(checks));

      setDisplayConsole(!displayConsole);
      return;
    } else {
      // Go back from ctrl C triggered
      if (initializeSuccessRef.current) {
        hashmap.set(999999, {
          id: 999999,
          status: Status.FAILED,
          errorMessage: "Scrape Cancelled, Exiting...",
          statusCode: 404,
        } as Packet);
        setHashmap(new Map(hashmap));
      } else {
        checks.set(126, {
          id: 126,
          message: "Scrape Cancelled, Exiting... ",
          lineType: 2,
          messageOptional: "",
          result: true,
        } as Initialization);
        setChecks(new Map(checks));
      }
      await sleep(3500);
      setDisplayConsole(displayConsole);

      checks.clear();
      setChecks(new Map(checks));
      hashmap.clear();
      setHashmap(new Map(hashmap));

      return;
    }
  }

  async function retry() {
    checks.set(123, {
      id: 123,
      message: "Retry? ",
      lineType: 3,
      messageOptional: "Yes",
      result: true,
    } as Initialization);
    setHashmap(new Map(hashmap));
    await sleep(3500);
    checks.clear();
    startSearch(1);
  }

  async function startSearch(type: number) {
    setLoading({ state: true, msg: "Loading your Database..." });
    const val: number = await invoke("initialize_db", { path_var: directory });
    setNumFiles(val);
    setLoading({ state: false, msg: "" });

    if (type == 0) {
      setDisplayConsole(!displayConsole);
    }
    setTimeout(() => {
      ScrollDown(consoleRef.current);
    }, 2000);
    setProgress(0);

    // Initial initialization, directory and threads
    var counter = 0;
    checks.set(counter, {
      id: counter,
      message: "Welcome to the Automated Mp3 Tag Editor.",
      lineType: 2,
      messageOptional: " Initializing Scraper...",
      result: true,
    } as Initialization);
    setHashmap(new Map(hashmap));
    await sleep(3500);

    counter++;
    checks.set(counter, {
      id: counter,
      message: "(Press Ctrl+C at any time to Cancel)",
      lineType: 2,
      messageOptional: "",
      result: true,
    } as Initialization);
    setHashmap(new Map(hashmap));
    await sleep(3500);

    if (!ref.current) {
      counter++;
      checks.set(counter, {
        id: counter,
        message: "Chosen Directory: ",
        lineType: 3,
        messageOptional: directory,
        result: true,
      } as Initialization);
      setHashmap(new Map(hashmap));
    } else {
      setStopScrape(false);
      return;
    }

    console.log(ref.current);

    await sleep(1000);
    if (!ref.current) {
      counter++;
      checks.set(counter, {
        id: counter,
        message: "Number of Threads: ",
        lineType: 3,
        messageOptional: settingsDataRef.current.threads,
        result: true,
      } as Initialization);
      setHashmap(new Map(hashmap));
    } else {
      setStopScrape(false);
      return;
    }

    await sleep(1000);
    if (!ref.current) {
      counter++;
      checks.set(counter, {
        id: counter,
        message: "Number of Files: ",
        lineType: 3,
        messageOptional: numOfFiles,
        result: true,
      } as Initialization);
      setHashmap(new Map(hashmap));
    } else {
      setStopScrape(false);
      return;
    }

    console.log(ref.current);

    const networkDetails = await getNetworkDetails();
    const serverHealth = await getServerHealth();
    await sleep(1000);
    if (!ref.current) {
      counter++;
      if (!networkDetails?.ifConnected) {
        checks.set(counter, {
          id: counter,
          message: "Checking Network: ",
          lineType: 3,
          messageOptional: "Failed",
          result: false,
        } as Initialization);
        setHashmap(new Map(hashmap));

        await sleep(1000);
        counter++;
        checks.set(counter, {
          id: counter,
          message: "AutoMp3 Initialization Failed: ",
          lineType: 2,
          messageOptional: "Exiting",
          result: false,
        } as Initialization);
        setHashmap(new Map(hashmap));

        setErrorDetails({
          title: "Error Code: " + serverHealth?.status,
          data: "" + serverHealth?.message,
          type: 1,
        });
        setError(true);
        setStopScrape(false);
        return;
      }
      checks.set(counter, {
        id: counter,
        message: "Checking Network: ",
        lineType: 3,
        messageOptional: "Connected",
        result: true,
      } as Initialization);
      setHashmap(new Map(hashmap));
    } else {
      setStopScrape(false);
      return;
    }

    await sleep(1000);
    if (!ref.current) {
      counter++;
      console.log(serverHealth);
      if (serverHealth?.status != 200) {
        checks.set(counter, {
          id: counter,
          message: "Server Health: ",
          lineType: 3,
          messageOptional: serverHealth?.message,
          result: false,
        } as Initialization);
        setHashmap(new Map(hashmap));

        await sleep(1000);
        counter++;
        checks.set(counter, {
          id: counter,
          message: "AutoMp3 Initialization Failed: ",
          lineType: 2,
          messageOptional: "Exiting",
          result: false,
        } as Initialization);
        setHashmap(new Map(hashmap));

        setErrorDetails({
          title: "Error Code: " + serverHealth?.status,
          data: "" + serverHealth?.message,
          type: 1,
        });
        setError(true);
        setStopScrape(false);
        return;
      }
      checks.set(counter, {
        id: counter,
        message: "Server Health: ",
        lineType: 3,
        messageOptional: serverHealth.message,
        result: true,
      } as Initialization);
      setHashmap(new Map(hashmap));
    } else {
      setStopScrape(false);
      return;
    }

    await sleep(1000);
    if (!ref.current) {
      counter++;
      var latency = networkDetails?.latency as unknown as String;
      checks.set(counter, {
        id: counter,
        message: "Server Latency:  ",
        lineType: 3,
        messageOptional: latency + " ms",
        result: true,
      } as Initialization);
      setHashmap(new Map(hashmap));
    } else {
      setStopScrape(false);
      return;
    }

    await sleep(1000);
    if (!ref.current) {
      counter++;
      checks.set(counter, {
        id: counter,
        message: "Initialization Complete, Listening for events... ",
        lineType: 2,
        messageOptional: "",
        result: true,
      } as Initialization);
      setHashmap(new Map(hashmap));
    } else {
      setStopScrape(false);
      return;
    }

    if (!ref.current) {
      await sleep(1000);
      setInitializeSuccess(true);
    } else {
      setStopScrape(false);
      return;
    }

    if (!ref.current) {
      await sleep(3500);
      const elapsedTime = await invoke("start_scrape_process", {
        pathVar: directory,
      });
      console.log(elapsedTime);
    } else {
      setStopScrape(false);
      return;
    }
  }

  function goToEditScreen() {
    try {
      console.log(results);
      if (results == null) {
        return;
      }
      router.push(`/edit/editPage?directory=${directory}&totalSongs=${numOfFiles}&pageNo=${1}&pageSize=${10}&session=${results.sessionName}&accuracy=${results.overallAccuracy}`);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <GlobalHotKeys
      keyMap={{
        FOCUS_BARCODE: "ctrl+c",
      }}
      handlers={{
        FOCUS_BARCODE: handleChangeInScrape,
      }}
    >
      <Heading
        title={"Searching..."}
        description={"Getting your music ready for you!"}
        icon={Play}
        iconColor="text-violet-500"
        otherProps="mb-8"
        // bgColor="bg-violet-500/10"
      />
      <div ref={consoleRef} id="section-1" className="px-4 mt-10 lg:px-8">
        <div
          className="rounded-lg 
                border 
                w-full 
                p-4 
                px-3 
                md:px-6 
                focus-within:shadow-sm
            "
        >
          <Progress
            indicatorColor="bg-black"
            value={(progress * 100) / numFiles}
            className="w-full"
          />
          {/*Make a loading component that renders each time, and push to array only after confirmation is sent from backend*/}

          <div className="fakeScreen">
            <p className="line1">
              $ Mp3-Automated-Tag-Editor v1.3.0
              <span className="cursor1">_</span>
            </p>
            {[...checks].map((entry) => {
              let key = entry[0];
              let value = entry[1];
              return (
                <CheckItem
                  key={value.id}
                  message={value.message}
                  lineType={value.lineType}
                  messageOptional={value.messageOptional}
                  result={value.result}
                />
              );
            })}
            {initializeSuccess ? <Separator className="my-2" /> : null}
            {[...hashmap].map((entry) => {
              let key = entry[0];
              let value = entry[1];
              return (
                <TerminalItem
                  key={value.id}
                  id={value.id}
                  status={value.status}
                  path={value.songName}
                  statusCode={value.statusCode}
                  errorMessage={value.errorMessage}
                  percentage={value.accuracy}
                />
              );
            })}
            {scrapeResult ? <Separator className="my-2" /> : null}
            {scrapeResultRef.current && results ? (
              <ResultItem
                lineType={3}
                resultStatus={results.status.toString()}
                resultStatusCode={results.statusCode}
                resultErrorMsg={results.errorMessage}
                resultOverallAccuracy={results.overallAccuracy}
                resultTotalFiles={results.totalFiles}
                resultProcessedFiles={results.processedFiles}
                resultSession={results.sessionName}
                timeElapsed={results.time}
              />
            ) : null}
            <p className="line4">
              &gt;<span className="cursor4">_</span>
            </p>
            <div id="snap"></div>
            
          </div>
          {/* <Button onClick={() => { handleChangeInScrape() }} className="col-span-12 lg:col-span-3 w-full" type="submit" size="icon">
            Cancel
          </Button> */}
          {/* {scrapeResult ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Proceed</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Save Scrape Session</DialogTitle>
                    <DialogDescription>
                      Save the current scrape session! All of the obtained data will be stored for further use.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="scrape_name" className="text-right">
                        Save Scrape as:
                      </Label>
                      <Input
                        id="scrape_name"
                        value="Scrape Session 1"
                        className="col-span-3"
                      />
                    </div>                  
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save Session</Button>
                    <Button type="submit">Proceed to Edit</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : null} */}
            {
              scrapeResult ? <center><Button onClick={goToEditScreen} style={{marginTop: "15px"}} variant="outline2">Proceed to Edit Page</Button></center> : null
            }
        </div>
      </div>
    </GlobalHotKeys>
  );
};

export default Terminal;
