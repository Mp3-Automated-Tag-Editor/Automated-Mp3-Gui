import json
import logging
from groq import Groq
from dotenv import load_dotenv
import re
import os

logger = logging.getLogger(__name__)

async def getFields(artist, title):
    logger.info("[ENTER][Groq] Entering getFields method")
    load_dotenv()
    client = Groq(
        api_key=os.getenv("GROQ_API_KEY"),
    )

    prompt = "Find the album, year, track, genre, album artist, composer, disc-number and comments for given song "+title+" by "+artist+". Return format example: #album: albumname, #year: year, #track: track, #genre: genre, #album-artist: album-artist(s), #composer: composer(s), #disc-number: disc-number, #comments: comments. Do not add any other text except for the given pattern."
    dict = {}
    try:
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama3-8b-8192",
        ).choices[0].message.content

        #  [artist, title, album, year, track, genre, comments, albumArtist, composer, discno, successfulFieldCalls

        result: str = (response).split("#") # type: ignore
        successfulFieldCalls = 0

        for i, s in enumerate(result):
            str = re.sub(',', '', result[i])
            str = str.strip()
            idx = str.rfind(":")
            if idx == -1: continue
            key = str[:idx]
            value = str[idx+2:]
            dict[key]=value
            if(value=='None' or value=='' or value=='NaN'): continue
            successfulFieldCalls += 1

        dict["successfulCalls"]: int =successfulFieldCalls+2 #add artist name and title
        dict["artist"] = artist
        dict["title"] = title
    except:
        # Print an error message if the request was not successful
        logger.warn("Error Occured: Data nulled (Groq)")
        dict["artist"] = dict["title"] = dict["album"] = dict["genre"] = dict["comments"] = dict["albumArtist"] = dict["composer"] = None
        dict["year"] = dict["track"] = dict["disc_number"] = None
        successfulFieldCalls = 0

    logger.debug("Final Dict: " + json.dumps(dict))
    logger.info("[EXIT][Groq] Exiting getFields method")
    return dict


async def getArtistandTitle(query: str):
    load_dotenv()
    client = Groq(
        api_key=os.getenv("GROQ_API_KEY"),
    )

    prompt = (
        "From this music file name: "
        + query
        + ". Extract the song title as well as the artist name. Do not add anything else to output. Just return the title and artist name based on this piece of text. Return in the format of artist - title"
    )

    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        model="llama3-8b-8192",
    )

    if chat_completion.choices[0].message.content != None:
        result: str = (chat_completion.choices[0].message.content).split("-")
    else:
        result = ""

    return result
