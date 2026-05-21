import numpy as np
from sklearn.decomposition import PCA


def project_pca(embedding: np.ndarray) -> np.ndarray:
    n = min(3, embedding.shape[1])
    result = PCA(n_components=n).fit_transform(embedding)
    if result.shape[1] < 3:
        result = np.hstack([result, np.zeros((result.shape[0], 3 - result.shape[1]))])
    return result
