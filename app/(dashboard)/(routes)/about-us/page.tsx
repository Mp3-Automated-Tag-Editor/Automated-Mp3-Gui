"use client";

import { Info } from "lucide-react";
import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator";
import { FaGithub } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";

interface TechCardProps {
  icon: string; // Assuming `icon` is a path to the image or an SVG
  title: string;
}

const Start = () => {
  
  
  const TechCard: React.FC<TechCardProps> = ({ icon, title }) => (
    <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg shadow-md">
      {/* Circular image holder */}
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-2">
        <img src={icon} alt={title} className="w-16 h-16 rounded-full" /> {/* Adjusted image size */}
      </div>
      {/* Stack name below the image */}
      <p className="text-sm font-semibold text-white text-center">{title}</p>
    </div>
  );
  

  const featureIconStyle = {
    fontSize: '2rem',
  };

  return (
    <div>
      <Heading
        title="About Us"
        description="With Automated Mp3 Tag Editor, our mission is to revolutionize your music library by seamlessly automating the process of metadata tagging. We recognize the challenges posed by songs lacking essential details such as artist names, creation years, album information, and captivating cover art. Our goal is to enhance your music listening experience by ensuring every song in your collection is well-organized and information-rich."
        icon={Info}
        iconColor="text-grey"
        otherProps="mb-8"
      // bgColor="bg-violet-500/10"
      />
      

 
      <div className="px-4 lg:px-8">
         {/* Features Div */}
         <div className="grid grid-cols-2 gap-4">
          
          {/* Feature 1 */}
          <Card className="shadow-lg ">
  <CardContent className="p-0">
    <div className="flex flex-row justify-between items-center p-3">
      <div className="text-blue-500" style={featureIconStyle}>
        {/* Add your feature 1 icon here (e.g., an SVG or Font Awesome icon) */}
        🎵
      </div>
      <div className="ml-4"> {/* Add margin to create space between icon and text */}
        <h3 className="text-lg font-semibold">Data Mining Expertise:</h3>
        <p className="text-gray-600">Our software excels in extracting metadata from various sources, including Google searches, Wikipedia, Spotify databases, and more.</p>
      </div>
    </div>
  </CardContent>
</Card>

          {/* Feature 2 */}

           <Card className="shadow-lg ">
           <CardContent className="p-0">
           <div className="flex flex-row justify-between items-center p-3">
            <div className=" text-green-500" style={featureIconStyle}>
              {/* Add your feature 2 icon here */}
              🔍
            </div>
            <div>
              <h3 className="text-lg font-semibold">Automation Efficiency:</h3>
              <p className="text-gray-600">Our software streamlines the process of data scraping,
               ensuring a swift and hassle-free experience for users</p>
            </div>
          </div>
          </CardContent>
          </Card>
  
          {/* Feature 3 */}
          <Card className="shadow-lg ">
          <CardContent className="p-0">
          <div className="flex flex-row justify-between items-center p-3">
            <div className="text-orange-500" style={featureIconStyle}>
              {/* Add your feature 3 icon here */}
              🔄
            </div>
            <div>
              <h3 className="text-lg font-semibold">Comprehensive Metadata:</h3>
              <p className="text-gray-600">Our software beyond the basics, providing detailed information about artists, 
              creation years, albums, and high-quality cover art.</p>
            </div>
          </div>
          </CardContent>
      </Card>
          {/* Feature 4 */}
          <Card className="shadow-lg pt-2">
          <CardContent className="p-0">
           <div className="flex flex-row justify-between items-center p-3">
            <div className="mr-4 text-purple-500" style={featureIconStyle}>
              {/* Add your feature 4 icon here */}
              🎨
            </div>
            <div>
              <h3 className="text-lg font-semibold">User Friendly Interface</h3>
              <p className="text-gray-600">Our Software is designed with simplicity in mind,
               making it accessible to both tech-savvy users and those new to the world of music management.</p>
            </div>
          </div>
          </CardContent>
          </Card>
        </div>
      </div>
      {/* Team Section */}
      <div className="px-4 lg:px-8 mt-2">
      <h1 className="text-xl font-bold ">Our Team</h1>
        <div className="grid grid-cols-2 gap-4">
        <Card className="shadow-lg pt-2">
  <CardContent className="p-2">
    <div className="grid grid-cols-2 gap-4">
      {/* Left side for the image */}
      <div className="col-span-1 rounded-lg">
        <img src="https://avatars.githubusercontent.com/u/70965472?v=4" alt="Developer" className="w-full h-auto rounded-lg" />
      </div>

      {/* Right side for the description */}
      <div className="col-span-1">
        <p className="text-lg font-bold mb-4">Jonathan R Samuel</p>
        <Separator />

        <p className="text-gray-600">Description of the developer goes here. You can add more details about skills, experience, etc.</p>

        {/* Social media tags at the bottom */}
        <div className="mt-4 flex flex-row justify-start items-start">
          <a href="#" className="text-blue-500 mr-2" target="_blank" rel="noopener noreferrer">
          <FaInstagram />
          </a>
          <a href="#" className="text-blue-500 mr-2" target="_blank" rel="noopener noreferrer">
          <FaLinkedin />
          </a>
          <a href="#" className="text-blue-500" target="_blank" rel="noopener noreferrer">
          <FaGithub />
          </a>
          {/* Add more social media icons as needed */}
        </div>
      </div>
    </div>
  </CardContent>
</Card>
<Card className="shadow-lg pt-2">
<CardContent className="p-2">
    <div className="grid grid-cols-2 gap-4">
      {/* Left side for the image */}
      <div className="col-span-1">
        <img src="https://avatars.githubusercontent.com/u/87913198?v=4" alt="Developer" className="w-full h-auto rounded-lg" />
      </div>

      {/* Right side for the description */}
      <div className="col-span-1">
        <p className="text-lg font-bold mb-4">Shivansh Sahai</p>
        <Separator />

        <p className="text-gray-600">Description of the developer goes here. You can add more details about skills, experience, etc.</p>

        {/* Social media tags at the bottom */}
        <div className="mt-4 flex flex-row justify-start items-start">
          <a href="#" className="text-blue-500 mr-2" target="_blank" rel="noopener noreferrer">
          <FaInstagram />
          </a>
          <a href="#" className="text-blue-500 mr-2" target="_blank" rel="noopener noreferrer">
           <FaLinkedin />
          </a>
          <a href="#" className="text-blue-500" target="_blank" rel="noopener noreferrer">
            <FaGithub />
          </a>
          {/* Add more social media icons as needed */}
        </div>
      </div>
    </div>
  </CardContent>
</Card>

          </div>
      </div>
      <div className="px-4 lg:px-8 mt-2">
      <h1 className="text-xl font-bold dark:text-white">Tech Stack</h1>
  <section className="bg-white p-6 rounded-lg shadow-lg dark:bg-gray-900">
   
    {/* tech stack */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <TechCard icon="https://miro.medium.com/v2/resize:fit:828/format:webp/1*a-HMmQFQNC76zCZBZfFgJg.gif" title="React JS" />
      <TechCard icon="https://static-00.iconduck.com/assets.00/next-js-icon-512x512-zuauazrk.png" title="Next.js" />
      <TechCard icon="https://i.pinimg.com/564x/b4/de/20/b4de205cb6d4e7cad43c2971f780cfd9.jpg" title="javascript" />
      <TechCard icon="https://adware-technologies.s3.amazonaws.com/uploads/technology/thumbnail/31/tailwind.png" title="Tailwind CSS" />
      <TechCard icon="https://e7.pngegg.com/pngimages/856/814/png-clipart-rust-system-programming-language-computer-programming-rusted-miscellaneous-computer-programming.png" title="Rust" />
      <TechCard icon="https://banner2.cleanpng.com/20180329/vke/kisspng-python-high-level-programming-language-language-5abd4cc0d3dc94.7432282215223553928678.jpg" title="Python" />
      {/* Add more TechCard components for additional tech stacks */}
    </div>
  </section>
</div>
<div className="mt-2">
<footer className="bg-gray-800 text-white p-2">
    <div className="container ">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Left section with release date and copyright */}
        <div>
          <p className="text-xs mb-2">Projected Release Date: June, 2023</p>
          <p className="text-xs mb-2">Copyright: © 2023</p>
          <p className="text-xs mb-2">Pages: 310</p>
        </div>

        {/* Middle section with DOIs and ISBNs */}
        <div>
          <p className="text-xs mb-2">DOI: 10.4018/978-1-6684-8098-4</p>
          <p className="text-xs mb-2">DOI URL: <a href="https://doi.org/10.4018/978-1-6684-8098-4.ch012" className="text-blue-500">https://doi.org/10.4018/978-1-6684-8098-4.ch012</a></p>
          <p className="text-xs mb-2">ISBN13: 9781668480984 | ISBN10: 1668480980</p>
          <p className="text-xs mb-2">EISBN13: 9781668481004 | ISBN13 Softcover: 9781668480991</p>
        </div>

        {/* Right section with GitHub links */}
        <div>
          <p className="text-xs mb-2">Organization GitHub: <a href="https://github.com/Mp3-Automated-Tag-Editor" className="text-blue-500">https://github.com/Mp3-Automated-Tag-Editor</a></p>
          <p className="text-xs mb-2">Developer GitHub 1: <a href="https://github.com/SSexpl" className="text-blue-500">https://github.com/SSexpl</a></p>
          <p className="text-xs mb-2">Developer GitHub 2: <a href="https://github.com/JRS296" className="text-blue-500">https://github.com/JRS296</a></p>
        </div>
      </div>
    </div>
  </footer>
  </div>
    </div>
  );
}

export default Start;

