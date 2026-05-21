import numpy as np
from sklearn.manifold import TSNE


def project_tsne(embedding: np.ndarray) -> np.ndarray:
    perplexity = min(30, max(5, embedding.shape[0] // 5))
    tsne = TSNE(n_components=3, perplexity=perplexity, random_state=42)
    return tsne.fit_transform(embedding)
