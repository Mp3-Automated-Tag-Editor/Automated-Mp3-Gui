from shazamio import Shazam

async def identify_song(file_path: str):
    shazam = Shazam()
    out = await shazam.recognize(file_path)
    return out

# Example usage with asyncio
import asyncio

file_path = "test.mp3"
result = asyncio.run(identify_song(file_path))
print(result)