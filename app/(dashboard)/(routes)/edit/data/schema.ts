import { z } from "zod"

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const songSchema = z.object({
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

export type Song = z.infer<typeof songSchema>

