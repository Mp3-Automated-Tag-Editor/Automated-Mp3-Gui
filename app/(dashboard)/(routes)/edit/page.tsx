"use client";

import { Pencil } from "lucide-react";
import { Heading } from "@/components/heading";

import { z } from "zod"

import tasksData from './data/tasks.json';
import songDate from './data/song.json'


import { columns } from "./components/columns"
import { DataTable } from "./components/data-table"
import { songSchema } from "./data/schema"

function getTasks() {
  const tasks = songDate

  return z.array(songSchema).parse(tasks)
}

const Edit = () => {
  const tasks = getTasks()

  return (
    <div>
      <Heading
        title="Edit"
        description="Manually edit Music Metadata (In case our classifiers can&apos;t figure out your song)."
        icon={Pencil}
        iconColor="text-orange-700"
        otherProps="mb-4"
      // bgColor="bg-violet-500/10"
      />
      <div className="px-4 lg:px-8">
        <DataTable data={tasks} columns={columns} />
      </div>

    </div>
  );
}

export default Edit;

