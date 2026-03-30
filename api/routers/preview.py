"""Preview Router — OpenGraph metadata extraction for link previews."""

from fastapi import APIRouter, HTTPException, Query

from api.services.og_preview import OGPreview, fetch_og_preview

router = APIRouter(prefix="/api/preview", tags=["preview"])


@router.get(
    "",
    response_model=OGPreview,
    summary="Extract OpenGraph preview for a URL",
    description="Fetches a URL and returns og:title, og:description, og:image and fallbacks. "
    "Useful for link previews in the content calendar.",
)
async def get_preview(
    url: str = Query(..., description="URL to extract OpenGraph metadata from"),
):
    try:
        return await fetch_og_preview(url)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not fetch preview: {exc}")
