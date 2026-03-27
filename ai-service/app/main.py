import io
import json
import re
from typing import List, Optional

import clip
import requests
import torch
import torch.nn.functional as f
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel, Field

app = FastAPI(title="Fashion Girl AI Service", version="1.0.0")

MIN_SCORE_THRESHOLD = 0.5
DEFAULT_TOP_K = 5
MAX_TOP_K = 10

STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "to",
    "was",
    "were",
    "with",
}

COLORS = {
    "black",
    "blue",
    "brown",
    "cream",
    "gold",
    "gray",
    "green",
    "maroon",
    "navy",
    "orange",
    "pink",
    "purple",
    "red",
    "silver",
    "white",
    "yellow",
}

CATEGORIES = {
    "blazer",
    "coat",
    "dress",
    "gown",
    "hoodie",
    "jacket",
    "jeans",
    "kurti",
    "pants",
    "shirt",
    "shorts",
    "skirt",
    "suit",
    "sweater",
    "top",
    "trousers",
}

MATERIALS = {
    "chiffon",
    "cotton",
    "denim",
    "lace",
    "leather",
    "linen",
    "nylon",
    "polyester",
    "rayon",
    "satin",
    "silk",
    "velvet",
    "wool",
}

ATTRIBUTE_KEYWORDS = COLORS | CATEGORIES | MATERIALS

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PortfolioItem(BaseModel):
    imageUrl: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)


class MatchJsonRequest(BaseModel):
    imageUrl: str = Field(..., min_length=1)
    text: str = Field(..., min_length=1)
    portfolio: List[PortfolioItem] = Field(..., min_length=1)
    topK: Optional[int] = Field(default=DEFAULT_TOP_K, ge=1, le=MAX_TOP_K)
    threshold: Optional[float] = Field(default=MIN_SCORE_THRESHOLD, ge=0.0, le=1.0)


def _normalize_embedding(embedding: torch.Tensor) -> torch.Tensor:
    return embedding / embedding.norm(dim=-1, keepdim=True)


def _image_from_url(url: str) -> Image.Image:
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return Image.open(io.BytesIO(response.content)).convert("RGB")
    except Exception as exc:
        raise ValueError(f"Unable to load image from URL: {url}") from exc


def _image_from_bytes(raw_bytes: bytes) -> Image.Image:
    try:
        return Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    except Exception as exc:
        raise ValueError("Uploaded image is invalid or unsupported.") from exc


def encode_image(image_input: str | bytes) -> torch.Tensor:
    """Encode an image from path/URL or raw file bytes into a CLIP embedding."""
    model = app.state.clip_model
    preprocess = app.state.clip_preprocess
    device = app.state.device

    if isinstance(image_input, bytes):
        image = _image_from_bytes(image_input)
    elif image_input.startswith("http://") or image_input.startswith("https://"):
        image = _image_from_url(image_input)
    else:
        try:
            image = Image.open(image_input).convert("RGB")
        except Exception as exc:
            raise ValueError(f"Unable to load image from path: {image_input}") from exc

    image_tensor = preprocess(image).unsqueeze(0).to(device)

    with torch.no_grad():
        image_features = model.encode_image(image_tensor)

    return _normalize_embedding(image_features).squeeze(0).cpu()


def encode_text(text: str) -> torch.Tensor:
    """Encode text into a CLIP embedding."""
    model = app.state.clip_model
    device = app.state.device

    text_tokens = clip.tokenize([text]).to(device)

    with torch.no_grad():
        text_features = model.encode_text(text_tokens)

    return _normalize_embedding(text_features).squeeze(0).cpu()


def cosine_similarity_score(a: torch.Tensor, b: torch.Tensor) -> float:
    score = float(f.cosine_similarity(a.unsqueeze(0), b.unsqueeze(0)).item())
    # Map CLIP cosine similarity from [-1, 1] to [0, 1] for easier API consumption.
    return max(0.0, min(1.0, (score + 1.0) / 2.0))


def extract_keywords(text: str) -> set[str]:
    tokens = re.findall(r"[a-zA-Z]+", text.lower())
    clean_tokens = {token for token in tokens if token not in STOPWORDS and len(token) > 2}
    attribute_tokens = {token for token in clean_tokens if token in ATTRIBUTE_KEYWORDS}
    return clean_tokens | attribute_tokens


def compute_dynamic_weights(text: str) -> tuple[float, float]:
    word_count = len([token for token in text.strip().split() if token])
    if word_count < 3:
        return 0.8, 0.2
    return 0.5, 0.5


def compute_keyword_boost(user_keywords: set[str], vendor_keywords: set[str]) -> tuple[float, list[str]]:
    if not user_keywords or not vendor_keywords:
        return 0.0, []

    overlap = user_keywords.intersection(vendor_keywords)
    if not overlap:
        return 0.0, []

    matched_keywords = sorted(overlap)

    if len(overlap) >= 2:
        return 0.1, matched_keywords
    return 0.05, matched_keywords


def calculate_final_score(
    image_score: float,
    text_score: float,
    keyword_boost: float,
    image_weight: float,
    text_weight: float,
) -> float:
    weighted = (image_weight * image_score) + (text_weight * text_score)
    return max(0.0, min(1.0, weighted + keyword_boost))


