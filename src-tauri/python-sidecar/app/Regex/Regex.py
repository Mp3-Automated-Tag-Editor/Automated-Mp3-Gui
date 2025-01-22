import google.generativeai as palm
from dotenv import load_dotenv
import os

from Controllers import Shazam
from Controllers import Palm
from Controllers import Gemini
from Controllers import Groq

async def getArtistandTitleFromControllers(query: str):
    artistnames = []
    titles = []

    result = await Palm.getArtistandTitle(query)
    artistnames.append(result[0].strip())
    titles.append(result[1].strip())

    result = await Gemini.getArtistandTitle(query)
    artistnames.append(result[0].strip())
    titles.append(result[1].strip())

    result = await Groq.getArtistandTitle(query)
    artistnames.append(result[0].strip())
    titles.append(result[1].strip())
    
    # result = await Shazam.getArtistandTitle(query)
    # artistnames.append(result[0].strip())
    # titles.append(result[1].strip())

    print(titles)
    print(artistnames)

    return result