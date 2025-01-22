import logging
import requests

logger = logging.getLogger(__name__)

async def getFields(artist, title):
    logger.info("[ENTER][Itunes] Entering getFields method")

    artist = artist.replace(" ", "+")
    title = title.replace(" ", "+")

    base_url = (
        "https://itunes.apple.com/search?media=music&term=" + title + "+" + artist
    )
    dict = {}  # an empty dictionary to hold all the metadata fields
    successfulFieldCalls = 0
    response = requests.get(base_url)

    try:
        res = response.json()
        data = res["results"][0] # Top most result

        album = data["collectionName"]
        if album:
            dict["album"] = album
            successfulFieldCalls += 1

        release_date = data["releaseDate"]
        if release_date:
            dict["year"] = release_date[0:4]
            successfulFieldCalls += 1

        track = data["trackCensoredName"]
        if track:
            dict["title"] = track
            successfulFieldCalls += 1

        album_artist = data["artistName"]
        if album_artist:
            dict["album-artist"] =  dict["artist"] = album_artist
            successfulFieldCalls += 2

        genre = data["primaryGenreName"]
        if genre:
            dict["genre"] = genre
            successfulFieldCalls += 1

        disc_number = data["discNumber"]
        if disc_number:
            dict["disc-number"] = disc_number
            successfulFieldCalls += 1

        track_Number = data["trackNumber"]
        if track_Number:
            dict["track"] = track_Number
            successfulFieldCalls += 1

    except:
        logger.warn("Error Occured: Data nulled (ITunes)")
        dict["artist"] = dict["title"] = dict["album"] = dict["genre"] = dict["comments"] = dict["albumArtist"] = dict["composer"] = None
        dict["year"] = dict["track"] = dict["disc_number"] = None
        successfulFieldCalls = 0

    # If you still want to print 'data', do it here within the else block
    dict["successfulCalls"] = successfulFieldCalls
    logger.debug("Final Dict: " + str(dict))
    print(dict)
    logger.info("[EXIT][ITunes] Exiting getFields method")
    return dict
