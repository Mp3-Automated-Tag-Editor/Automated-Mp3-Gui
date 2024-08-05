"use client";

import { Info } from "lucide-react";
import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

const Start = () => {
  return (
    <div>
      <Heading
        title="About Us"
        description="Meet the team behind Automated Mp3 Tag Editor!"
        icon={Info}
        iconColor="text-grey"
        otherProps="mb-8"
      // bgColor="bg-violet-500/10"
      />
      <div className="px-4 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 my-4 px-16">
          <div className="col-span-2">
            <Image
              // src={formData.imageSrc ? base64string : "/public/def-album-art.png"}
              src={"/about-us.JPG"}
              width={300}
              height={300}
              alt="Picture of the author"
              className="border border-black"

            />
          </div>
          <Card className="col-span-5">
            <CardHeader>
              <CardTitle>Meet The Team</CardTitle>
              <CardDescription>
                <ul>
                  <li>Jonathan Rufus Samuel - DevOps & Infrastructure Software Engineer - CERN</li>
                  <li>Shivansh Sahai - SDE 1 - HSBC</li>
                  <li>Advisor: Swarnlatha P - Senior Professor - VIT Vellore</li>
                </ul>
              </CardDescription>

            </CardHeader>
            <CardContent className="pl-6">
              <p className="text-l text-foreground">
                Hey there! Thanks for using the Automated Mp3 Tag Editor, by JRS Studios.
                This project was once a simple python CLI tool, developed to complete a Software
                Engineering course. 3 years later, it has been a full-stack Rust based Desktop
                Application with an ML powered backend, able to handle offline music. We have
                grand plans, including developing a mobile app to support the music that is
                identified here. So thank you once again for using our app. Please feel free
                to contribute, and reach out to us for suggestions as well as Bug reports. Keep Scraping!
              </p>
            </CardContent>
            {/* <center><Button onClick={() => window.location = 'mailto:yourmail@domain.com'}>Write To Us</Button></center> */}
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 my-4 px-16">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Downloads
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">184</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total GitHub Stars
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
            </CardContent>
          </Card>
          <Card>

          </Card>
          <Card>
            
          </Card>
        </div>

      </div>
    </div>
  );
}

export default Start;

