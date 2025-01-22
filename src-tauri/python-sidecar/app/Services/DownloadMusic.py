from fastapi import HTTPException
import yt_dlp
import os

async def downloadMusicFiles(link: str):
    url = link
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': 'downloads/%(title)s.%(ext)s',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '320',
        }],
        'noplaylist': True
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(url, download=True)
            file_path = ydl.prepare_filename(info_dict)
            file_path = os.path.splitext(file_path)[0] + ".mp3"
            return {"filename": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))