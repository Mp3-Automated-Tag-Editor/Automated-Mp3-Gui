import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from dotenv import load_dotenv, dotenv_values
import os

async def getAlbumArt(albumName, artistName, res):
    load_dotenv()
    clientId = os.getenv("SPOTIFY_CLIENT_ID")
    clientSe = os.getenv("SPOTIFY_CLIENT_SE")

    client_credentials_manager = SpotifyClientCredentials(clientId, clientSe)
    spotify = spotipy.Spotify(client_credentials_manager=client_credentials_manager)
    try: #Not sure why it does not need async
        results = spotify.search(artistName + " " + albumName, limit=1)
        album_art = results['tracks']['items'][0]['album']['images']
        log = "success"
        status = 200
    except:
        album_art = None
        status = 404
        log = "Metadata Scrape failed (Error Code: 1)"

    # TODO
    # try getting data from other sources
    
    return {"data": album_art, "status":status, "log": log}