import logging
from spotipy.oauth2 import SpotifyClientCredentials
from dotenv import load_dotenv
import spotipy
import os
import datetime

logger = logging.getLogger(__name__)

async def getFields(artist, title):
    logger.info("[ENTER][Spotify] Entering getFields method")
    load_dotenv()
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SE")

    client_credentials_manager = SpotifyClientCredentials(
            client_id, client_secret)

    successfulFieldCalls = 2 # artist and title
    dict = {}
    dict['composer'] = None # unavailable in spotipy
    query = title + " " + artist

    try:
        spotify = spotipy.Spotify(client_credentials_manager=client_credentials_manager)
        res1 = spotify.search(query, limit=1)
        res2 = spotify.search(artist)
        
        track = res2['tracks']['items'][0]
        artistData = spotify.artist(track["artists"][0]["external_urls"]["spotify"])
        results = res1['tracks']['items'][0]  # Find top result

        # Checks
        album = results['album']['name']  # Parse json dictionary
        if album:
            dict['album'] = album
            successfulFieldCalls += 1

        artist = results['album']['artists'][0]['name']
        if artist:
            dict['album-artist'] = dict["artist"] = artist
            successfulFieldCalls += 2

        song_title = results['name']
        if song_title:
            dict['title'] = song_title
            # successfulFieldCalls += 1

        year = results['album']["release_date"]
        format = r'%Y-%m-%d'
        dt = datetime.datetime.strptime(year, format)
        if year:
            dict['year'] = dt.year
            successfulFieldCalls += 1

        comments = "spotify: " + results['album']['artists'][0]['external_urls']['spotify'] + ", uri: " + results['album']['uri']
        if comments:
            dict['comments'] = comments
            successfulFieldCalls += 1

        disc_number = results['disc_number']
        if disc_number:
            dict['disc-number'] = disc_number
            successfulFieldCalls += 1

        track_number = results['track_number']
        if track_number:
            dict['track'] = track_number
            successfulFieldCalls += 1

        genre = artistData["genres"]
        if genre:
            dict['genre'] = genre
            successfulFieldCalls += 1

        #album_art = results['album']['images'][0]['url']
        
    except:
        logger.warn("Error Occured: Data nulled (Spotify)")
        dict["artist"] = dict["title"] = dict["album"] = dict["genre"] = dict["comments"] = dict["albumArtist"] = dict["composer"] = None
        dict["year"] = dict["track"] = dict["disc_number"] = None
        successfulFieldCalls = 0

    dict['successfulCalls'] = successfulFieldCalls
    logger.debug("Final Dict: " + str(dict))
    logger.info("[EXIT][Spotify] Exiting getFields method")
    return dict