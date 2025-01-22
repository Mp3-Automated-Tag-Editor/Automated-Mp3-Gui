import logging
import requests
import os
from pprint import pprint
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

async def getFields(artist, title):
    logger.info("[ENTER][Genius] Entering getFields method")
    load_dotenv()
    base_url = "https://api.genius.com/search?q=" + title + "+" + artist
    headers = {
        "Authorization": "Bearer " + os.getenv("GENIUS_API_TOKEN"),
    }
    successfields = 0
    response = requests.get(base_url, headers=headers)
    dict = {}
    # Check if the request was successful (status code 200)
    try:
        # Parse and return the JSON response
        res = response.json()
        trial = res["response"]["hits"][0]["result"]
        if trial["primary_artists"][0]["name"]:
            dict["album-artist"] = dict["artist"] = trial["primary_artists"][0]["name"]
            successfields += 2
        if trial["title"]:
            dict["title"] = trial["title"]
            successfields += 1
        if trial["release_date_components"]["year"]:
            dict["year"] = trial["release_date_components"]["year"]
            successfields += 1

    except:
        # Print an error message if the request was not successful
        logger.warn("Error Occured: Data nulled (Genius)")
        dict["artist"] = dict["title"] = dict["album"] = dict["genre"] = dict["comments"] = dict["albumArtist"] = dict["composer"] = None
        dict["year"] = dict["track"] = dict["disc_number"] = None
        successfields = 0

    dict["successfulCalls"] = successfields
    logger.debug("Final Dict: " + str(dict))
    logger.info("[EXIT][Genius] Exiting getFields method")
    return dict
