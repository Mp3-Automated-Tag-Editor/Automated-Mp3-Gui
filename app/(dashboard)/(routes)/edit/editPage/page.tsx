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

const fetchSongs = async (directory: string | null, pageNo: number | null, pageSize: number) => {
  try {
    // const songs = await invoke('read_music_directory_paginated', { directory: directory, pageNumber: 0, pageSize: 10 });
    const songs = await invoke('read_music_directory', { directory: directory });

    return z.array(songSchema).parse(songs);
  } catch (error) {
    console.error("Failed to fetch Songs:", error);
    return [];
  }
};

const Edit = () => {
  const [songs, setSongs] = useState<Array<any>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const searchParams = useSearchParams();
  const directory: string | null = searchParams.get('directory');
  const pageNo: string | null = searchParams.get('pageNo');
  const pageSize: string | null = searchParams.get('pageSize');
  const totalSongs: string | null = searchParams.get('totalSongs');
  const session: string | null = searchParams.get('session');

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      const fetchedSongs = await fetchSongs(directory, Number(pageNo), Number(pageSize));
      setSongs(fetchedSongs);
      //       setSongs(prevSongs => [...prevSongs, ...fetchedSongs]);
      setLoading(false);
    };

    loadTasks();
  }, []);

  async function updateSong(filePath: string, updatedSong: Song) {
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
            description={`Manually edit Music Files in Directory: ${directory} (Session: ${session})`}
            icon={Pencil}
            iconColor="text-orange-700"
            otherProps="mb-4"
          // bgColor="bg-violet-500/10"
          />
          <div className="px-4 lg:px-8">
            {/* <Button onClick={() => updateSong("Hello", songs[0])}>Click me</Button> */}
            <DataTable directory={directory ? directory : ""} functions={{ updateSong }} data={songs} columns={columns} totalSongs={Number(totalSongs)} />
          </div>
        </div>
      }

    </div>
  );
}

export default Edit;

