"use client";

import { Download, Github, Info, ScrollText, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TEAM } from "@/constants";
import { Heading } from "@/components/heading";

const AboutUs = () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Heading
        title="About Us"
        description="Meet the team behind Automated Mp3 Tag Editor"
        icon={Info}
        iconColor="text-muted-foreground"
        otherProps="mb-8"
      />

      <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-4 pb-8 lg:px-8">
        {/* Intro: photo + story */}
        <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-8">
          <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-xl border bg-muted shadow-sm lg:mx-0">
            <Image
              src="/about-us.JPG"
              alt="JRS Studios team"
              fill
              unoptimized
              className="object-cover"
              sizes="280px"
              priority
            />
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              JRS Studios
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Automated Mp3 Tag Editor
            </h3>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <p>
                Thanks for using the Automated Mp3 Tag Editor. This project
                began as a simple Python CLI tool for a Software Engineering
                course.
              </p>
              <p>
                Three years later, it has grown into a full-stack Rust desktop
                app with an ML-powered backend, built to handle offline music
                libraries. We have more planned—including a mobile companion for
                the music identified here.
              </p>
              <p>
                Thank you for using the app. Feel free to contribute, suggest
                ideas, or report bugs. Keep scraping!
              </p>
            </div>
          </div>
        </section>

        {/* Team */}
        <section>
          <h3 className="mb-3 text-lg font-semibold tracking-tight">
            Meet the team
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((person) => (
              <div
                key={person.name}
                className="rounded-xl border bg-card p-4 shadow-sm"
              >
                <p className="font-semibold tracking-tight">{person.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {person.role}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {person.org}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Metrics & links */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Downloads
              </p>
              <Download className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">
              18
            </p>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                GitHub stars
              </p>
              <Star className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">
              15
            </p>
          </div>

          <Link
            href="https://github.com/Mp3-Automated-Tag-Editor"
            target="_blank"
            rel="noreferrer"
            className={cn(
              "group flex flex-col justify-between rounded-xl border bg-card p-4 shadow-sm",
              "transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Source
              </p>
              <Github className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
            </div>
            <p className="mt-2 text-sm font-semibold tracking-tight">
              View on GitHub
            </p>
          </Link>

          <Link
            href="https://doi.org/10.4018/978-1-6684-8098-4.ch012"
            target="_blank"
            rel="noreferrer"
            className={cn(
              "group flex flex-col justify-between rounded-xl border bg-card p-4 shadow-sm",
              "transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Publication
              </p>
              <ScrollText className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
            </div>
            <p className="mt-2 text-sm font-semibold tracking-tight">
              Read the chapter
            </p>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
