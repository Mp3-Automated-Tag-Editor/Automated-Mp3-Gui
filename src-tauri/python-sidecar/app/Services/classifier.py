import logging
from typing import Dict

from cachetools import TTLCache
from fastapi import HTTPException
from Regex.Regex import getArtistandTitleFromControllers
from thefuzz import fuzz, process
import difflib
import numpy as np
from pandas import DataFrame
from scipy.spatial.distance import cdist
from Levenshtein import ratio

import asyncio
from Controllers import Deezer
from Controllers import Discogs
from Controllers import Groq
from Controllers import GooglePage
from Controllers import MusicApi
from Controllers import MusicBrainz
from Controllers import MusicStory
from Controllers import OpenAi
from Controllers import Shazam
from Controllers import Spotify
from Controllers import TheAudioData
from Controllers import TheAudioDB
from Controllers import Gemini
from Controllers import Palm
from Controllers import YoutubeMusic
from Controllers import Itunes
from Controllers import Genius
from pprint import pprint

# Total Number of possible Subqueries = 14 mechanisms * 10 fields = 80
# TOTAL_FIELDS: int = 10
# TOTAL_MECHANISMS: int = len(os.listdir(os.getcwd()+ r"\Controllers")) - 1
# TOTAL_MECHANISMS = 14
# TOTAL_QUERIES: int = TOTAL_MECHANISMS * TOTAL_FIELDS

logger = logging.getLogger(__name__)
cache = TTLCache(maxsize=4096, ttl=86400)

eligible_mechanism_keys = ['spotify', 'palm', 'ytmusic', 'itunes', 'genius', 'groq', 'gemini', 'music-brainz']

