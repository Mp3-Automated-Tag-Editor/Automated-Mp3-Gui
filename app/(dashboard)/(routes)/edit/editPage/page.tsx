"use client";

import { Pencil } from "lucide-react";
import { Heading } from "@/components/heading";

import { z } from "zod"

import songDate from '../data/song.json'
import { songSchema, Song } from "../data/schema"
import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";
import { useSearchParams } from "next/navigation";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import Loading from "@/components/loading";
import { Button } from "@/components/ui/button";
import { SessionProvider } from "@/components/context/SessionContext/SessionContext";

const fetchSongs = async (directory: string | null, pageNo: number | null, pageSize: number) => {
  try {
    // const songs = await invoke('read_music_directory_paginated', { directory: directory, pageNumber: 0, pageSize: 10 });
    const songs = await invoke('read_music_directory', { directory: directory });
    console.log(songs)
    return z.array(songSchema).parse(songs);
  } catch (error) {
    console.error("Failed to fetch Songs:", error);
    return [];
  }
};

const fetchSessionData = async (session: string | null, pageNo: number | null, pageSize: number) => {
  try {
    // const songs = await invoke('read_music_directory_paginated', { directory: directory, pageNumber: 0, pageSize: 10 });
    const sessions = await invoke('retrieve_sessions_data', { session: session });

    return z.array(songSchema).parse(sessions);
  } catch (error) {
    console.error("Failed to fetch Songs:", error);
    return [];
  }
};

const Edit = () => {
  const [songs, setSongs] = useState<Array<any>>([]);
  const [sessionData, setSessionData] = useState<Array<any>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const searchParams = useSearchParams();
  const directory: string | null = searchParams.get('directory');
  const pageNo: string | null = searchParams.get('pageNo');
  const pageSize: string | null = searchParams.get('pageSize');
  const totalSongs: string | null = searchParams.get('totalSongs');
  const session: string | null = searchParams.get('session');
  const accuracy: string | null = searchParams.get('accuracy');

  useEffect(() => {
    const loadSongs = async () => {
      setLoading(true);
      const fetchedSongs = await fetchSongs(directory, Number(pageNo), Number(pageSize));
      setSongs(fetchedSongs);
      //       setSongs(prevSongs => [...prevSongs, ...fetchedSongs]);
      setLoading(false);
    };

    if (session != null) {
      const loadSessions = async () => {
        const fetchedSessionData = await fetchSessionData(session, Number(pageNo), Number(pageSize));
        setSessionData(fetchedSessionData);
      };
      loadSessions();
    }
    loadSongs();
  }, []);

  async function updateSong(filePath: string, updatedSong: Song) {
    console.log("Updating Song: ", updatedSong)
    // Call Rust update
    const val: [boolean, string] = await invoke('update_music_file', { path: filePath, song: updatedSong });
    if(val[0] == false) {
      console.log("Save Failed")
      return val
    }

    // Update current songs
    setSongs((prevSongs) =>
      prevSongs.map((song) =>
        song.file === filePath ? { ...song, ...updatedSong } : song
      )
    );

    console.log("Save Successful")
    return val
  }

  return (
    <div>
      {loading ? <Loading msg="Loading your Music Database..." /> :
        <div>
          <Heading
            title={session!=null ? "Edit Session" : "Edit Music Files"}
            description={session!=null ? `Manually edit Music Files in Directory: ${directory} (Session: ${session})` : `Manually edit Music Files in Directory: ${directory}`}
            icon={Pencil}
            iconColor="text-orange-700"
            otherProps="mb-4"
          // bgColor="bg-violet-500/10"
          />
          <div className="px-4 lg:px-8 h-full">
            <SessionProvider sessionData={session != null && session?.length>0 ? sessionData : songs} sessionName={session ? session : ""}>
              <DataTable directory={directory ? directory : ""} functions={{ updateSong }} data={songs} columns={columns} totalSongs={Number(totalSongs)} sessionName={session ? session : ""} overallAccuracy={accuracy ? accuracy : ""} />
            </SessionProvider>
          </div>
        </div>
      }

    </div>
  );
}

export default Edit;

