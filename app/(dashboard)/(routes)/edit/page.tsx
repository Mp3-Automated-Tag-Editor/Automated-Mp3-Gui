"use client";

import { Pencil } from "lucide-react";
import { Heading } from "@/components/heading";

import { useEffect, useState } from "react";

import { z } from "zod"

import { invoke } from '@tauri-apps/api/tauri'
import { sessionSchema } from "./data/schema"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { open } from '@tauri-apps/api/dialog'
import { DialogSessions } from "@/components/dialog";

const fetchSessions = async () => {
  try {
    // const songs = await invoke('read_music_directory_paginated', { directory: directory, pageNumber: 0, pageSize: 10 });
    const sessions = await invoke('retrieve_all_sessions');
    console.log(sessions)
    return z.array(sessionSchema).parse(sessions);
  } catch (error) {
    console.error("Failed to fetch Sessions:", error);
    return [];
  }
};

function formatDate(dateString: string): string {
  const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
  ];

  // Function to determine the day suffix
  function getDaySuffix(day: number): string {
      if (day >= 11 && day <= 13) {
          return "th"; // Special case for 11th, 12th, 13th
      }
      switch (day % 10) {
          case 1: return "st";
          case 2: return "nd";
          case 3: return "rd";
          default: return "th";
      }
  }

  // Split the date string into parts
  const [dayStr, monthStr, year] = dateString.split("-");
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);

  // Get the month name and day suffix
  const monthName = months[month - 1];
  const daySuffix = getDaySuffix(day);

  // Return the formatted date string
  return `${day}${daySuffix} ${monthName}, ${year}`;
}

const Edit = () => {
  const [directory, setDirectory] = useState<any>();
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<{ state: boolean, msg: string }>({ state: false, msg: "" });
  const [errorDetails, setErrorDetails] = useState<{ title: string, data: string, type: number }>({ title: "", data: "", type: 0 })
  const [displaySessions, setDisplaySessions] = useState<boolean>(false);
  const [sessions, setSessions] = useState<Array<any>>([]);
  const [totalSongs, setTotalSongs] = useState<any>(0);

  useEffect(() => {
      const loadTasks = async () => {
        const fetchedSessions = await fetchSessions();
        setSessions(fetchedSessions);
      };
  
      loadTasks();
    }, []);

  const router = useRouter();

  async function selectDirectory() {
    try {
      const selectedPath = await open({
        title: "Select Music Library",
        directory: true,
        multiple: false,
        defaultPath: 'Downloads',
      });

      var msg: [boolean,number] | [boolean,string] = await checkIfDirectoryContainsMusic(selectedPath)
      let dataAsString: string;

      if (msg[0] === false) {
        if (typeof msg[1] === "number") {
          dataAsString = msg[1].toString(); // Convert number to string
        } else {
          dataAsString = msg[1]; // It's already a string
        }
        setErrorDetails({
          title: "Invalid Directory!",
          data: dataAsString,
          type: 1
        })
        setError(true);
        setDirectory("");
      }

      if (selectedPath) {
        setDirectory(selectedPath);
        setError(false);
        setErrorDetails({
          title: "",
          data: "",
          type: 0
        })

        setTotalSongs(msg[1])

        // Go to new EditPage
        // var msg = await invoke('read_music_directory', { directory: selectedPath })
        // console.log(msg)
        router.push(`/edit/editPage?directory=${selectedPath}&totalSongs=${totalSongs}&pageNo=${1}&pageSize=${10}`)
      } else return;

      

    } catch (error) {
      console.log(error);
    }
  }

  async function displaySessionsPage() {
    setDisplaySessions(!displaySessions);
  }

  async function checkIfDirectoryContainsMusic(selectedPath: any) {
    var msg: [boolean,number] | [boolean,string] = await invoke('check_directory', { var: selectedPath })
    return msg;
  }

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
      <div className="px-4 lg:px-8 items-center">
        <div>
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
                <li>1. You can either update Music Metadata manually through the Edit option, or through our scraper.</li>
                <li>2. If you have already completed the scrape process, you can visit previous sessions to further edit your music metadata.</li>
                <li>3. To download indexed database, kindly turn on Developer Settings in <b>Settings</b>, as this is turned off by default.</li>
              </ol>
            </p>
            <div className="text-sm pb-2">Happy Editing!</div>

            <div className="grid
                  grid-cols-12
                  gap-2 py-2">
              <Button onClick={selectDirectory} className="col-span-12 lg:col-span-3 w-full" type="submit" size="icon">Edit Songs</Button>
              <Button variant="outline2" onClick={() => router.push(`/start`)} className="col-span-12 lg:col-span-3 w-full" type="submit" size="icon">Go To Scraper</Button>
              <Button onClick={displaySessionsPage} className="col-span-12 lg:col-span-3 w-full" type="submit" size="icon">Edit Previous Sessions</Button>
            </div>
          </div>
          {displaySessions ? <div>
            {sessions.map((session, index) => (
              <DialogSessions key={index} msg={session.path + " - " + session.total_files + " processed file(s)"} title={formatDate(session.date) + " - Session " + session.session_number} href={`/edit/editPage?directory=${session.path}&totalSongs=${totalSongs}&pageNo=${1}&pageSize=${10}&session=${session.table_name}&accuracy=${session.processed_files/session.total_files*100}`} variant="none" type={false} />
            ))}
          </div> : null}
        </div>
      </div>
    </div>
  );
}

export default Edit;

