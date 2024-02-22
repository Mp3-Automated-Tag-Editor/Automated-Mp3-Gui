"use client";

import { Pencil } from "lucide-react";
import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";

import path from "path"
import { Metadata } from "next"
import Image from "next/image"
import { z } from "zod"

import tasksData from './data/tasks.json';


import { columns } from "./components/columns"
import { DataTable } from "./components/data-table"
import { taskSchema } from "./data/schema"

function getTasks() {
  const data = tasksData

  const tasks = data

  return z.array(taskSchema).parse(tasks)
}

const Edit2 = () => {
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
        {/* <div>
          <div className="rounded-lg 
                border 
                w-full 
                p-4 
                px-3 
                md:px-6 
                focus-within:shadow-sm">
            <>
              <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
                <div className="flex items-center justify-between space-y-2">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
                    <p className="text-muted-foreground">
                      Here&apos;s a list of your tasks for this month!
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UserNav />
                  </div>
                </div> 
                
              </div>
            </>
          </div>
        </div> */}
      </div>

    </div>
  );
}

export default Edit2;

