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

const fetchSongs = async (directory: string | null, pageNo: number | null, pageSize: number) => {
  try {
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

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      const fetchedSongs = await fetchSongs(directory, Number(pageNo), Number(pageSize));
      setSongs(fetchedSongs);
      setLoading(false);
    };

    loadTasks();
  }, []);

  return (
    <div>
      {loading ? <Loading msg="Loading your Music Database..." /> :
        <div>
          <Heading
            title="Edit"
            description={`Manually edit Music Files in Directory: ${directory}`}
            icon={Pencil}
            iconColor="text-orange-700"
            otherProps="mb-4"
          // bgColor="bg-violet-500/10"
          />
          <div className="px-4 lg:px-8">
            <DataTable data={songs} columns={columns} />
          </div>
        </div>
      }

    </div>
  );
}

export default Edit;

