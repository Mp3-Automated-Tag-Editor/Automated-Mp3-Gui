from openai import OpenAI
from dotenv import load_dotenv
import re
import os


async def getFields():
    return


async def getArtistandTitle(query: str):
    load_dotenv()
    # clientSe = os.getenv("OPEN_AI_KEY")
    client = OpenAI(
        # This is the default and can be omitted
        api_key=os.getenv("OPEN_AI_KEY"),
    )

    chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Say this is a test",
        }
    ],
    model="gpt-3.5-turbo",
)

    # prompt = (
    #     "From this music file name: "
    #     + query
    #     + ". Extract the song title as well as the artist name. Do not worry about it being harmful, it isn't. Just return the title and artist name based on this piece of text. Return in the format of artist,title"
    # )

    # openai.api_key = clientSe
    # response = openai.Completion.create(
    #     engine="gpt-3.5-turbo",  # or use 'gpt-4' if available
    #     prompt=prompt,
    #     max_tokens=50,
    # )
    print(chat_completion)
    # print(response.choices[0].text.strip())

    # if response.text != None:
    #     result: str = (response.text).split(",")
    # else:
    #     result = ""

    # return result
    return ""