async def classifier(query: str, searchParams: Dict[str, bool]):
    logger.info("[ENTER][classifier] Entering classifier method")

    # Checks      
    if all(key in eligible_mechanism_keys for key in searchParams) == False:
        logger.error("[CHECKS][classifier] Keys added do not belong to elligible list")
        raise HTTPException(status_code=400, detail="Keys added do not belong to elligible list")
    elif any(searchParams.values()) == False:
        logger.error("[CHECKS][classifier] All search Params are False")
        raise HTTPException(status_code=400, detail="Error: All search Params are False")

    # First use regex to retreieve values from Regex folder's OpenAi.py
    data = await getArtistandTitleFromControllers(query=query)
    # result = cache.get(query)
    # if result is not None:
    #     data = result
    # else: 
    #     data = await getArtistandTitleFromControllers(query=query)
    #     cache[query] = data

    if len(data) == 1 or data == None:
        logger.error("[CHECKS][classifier] Unable to parse artist and title from file name")
        raise HTTPException(status_code=400, detail="Error: Unable to parse artist and title from file name")

    artist: str = data[0].strip()
    title: str = data[1].strip()

    # Call each mechanism and store fields into array
    # Return type is as follows:
    #  [artist, title, album, year, track, genre, comments, albumArtist, composer, discno, successfulFieldCalls

    # deezer:         str = await Deezer.getFields(artist, title)
    # discogs:        str = await Discogs.getFields(artist, title)
    # ganna:          str = await Ganna.getFields(artist, title)
    # googleSPage:    str = await GooglePage.getFields(artist, title)
    # musicApi:       str = await MusicApi.getFields(artist, title)
    # musicBrainz:    str = await MusicBrainz.getFields(artist, title)
    # musicStory:     str = await MusicStory.getFields(artist, title)
    # oneMusic:       str = await OneMusicApi.getFields(artist, title)
    # openAi:         str = await OpenAi.getFields(artist, title)
    # shazam:         str = await Shazam.getFields(artist, title)
    # audioData:      str = await TheAudioData.getFields(artist, title)
    # audioDb:        str = await TheAudioDB.getFields(artist, title)
    # wikipedia:      str = await Wikipedia.getFields(artist, title)

    # async multi-call
    # results = await asyncio.gather(
    #     Spotify.getFields(artist, title),
    #     Palm.getFields(artist, title),
    #     YoutubeMusic.getFields(artist, title),
    #     Itunes.getFields(artist,title),
    #     Genius.getFields(artist,title)
    # )
    tasks = []

    if searchParams["spotify"] == True:
        tasks.append(Spotify.getFields(artist, title))
    if searchParams["palm"] == True:
        tasks.append(Palm.getFields(artist, title))
    if searchParams["ytmusic"] == True:
        tasks.append(YoutubeMusic.getFields(artist, title))
    if searchParams["itunes"] == True:
        tasks.append(Itunes.getFields(artist,title))
    if searchParams["genius"] == True:
        tasks.append(Genius.getFields(artist,title))
    if searchParams["groq"] == True:
        tasks.append(Groq.getFields(artist,title))
    if searchParams["gemini"] == True:
        tasks.append(Gemini.getFields(artist,title))
    if searchParams["music-brainz"] == True:
        tasks.append(MusicBrainz.getFields(artist,title))

    results = await asyncio.gather(*tasks)

    print(results)

    # #Classify each value for most probable solution
    # album:          str = classify([deezer[2], discogs[2], ganna[2], googleSPage[2], musicApi[2], musicBrainz[2], musicStory[2], oneMusic[2], openAi[2], palm[2] shazam[2], spotify[2], audioData[2], audioDb[2], wikipedia[2]])
    # year:           str = classify([deezer[3], discogs[3], ganna[3], googleSPage[3], musicApi[3], musicBrainz[3], musicStory[3], oneMusic[3], openAi[3], palm[3] shazam[3], spotify[3], audioData[3], audioDb[3], wikipedia[3]])
    # track:          str = classify([deezer[4], discogs[4], ganna[4], googleSPage[4], musicApi[4], musicBrainz[4], musicStory[4], oneMusic[4], openAi[4], palm[4] shazam[4], spotify[4], audioData[4], audioDb[4], wikipedia[4]])
    # genre:          str = classify([deezer[5], discogs[5], ganna[5], googleSPage[5], musicApi[5], musicBrainz[5], musicStory[5], oneMusic[5], openAi[5], palm[5] shazam[5], spotify[5], audioData[5], audioDb[5], wikipedia[5]])
    # comments:       str = classify([deezer[6], discogs[6], ganna[6], googleSPage[6], musicApi[6], musicBrainz[6], musicStory[6], oneMusic[6], openAi[6], palm[6] shazam[6], spotify[6], audioData[6], audioDb[6], wikipedia[6]])
    # albumArtist:    str = classify([deezer[7], discogs[7], ganna[7], googleSPage[7], musicApi[7], musicBrainz[7], musicStory[7], oneMusic[7], openAi[7], palm[7] shazam[7], spotify[7], audioData[7], audioDb[7], wikipedia[7]])
    # composer:       str = classify([deezer[8], discogs[8], ganna[8], googleSPage[8], musicApi[8], musicBrainz[8], musicStory[8], oneMusic[8], openAi[8], palm[8] shazam[8], spotify[8], audioData[8], audioDb[8], wikipedia[8]])
    # discno:         int = classify([deezer[9], discogs[9], ganna[9], googleSPage[9], musicApi[9], musicBrainz[9], musicStory[9], oneMusic[9], openAi[9], palm[9] shazam[9], spotify[9], audioData[9], audioDb[9], wikipedia[9]])
    classifiedResults, totalQueries, totalMechanismCalls = await classify(results)

    calls: int = {}
    # calls["successfulFieldCalls"] = palm.get("successfulCalls")
    calls["successfulMechanismCalls"] = totalMechanismCalls
    calls["totalMechanismCalls"] = len(results)
    calls["successfulQueries"] = totalQueries
    calls["totalQueries"] = len(results) * 10

    # totalCalls = {} # App Side
    # totalCalls["totalFieldCalls"] = 0
    # totalCalls["totalMechanismCalls"] = 0
    # totalCalls["totalSuccessfulCalls"] = 0

    # successfulFieldCalls: int = [deezer[10], discogs[10], ganna[10], googleSPage[10], musicApi[10], musicBrainz[10], musicStory[10], oneMusic[10], openAi[10], shazam[10], spotify[10], audioData[10], audioDb[10], wikipedia[10]]
    # successfulMechanismCalls: int = 14 # Add 1 for every controller that returns atleast 1 successful sub-field
    # successfulQueries: int = 140 # successful mechanism calls for each controller added up

    # return {"artist": artist,"title": title, "palm":palm, "spotify": spotify}

    # return artist, title, album, year, track, genre, comments, albumArtist, composer, discno,successfulFieldCalls, successfulMechanismCalls, successfulQueries
    logger.info("[EXIT][classifier] Exiting classifier method")
    return {
        "artist": artist,
        "title": title,
        "data": classifiedResults,
        "calls": calls,
        # "totalCalls": totalCalls,
    }


