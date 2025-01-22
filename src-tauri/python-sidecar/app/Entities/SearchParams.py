from pydantic import BaseModel
from typing import Dict

class SearchParams(BaseModel):
    searchParams: Dict[str, bool]
    useCache: bool