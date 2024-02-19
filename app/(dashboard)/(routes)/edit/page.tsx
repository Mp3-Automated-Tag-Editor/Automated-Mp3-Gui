'use client'
import {Table,  TableBody, TableCaption, TableCell, TableFooter,TableHead,TableHeader,TableRow,} from "@/components/ui/table"
//import { Button } from "@/components/ui/button"
import {useState} from "react";
import songs_list from './song.js';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// {
//   name: "Song 10",
//   artist: "Artist 10",
//   title: "Song 10",
//   album: "Album 10",
//   year: 2015,
//   track: 10,
//   genre: "Genre 10",
//   comments: "Comment 10",
//   albumArtist: "Album Artist 10",
//   composer: "Composer 10",
//   discno: 1,
// }
interface Song {
  name: string;
  artist: string;
  title: string;
  album: string;
  year: number;
  track: number;
  genre: string;
  composer: string;
  discno: number;
  comments :string;
  // Add other properties if needed
}


function Edit() {
const [selectedSong,setSelected]=useState({}); 
const [isClicked,setClicked]=useState(false);
const[isEditing,setEditing]=useState(true);
const [songDetails, setSongDetails] = useState<Song>({
  name: '',
  artist: '',
  title: '',
  album: '',
  year: 0,
  track: 0,
  genre: '',
  composer: '',
  discno: 0,
  comments:""
});
const handleSelect =(item:Song)=>
{
  console.log("item" ,item);
  setClicked(true);
  setSongDetails(item);
  console.log(isClicked);
}
const ToggleButton =()=>
{
  if(isEditing==false)
  setEditing(true);
  if(isEditing==true)
  setEditing(false);
}

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;

   console.log(name , value);
  // If the input is a number, convert the value to a number, otherwise keep it as a string
  const updatedValue = isNaN(Number(value)) ? value : Number(value);

  setSongDetails({ ...songDetails, [name]: updatedValue });
};

const handleChangeSubmit = () => {
  console.log(songDetails);
}

  return (
    <>
    <Table>
      <TableCaption> List of songs .</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]" >File Name</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Artist</TableHead>
          <TableHead>Album</TableHead>
          <TableHead>Year</TableHead>
          <TableHead>Track</TableHead>
          <TableHead>Genre</TableHead>
          <TableHead>Composer</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {songs_list.map((item,index) => (
         <TableRow key={index}>
          
        <TableCell className="font-medium">  
        <Sheet>
        <SheetTrigger asChild>
        <button key={index} onClick= {() => {handleSelect(item)}}>{item.name}</button>
        </SheetTrigger> 
        <SheetContent>
        <Tabs defaultValue="edit">
       <TabsList>
       <TabsTrigger value="edit">Edit</TabsTrigger>
        <TabsTrigger value="view">View</TabsTrigger>
       </TabsList>
    <TabsContent value="edit">
          <>
        <SheetHeader>
          <SheetTitle>
            Edit Song Metadata
          </SheetTitle>
          <SheetDescription>
            Make changes to song metadata manually.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input id="name" value={songDetails.title} name="title" className="col-span-3" onChange={(e) => handleChange(e)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="artist" className="text-right">
              Artist
            </Label>
            <Input id="username" name="artist" value={songDetails.artist} className="col-span-3" onChange={(e) => handleChange(e)}/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="album" className="text-right">
             Album
            </Label>
            <Input id="username" name="album" value={songDetails.album} className="col-span-3" onChange={(e) => handleChange(e)}/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">
             Year
            </Label>
            <Input id="username" name="year" value={songDetails.year} className="col-span-3" onChange={(e) => handleChange(e)}/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="album" className="text-right">
            Track
            </Label>
            <Input id="username" name="track" value={songDetails.track} className="col-span-3" onChange={(e) => handleChange(e)}/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="genre" className="text-right">
             Genre
            </Label>
            <Input id="username" name="genre" value={songDetails.genre} className="col-span-3" onChange={(e) => handleChange(e)}/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="genre" className="text-right">
            Disc No.
            </Label>
            <Input id="username" name="discno" value={songDetails.discno} className="col-span-3" onChange={(e) => handleChange(e)}/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="genre" className="text-right">
          Comments
            </Label>
            <Input id="username" style={{height:"100px"}} name="comments" value={songDetails.comments} className="col-span-3" onChange={(e) => handleChange(e)}/>
          </div>
         
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="submit" onClick={handleChangeSubmit}>Save changes</Button>
          </SheetClose>
        </SheetFooter>
        </>
        </TabsContent>

        <TabsContent value="view">
          <>
          <SheetHeader>
            <SheetTitle>View Song Details</SheetTitle>
            <SheetDescription>
             View Song Details
            </SheetDescription>
          </SheetHeader>
          </>
        </TabsContent>
    </Tabs>

 </SheetContent>
    </Sheet>
        </TableCell>

            <TableCell>{item.title}</TableCell>
            <TableCell>{item.artist}</TableCell>
            <TableCell >{item.album}</TableCell>
            <TableCell >{item.year}</TableCell>
            <TableCell >{item.track}</TableCell>
            <TableCell >{item.genre}</TableCell>
            <TableCell >{item.composer}</TableCell>
            
          </TableRow>
          
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={7}>Completion Percentage</TableCell>
          <TableCell >95.3</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
    
   
   
    </>
  )
  
}
export default Edit;