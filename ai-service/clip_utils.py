from io import BytesIO
from typing import BinaryIO, Union

import clip
import requests
import torch
from PIL import Image

# Load model once at import time.
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)
model.eval()


def _load_image(image_input: Union[str, BinaryIO]) -> Image.Image:
    if isinstance(image_input, str):
        response = requests.get(image_input, timeout=10)
        response.raise_for_status()
        return Image.open(BytesIO(response.content)).convert("RGB")

    # Accept uploaded file-like objects (e.g., FastAPI UploadFile.file)
    return Image.open(image_input).convert("RGB")


def encode_image(image_input: Union[str, BinaryIO]) -> torch.Tensor:
    image = _load_image(image_input)
    image_tensor = preprocess(image).unsqueeze(0).to(device)

    with torch.no_grad():
        image_features = model.encode_image(image_tensor)

    return image_features / image_features.norm(dim=-1, keepdim=True)


def encode_text(text: str) -> torch.Tensor:
    text_input = clip.tokenize([text]).to(device)

    with torch.no_grad():
        text_features = model.encode_text(text_input)

    return text_features / text_features.norm(dim=-1, keepdim=True)


def compute_similarity(vec1: torch.Tensor, vec2: torch.Tensor) -> float:
    return float((vec1 @ vec2.T).item())
