# https://musicbrainz.org/doc/MusicBrainz_API

import os
from dotenv import load_dotenv
import musicbrainzngs
import logging

logger = logging.getLogger(__name__)

async def getFields(artist, title):
    logger.info("[ENTER][MusicBrainz] Entering getFields method")
    load_dotenv()
    musicbrainzngs.set_useragent(os.getenv("SERVER_NAME"), os.getenv("SERVER_VERSION"), os.getenv("SERVER_CONTACT"))
    dict = {}
    try:
        result = musicbrainzngs.search_recordings(artist, recording=title, limit=1)

        # Assuming the first match is the correct one
        recording = result['recording-list'][0]
                
        if dict['artist']:
            dict['artist'] = ', '.join([artist['name'] for artist in recording['artist-credit']])
        
        if dict['title']:
            dict['title'] = recording['title']
        
        
        dict['album'] = recording['release-list'][0]['title'] if 'release-list' in recording else None
        dict['year'] = recording['first-release-date'][:4] if 'first-release-date' in recording else None
        dict['track'] = recording['track-list'][0]['position'] if 'track-list' in recording else None
        dict['genre'] = ', '.join([tag['name'] for tag in recording['tag-list']]) if 'tag-list' in recording else None
        dict['comments'] = recording.get('disambiguation', None)
        dict['albumArtist'] = ', '.join([artist['name'] for artist in recording['artist-credit']])
        dict['composer'] = ', '.join([rel['artist']['name'] for rel in recording.get('artist-relation-list', []) if rel['type'] == 'composer']) if 'artist-relation-list' in recording else None
        dict['discno'] = recording['release-list'][0]['medium-list'][0]['position'] if 'release-list' in recording and 'medium-list' in recording['release-list'][0] else None
        
        # To get the album art, you'll need to query the release directly
        # release_id = recording['release-list'][0]['id']
        # coverart_url = musicbrainzngs.get_image_front(release_id) if release_id else None
        # dict['album_art'] = coverart_url

        return dict
        
    except Exception as e:
        logger.warn("Error Occured: Data nulled (MusicBrainz)" + str(e))
        dict["artist"] = dict["title"] = dict["album"] = dict["genre"] = dict["comments"] = dict["albumArtist"] = dict["composer"] = None
        dict["year"] = dict["track"] = dict["disc_number"] = None
        successfulFieldCalls = 0
    
    dict['successfulCalls'] = successfulFieldCalls
    logger.debug("Final Dict: " + str(dict))
    logger.info("[EXIT][MusicBrainz] Exiting getFields method")
    return dict