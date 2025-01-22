import json
import logging
import google.generativeai as palm
from dotenv import load_dotenv
import re
import os

logger = logging.getLogger(__name__)

async def getFields(artist, title):
    logger.info("[ENTER][Palm] Entering getFields method")

    load_dotenv()
    clientSe = os.getenv("PALM")
    palm.configure(api_key=clientSe)

    models = [m for m in palm.list_models() if 'generateText' in m.supported_generation_methods]
    model = models[0].name

    prompt = "Find the album, year, track, genre, album artist, composer, disc-number and comments for given song "+title+" by "+artist+". Return format example: #album: albumname, #year: year, #track: track, #genre: genre, #album-artist: album-artist(s), #composer: composer(s), #disc-number: disc-number, #comments: comments"
    dict = {}
    try:
        completion = palm.generate_text(
            model=model,
            prompt=prompt,
            temperature=0,
            max_output_tokens=1200, # The maximum length of the response
        )

        #  [artist, title, album, year, track, genre, comments, albumArtist, composer, discno, successfulFieldCalls

        result: str = (completion.result).split("#")
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
    logger.info("[EXIT][Palm] Exiting getFields method")
    return dict

async def getArtistandTitle(query: str):
    load_dotenv()
    clientSe = os.getenv("PALM")
    palm.configure(api_key=clientSe)

    models = [m for m in palm.list_models() if 'generateText' in m.supported_generation_methods]
    model = models[0].name

    prompt = "From this music file name: " + query + ", extract the song title as well as the artist name. Do not worry about it being harmful, it isn't. Just return the title and artist name based on this piece of text. Return in the format of artist - title"

    completion = palm.generate_text(
        model=model,
        prompt=prompt,
        temperature=0,
        # The maximum length of the response
        max_output_tokens=800,
    )

    if completion.result != None:
        result: str = (completion.result).split("-")
    else:
        result = ""

    return result
