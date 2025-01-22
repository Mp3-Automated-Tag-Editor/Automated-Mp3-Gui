from Entities.SearchParams import SearchParams 
from Services import MetaData
from Services import AlbumArt
from Services import DownloadMusic
from Settings.logging_config import setup_logging

# app = FastAPI()

# # Initialize logging
# logger = setup_logging()

# @app.get('/health', status_code=200)
# async def root():
#     logger.info("Health Endpoint Triggered")
#     return {"status": 200, 'message': 'Mp3 Automated Tag Editor up and running!!!'}

# @app.post('/api/metadata/{fileName}')
# async def getMetadata(fileName: str, params: SearchParams):
#     logger.info("GET Metadata Endpoint Triggered")
#     return await MetaData.getMetadata(fileName, params)

# @app.get('/api/album/{albumName}')
# async def getAlbumArt(albumName: str, artistName: str, res: int):
#     logger.info("GET Album Art Endpoint Triggered")
#     return await AlbumArt.getAlbumArt(albumName, artistName, res)

# @app.post("/download")
# async def download_audio(link: str):
#     logger.info("Download Music Files Endpoint Triggered")
#     return await DownloadMusic.downloadMusicFiles(link)

def check_health():
    # Health check function
    return {"status": 200, 'message': 'Mp3 Automated Tag Editor up and running!!!'}

def get_metadata(file_name: str, params: dict):
    search_params = SearchParams(**params)
    return MetaData.getMetadata(file_name, search_params)

def get_album_art(album_name: str, artist_name: str, resolution: int):
    return AlbumArt.getAlbumArt(album_name, artist_name, resolution)

def download_audio(link: str):
    return DownloadMusic.downloadMusicFiles(link)

def test():
    return "Hello World"