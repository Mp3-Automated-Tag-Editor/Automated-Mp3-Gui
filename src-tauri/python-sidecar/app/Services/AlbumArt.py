from cachetools import TTLCache
from fastapi import HTTPException
from fastapi.responses import JSONResponse
from Entities.SearchParams import SearchParams
from Services.classifier import classifier
from Image import GetAlbumArt

cache = TTLCache(maxsize=4096, ttl=86400)

# Avenues for getting Album Art
# - Genius
# - Spotify

async def getAlbumArt(albumName: str, artistName: str, res: int):
    key = "getAlbumArt"+albumName
    result = cache.get(key)
    if result is not None:
        return JSONResponse(content={"result": result, "from_cache": True})
    data = await GetAlbumArt.getAlbumArt(albumName, artistName, res)
    cache[key] = data
    return JSONResponse(content={"result": data, "from_cache": False})