async def classify(dict):
    logger.info("[ENTER][classify] Entering classifier.classify method")

    arrays = {
        "artist": [],
        "title": [],
        "album": [],
        "year": [],
        "track": [],
        "genre": [],
        "comments": [],
        "albumArtist": [],
        "composer": [],
        "discno": [],
    }
    finClassifiedResult = {}
    totalSuccesfulCalls = 0
    totalMechanismCalls = 0

    try:
        for x in dict:
            if x == None:
                continue

            if x.get("artist") != None:
                totalSuccesfulCalls += 1
                arrays["artist"].append(x.get("artist"))
            else:
                arrays["artist"].append("")

            if x.get("title") != None:
                totalSuccesfulCalls += 1
                arrays["title"].append(x.get("title"))
            else:
                arrays["title"].append("")

            if x.get("album") != None:
                totalSuccesfulCalls += 1
                arrays["album"].append(x.get("album"))
            else:
                arrays["album"].append("")

            if x.get("year") != None and x.get("year") != '':
                totalSuccesfulCalls += 1
                arrays["year"].append(int(x.get("year")))
            else:
                arrays["year"].append(0)

            if x.get("track") != None and x.get("track") != '':
                totalSuccesfulCalls += 1
                arrays["track"].append(int(x.get("track")))
            else:
                arrays["track"].append(0)

            if x.get("comments") != None:
                totalSuccesfulCalls += 1
                arrays["comments"].append(x.get("comments"))
            else:
                arrays["comments"].append("")

            if x.get("album-artist") != None:
                totalSuccesfulCalls += 1
                arrays["albumArtist"].append(x.get("album-artist"))
            else:
                arrays["albumArtist"].append("")

            if x.get("composer") != None:
                totalSuccesfulCalls += 1
                arrays["composer"].append(x.get("composer"))
            else:
                arrays["composer"].append("")

            if x.get("disc-number") != None and x.get("disc-number") != '':
                totalSuccesfulCalls += 1
                arrays["discno"].append(int(x.get("disc-number")))
            else:
                arrays["discno"].append(0)

            if x.get("genre") != None:
                if type(x.get("genre")) == list:
                    for vals in x.get("genre"):
                        arrays["genre"].append(vals)
                    totalSuccesfulCalls += 1
                else:
                    arrays["genre"].append(x.get("genre"))
                    totalSuccesfulCalls += 1
            else:
                arrays["genre"].append("")

            if x.get("successfulCalls") == 10:
                totalMechanismCalls += 1

        logger.info("[ENTER][classifyArrayFuzzy] Entering Classifier Array method")  
        data = await asyncio.gather(
            classifyArrayFuzzy(arrays.get("artist"), "str", "artist"),
            classifyArrayFuzzy(arrays.get("title"), "str", "title"),
            classifyArrayFuzzy(arrays.get("album"), "str", "album"),
            classifyArrayFuzzy(arrays.get("year"), "num", "year"),
            classifyArrayFuzzy(arrays.get("track"), "num", "track"),
            classifyArrayFuzzy(arrays.get("comments"), "str", "comments"),
            classifyArrayFuzzy(arrays.get("albumArtist"), "str", "albumArtist"),
            classifyArrayFuzzy(arrays.get("composer"), "str", "composer"),
            classifyArrayFuzzy(arrays.get("discno"), "num", "discno"),
            classifyArrayFuzzy(arrays.get("genre"), "str", "genre"),
        )
        logger.info("[EXIT][classifyArrayFuzzy] Exiting Classifier Array method")  

        for tup in data:
            finClassifiedResult[f"{tup[0]}"] = tup[1]

        logger.info("[EXIT][classify] Exiting classifier.classify method")    
        return finClassifiedResult, totalSuccesfulCalls, totalMechanismCalls
    except Exception as e:
        logger.error("[EXIT][classify] Exiting classifier.classify method with error: " + str(e))    
        raise HTTPException(status_code=504, detail=f"Error: {str(e)}")


async def classifyArrayFuzzy(arr, classType, classifierType):
    logger.debug("[ENTER][classifyArrayFuzzy] Entering classifier.classify.classifyArrayFuzzy method for Classifier Type: " + classifierType)  
    # Use fuzzy string searching vie Leviathan String Searching
    arr1 = np.array(arr)

    if classType == "num":
        arr1 = np.array([str(num) for num in arr])

    matrix = cdist(
        arr1.reshape(-1, 1), arr1.reshape(-1, 1), lambda x, y: ratio(x[0], y[0])
    )
    df = DataFrame(data=matrix, index=arr1, columns=arr1)
    classifierOptions = df.sum().to_dict()

    max_key = next(iter(classifierOptions))
    for key in classifierOptions:
        if classifierOptions[key] > classifierOptions[max_key]:
            max_key = key

    value = None
    if classType == "num":
        value = int(max_key)
    else:
        value = max_key

    dict = {"classifierOptions": classifierOptions, "value": value}

    # if classifierType=="genre":
    #     pprint(classifierOptions)

    logger.debug("[EXIT][classifyArrayFuzzy] Exiting classifier.classify.classifyArrayFuzzy method for Classifier Type: " + classifierType)  
    return classifierType, dict


async def classifyArrayVectorStringSimilarity(array, classType, key):
    # Use fuzzy string searching or vector string similarity matching

    # Iterate thru each value check its ratio with the others. One with highest value wins - use fuzzy search
    # - if succesffuly classified - +1 to succesffuly classified
    # - if cannot be determined (like 4, 5) - return suggested value + error code yellow (medium)
    # - if cannot be classified (NaN) - return no value w/ error code red

    # print(array)
    return (array, classType)
