import logging
from cachetools import TTLCache
from fastapi import HTTPException
from fastapi.responses import JSONResponse
from Entities.SearchParams import SearchParams
from Services.classifier import classifier

cache = TTLCache(maxsize=4096, ttl=86400)
logger = logging.getLogger(__name__)

async def getMetadata(fileName: str, params: SearchParams):
    logger.info("[ENTER][getMetadata] Entering getMetadata method")
    use_cache = params.useCache

    if use_cache:
        logger.info("[Cache] Using Cache")
        result = cache.get(fileName)
        if result is not None:
            logger.info("[EXIT][getMetadata] Exiting getMetadata method")
            return JSONResponse(content={"result": result, "from_cache": use_cache})

    data = await classifier(fileName, params.searchParams)
    if use_cache:
        cache[fileName] = data

    logger.info("[EXIT][getMetadata] Exiting getMetadata method")
    return JSONResponse(content={"result": data, "from_cache": use_cache})