@app.on_event("startup")
def load_model_once() -> None:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, preprocess = clip.load("ViT-B/32", device=device)
    model.eval()

    app.state.device = device
    app.state.clip_model = model
    app.state.clip_preprocess = preprocess


@app.get("/health")
def health_check() -> str:
    return "AI service running"


def _validate_match_payload(text: Optional[str], portfolio: Optional[List[PortfolioItem]]) -> None:
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Field 'text' is required.")
    if not portfolio or len(portfolio) == 0:
        raise HTTPException(status_code=400, detail="Field 'portfolio' must contain at least one item.")


@app.post("/match")
async def match_design(request: Request):
    content_type = request.headers.get("content-type", "")

    user_text: Optional[str] = None
    user_image_embedding: Optional[torch.Tensor] = None
    portfolio_items: Optional[List[PortfolioItem]] = None
    top_k = DEFAULT_TOP_K
    threshold = MIN_SCORE_THRESHOLD

    try:
        if "multipart/form-data" in content_type:
            form_data = await request.form()

            image_file = form_data.get("image")
            user_text = form_data.get("text")
            portfolio_raw = form_data.get("portfolio")
            top_k_raw = form_data.get("topK")
            threshold_raw = form_data.get("threshold")

            if image_file is None:
                raise HTTPException(status_code=400, detail="Field 'image' file is required.")

            image_bytes = await image_file.read()
            if not image_bytes:
                raise HTTPException(status_code=400, detail="Uploaded 'image' file is empty.")

            if not portfolio_raw:
                raise HTTPException(status_code=400, detail="Field 'portfolio' is required in form-data.")

            try:
                parsed_portfolio = json.loads(portfolio_raw)
                portfolio_items = [PortfolioItem(**item) for item in parsed_portfolio]
            except Exception as exc:
                raise HTTPException(
                    status_code=400,
                    detail="Field 'portfolio' must be valid JSON array.",
                ) from exc

            if top_k_raw is not None:
                try:
                    top_k = max(1, min(MAX_TOP_K, int(top_k_raw)))
                except Exception as exc:
                    raise HTTPException(status_code=400, detail="Field 'topK' must be an integer.") from exc

            if threshold_raw is not None:
                try:
                    threshold = max(0.0, min(1.0, float(threshold_raw)))
                except Exception as exc:
                    raise HTTPException(status_code=400, detail="Field 'threshold' must be a number.") from exc

            user_image_embedding = encode_image(image_bytes)

        elif "application/json" in content_type:
            payload = MatchJsonRequest(**(await request.json()))
            user_text = payload.text
            portfolio_items = payload.portfolio
            user_image_embedding = encode_image(payload.imageUrl)
            top_k = payload.topK or DEFAULT_TOP_K
            threshold = payload.threshold if payload.threshold is not None else MIN_SCORE_THRESHOLD

        else:
            raise HTTPException(
                status_code=415,
                detail="Unsupported content type. Use multipart/form-data or application/json.",
            )

        _validate_match_payload(user_text, portfolio_items)
        normalized_user_text = user_text.strip()
        user_text_embedding = encode_text(normalized_user_text)
        user_keywords = extract_keywords(normalized_user_text)
        image_weight, text_weight = compute_dynamic_weights(normalized_user_text)

        results = []

        for index, item in enumerate(portfolio_items):
            try:
                portfolio_image_embedding = encode_image(item.imageUrl)
                portfolio_text_embedding = encode_text(item.description)
                vendor_keywords = extract_keywords(item.description)

                image_score = cosine_similarity_score(user_image_embedding, portfolio_image_embedding)
                text_score = cosine_similarity_score(user_text_embedding, portfolio_text_embedding)
                keyword_boost, matched_keywords = compute_keyword_boost(user_keywords, vendor_keywords)
                final_score = calculate_final_score(
                    image_score=image_score,
                    text_score=text_score,
                    keyword_boost=keyword_boost,
                    image_weight=image_weight,
                    text_weight=text_weight,
                )

                if final_score < threshold:
                    continue

                results.append(
                    {
                        "index": index,
                        "imageScore": round(image_score, 4),
                        "textScore": round(text_score, 4),
                        "keywordBoost": round(keyword_boost, 4),
                        "weights": {
                            "image": image_weight,
                            "text": text_weight,
                        },
                        "finalScore": round(final_score, 4),
                        "explain": {
                            "matchedKeywords": matched_keywords,
                            "matchedKeywordCount": len(matched_keywords),
                            "thresholdUsed": threshold,
                            "passedThreshold": final_score >= threshold,
                            "reason": (
                                "Strong keyword and multimodal similarity match."
                                if len(matched_keywords) >= 2
                                else "Scored by image-text similarity with limited keyword overlap."
                            ),
                        },
                    }
                )
            except Exception as exc:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to process portfolio item at index {index}: {exc}",
                ) from exc

        results.sort(key=lambda item: item["finalScore"], reverse=True)
        return results[:top_k]

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Match processing failed: {exc}") from exc
