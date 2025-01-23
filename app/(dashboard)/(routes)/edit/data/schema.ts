import { z } from "zod"

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const songScrapeSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  artist: z.string(),
  title: z.string(),
  album: z.string(),
  year: z.number(),
  track: z.number(),
  genre: z.string(),
  comments: z.string(),
  albumArtist: z.string(),
  composer: z.string(),
  discno: z.number(),
  imageSrc: z.string(),
  percentage: z.number(),
  status: z.string()
})

export const songSchema = z.object({
  id: z.string(),
  file: z.string(),
  artist: z.string(),
  title: z.string(),
  album: z.string(),
  path: z.string(),
  albumArtist: z.string(),
  year: z.number(),
  track: z.number(),
  genre: z.string(),
  comments: z.string(),
  composer: z.string(),
  discno: z.number(),
  imageSrc: z.string(),
  percentage: z.number(),
  status: z.string()
})

export const sessionSchema = z.object({
  id: z.string(),
  table_name: z.string(),
  date: z.string(),
  session_number: z.number(),
  custom_name: z.string(),
  path: z.string(),
  total_files: z.number(),
  processed_files: z.number(),
})

export type SongScrape = z.infer<typeof songScrapeSchema>
export type Song = z.infer<typeof songSchema>

