from clip_utils import compute_similarity, encode_image, encode_text


if __name__ == "__main__":
    image_vec = encode_image("https://example.com/dress.jpg")
    text_vec = encode_text("red floral dress")

    score = compute_similarity(image_vec, text_vec)
    print("Similarity:", score)
