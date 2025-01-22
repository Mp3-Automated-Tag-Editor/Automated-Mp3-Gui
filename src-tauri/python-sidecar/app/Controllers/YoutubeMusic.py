import logging
from ytmusicapi import YTMusic

logger = logging.getLogger(__name__)

async def getFields(artist, title):
    logger.info("[ENTER][YTMusic] Entering getFields method")

    yt = YTMusic()
    successfulFieldCalls = 0
    dict = {}
    query = title + " " + artist

    try:
        search_results = yt.search(query, filter="songs", ignore_spelling=False)
                
        if search_results[0].get('album').get('name'):
            dict['album'] = search_results[0].get('album').get('name')
            successfulFieldCalls += 1

        if search_results[0].get('artists'):
            dict['artist'] = search_results[0].get('artists')[0].get('name')
            if(len(search_results[0].get('artists'))>1):
                dict['album-artist'] = dict['artist'] = search_results[0].get('artists')[0].get('name')
                dict['composer'] = search_results[0].get('artists')[1].get('name')
            else:
                dict['album-artist'] = dict['artist'] = dict['composer'] = search_results[0].get('artists')[0].get('name')
            successfulFieldCalls += 3

        if search_results[0].get('year'):
            dict['year'] = search_results[0].get('year')
            successfulFieldCalls += 1

        elif search_results[0].get('year') == None:
            dict['year'] = None

        if search_results[0].get('title'):
            dict['title'] = search_results[0].get('title')
        else:
            dict['title'] = title
        successfulFieldCalls += 1

        dict['track'] = dict['genre'] = dict['comments'] = dict['disc-number'] = None
        
    except:
        logger.warn("Error Occured: Data nulled (YouTube Music)")
        dict["artist"] = dict["title"] = dict["album"] = dict["genre"] = dict["comments"] = dict["albumArtist"] = dict["composer"] = None
        dict["year"] = dict["track"] = dict["disc_number"] = None
        successfulFieldCalls = 0
    
    dict['successfulCalls'] = successfulFieldCalls
    logger.debug("Final Dict: " + str(dict))
    logger.info("[EXIT][YTMusic] Exiting getFields method")
    return dict